from datetime import timedelta
from django.test import TestCase, RequestFactory
from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.admin.sites import AdminSite
from django.db.utils import IntegrityError
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import Role
from accounts.admin import UserAdmin, StaffUserCreationForm, CustomUserCreationForm
from accounts.permissions import IsStudent, IsFaculty, IsAdminRole

User = get_user_model()


class CustomUserModelTests(TestCase):
    def test_create_student_user(self):
        user = User.objects.create_user(
            email='student@lpu.in',
            password='Password123!'
        )
        self.assertEqual(user.email, 'student@lpu.in')
        self.assertEqual(user.role, Role.STUDENT)
        self.assertTrue(user.check_password('Password123!'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_active)
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)

    def test_create_user_prevents_admin_assignment_via_extra_fields(self):
        # Security requirement: create_user() must ALWAYS create STUDENT accounts
        # even if an attempt is made to pass role=ADMIN in extra_fields
        user = User.objects.create_user(
            email='attacker@lpu.in',
            password='Password123!',
            role=Role.ADMIN
        )
        self.assertEqual(user.role, Role.STUDENT)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_prevents_staff_escalation(self):
        # Security requirement: create_user() must unconditionally enforce is_staff=False
        user = User.objects.create_user(
            email='staff_attacker@lpu.in',
            password='Password123!',
            is_staff=True
        )
        self.assertFalse(user.is_staff)
        self.assertEqual(user.role, Role.STUDENT)

    def test_create_user_prevents_superuser_escalation(self):
        # Security requirement: create_user() must unconditionally enforce is_superuser=False
        user = User.objects.create_user(
            email='root_attacker@lpu.in',
            password='Password123!',
            is_superuser=True
        )
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.role, Role.STUDENT)

    def test_create_superuser_enforces_admin_and_staff(self):
        superuser = User.objects.create_superuser(
            email='admin@lpu.in',
            password='AdminPassword123!'
        )
        self.assertEqual(superuser.email, 'admin@lpu.in')
        self.assertEqual(superuser.role, Role.ADMIN)
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_active)

    def test_email_normalization(self):
        user = User.objects.create_user(
            email='TestStudent@LPU.IN',
            password='Password123!'
        )
        # Domain portion of email must be normalized to lowercase
        self.assertEqual(user.email, 'TestStudent@lpu.in')

    def test_email_uniqueness(self):
        User.objects.create_user(
            email='unique@lpu.in',
            password='Password123!'
        )
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email='unique@lpu.in',
                password='AnotherPassword123!'
            )

    def test_create_user_without_email_raises_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email='',
                password='Password123!'
            )

    def test_user_string_representation(self):
        user = User.objects.create_user(
            email='testuser@lpu.in',
            password='Password123!'
        )
        self.assertIn('testuser@lpu.in', str(user))
        self.assertIn(Role.STUDENT, str(user))


class UserAdminPermissionSecurityTests(TestCase):
    def setUp(self):
        self.superuser = User.objects.create_superuser(
            email='superadmin@lpu.in',
            password='SuperAdminPass123!'
        )
        self.staff_user = User.objects.create_user(
            email='staffmember@lpu.in',
            password='StaffPass123!'
        )
        self.staff_user.is_staff = True
        self.staff_user.save()

        self.target_student = User.objects.create_user(
            email='targetstudent@lpu.in',
            password='StudentPass123!'
        )

        self.site = AdminSite()
        self.admin = UserAdmin(User, self.site)
        self.rf = RequestFactory()

    def test_staff_cannot_modify_privileged_fields_in_readonly_fields(self):
        req = self.rf.get('/admin/accounts/user/1/change/')
        req.user = self.staff_user

        readonly = self.admin.get_readonly_fields(req, obj=self.target_student)
        for privileged in ['role', 'is_staff', 'is_superuser', 'groups', 'user_permissions']:
            self.assertIn(privileged, readonly, f"Staff should not be able to edit {privileged}")

    def test_superuser_retains_full_attribute_modification_capabilities(self):
        req = self.rf.get('/admin/accounts/user/1/change/')
        req.user = self.superuser

        readonly = self.admin.get_readonly_fields(req, obj=self.target_student)
        for privileged in ['role', 'is_staff', 'is_superuser', 'groups', 'user_permissions']:
            self.assertNotIn(privileged, readonly, f"Superuser should be able to edit {privileged}")

    def test_staff_add_user_form_excludes_privileged_fields(self):
        req = self.rf.get('/admin/accounts/user/add/')
        req.user = self.staff_user

        form_cls = self.admin.get_form(req, obj=None)
        self.assertTrue(issubclass(form_cls, StaffUserCreationForm))

        fieldsets = self.admin.get_fieldsets(req, obj=None)
        form_fields = [f for _, fdict in fieldsets for f in fdict.get('fields', ())]
        for privileged in ['role', 'is_staff', 'is_superuser', 'groups', 'user_permissions']:
            self.assertNotIn(privileged, form_fields)

    def test_superuser_add_user_form_includes_privileged_fields(self):
        req = self.rf.get('/admin/accounts/user/add/')
        req.user = self.superuser

        form_cls = self.admin.get_form(req, obj=None)
        self.assertTrue(issubclass(form_cls, CustomUserCreationForm))

        fieldsets = self.admin.get_fieldsets(req, obj=None)
        form_fields = [f for _, fdict in fieldsets for f in fdict.get('fields', ())]
        self.assertIn('role', form_fields)
        self.assertIn('is_staff', form_fields)
        self.assertIn('is_superuser', form_fields)

    def test_staff_save_model_forces_student_and_non_staff_on_creation(self):
        req = self.rf.post('/admin/accounts/user/add/')
        req.user = self.staff_user

        new_user = User(
            email='newstudent@lpu.in',
            role=Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        self.admin.save_model(req, new_user, form=None, change=False)
        self.assertEqual(new_user.role, Role.STUDENT)
        self.assertFalse(new_user.is_staff)
        self.assertFalse(new_user.is_superuser)

    def test_staff_save_model_prevents_tampering_with_existing_privileged_user(self):
        req = self.rf.post('/admin/accounts/user/1/change/')
        req.user = self.staff_user

        # Staff attempts to modify the superuser
        tampered_user = User.objects.get(pk=self.superuser.pk)
        tampered_user.role = Role.STUDENT
        tampered_user.is_superuser = False
        tampered_user.is_staff = False

        self.admin.save_model(req, tampered_user, form=None, change=True)
        self.superuser.refresh_from_db()
        self.assertEqual(self.superuser.role, Role.ADMIN)
        self.assertTrue(self.superuser.is_superuser)
        self.assertTrue(self.superuser.is_staff)

    def test_staff_cannot_delete_superuser(self):
        req_staff = self.rf.post('/admin/accounts/user/1/delete/')
        req_staff.user = self.staff_user
        self.assertFalse(self.admin.has_delete_permission(req_staff, obj=self.superuser))

        req_super = self.rf.post('/admin/accounts/user/1/delete/')
        req_super.user = self.superuser
        self.assertTrue(self.admin.has_delete_permission(req_super, obj=self.superuser))


class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.refresh_url = '/api/auth/token/refresh/'
        self.logout_url = '/api/auth/logout/'
        self.profile_url = '/api/auth/me/'

        self.valid_student_data = {
            'email': 'student.test@lpu.in',
            'password': 'SecurePassword123!',
            'first_name': 'Test',
            'last_name': 'Student'
        }

    def test_student_registration_success(self):
        response = self.client.post(self.register_url, self.valid_student_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['email'], 'student.test@lpu.in')
        self.assertEqual(response.data['user']['role'], Role.STUDENT)
        self.assertEqual(response.data['user']['first_name'], 'Test')
        self.assertEqual(response.data['user']['last_name'], 'Student')
        self.assertIn('id', response.data['user'])
        self.assertNotIn('password', response.data['user'])

        # Verify password hashing in database
        user = User.objects.get(email='student.test@lpu.in')
        self.assertEqual(user.role, Role.STUDENT)
        self.assertTrue(user.check_password('SecurePassword123!'))

    def test_registration_rejects_duplicate_email(self):
        self.client.post(self.register_url, self.valid_student_data, format='json')
        response = self.client.post(self.register_url, self.valid_student_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_registration_rejects_case_insensitive_duplicate_email(self):
        self.client.post(self.register_url, self.valid_student_data, format='json')
        duplicate_data = self.valid_student_data.copy()
        duplicate_data['email'] = 'STUDENT.TEST@LPU.IN'
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_registration_password_validation_failure(self):
        weak_data = self.valid_student_data.copy()
        weak_data['password'] = '123'
        response = self.client.post(self.register_url, weak_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_registration_prevents_admin_and_faculty_role_tampering(self):
        malicious_data = self.valid_student_data.copy()
        malicious_data['email'] = 'attacker@lpu.in'
        malicious_data['role'] = Role.ADMIN
        malicious_data['is_staff'] = True
        malicious_data['is_superuser'] = True

        response = self.client.post(self.register_url, malicious_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], Role.STUDENT)

        user = User.objects.get(email='attacker@lpu.in')
        self.assertEqual(user.role, Role.STUDENT)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

        # Faculty tampering test
        faculty_data = self.valid_student_data.copy()
        faculty_data['email'] = 'faculty_tamper@lpu.in'
        faculty_data['role'] = Role.FACULTY
        response = self.client.post(self.register_url, faculty_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user_fac = User.objects.get(email='faculty_tamper@lpu.in')
        self.assertEqual(user_fac.role, Role.STUDENT)

    def test_registration_never_leaks_password_hash_in_payload(self):
        response = self.client.post(self.register_url, self.valid_student_data, format='json')
        raw_text = str(response.data)
        self.assertNotIn('password', response.data['user'])
        self.assertNotIn('pbkdf2', raw_text)
        self.assertNotIn('argon2', raw_text)

    def test_login_success(self):
        User.objects.create_user(
            email='login.student@lpu.in',
            password='ValidPassword123!',
            first_name='Login',
            last_name='Student'
        )

        login_data = {
            'email': 'login.student@lpu.in',
            'password': 'ValidPassword123!'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'login.student@lpu.in')
        self.assertEqual(response.data['user']['role'], Role.STUDENT)

    def test_login_invalid_password_returns_generic_error(self):
        User.objects.create_user(
            email='validuser@lpu.in',
            password='ValidPassword123!'
        )

        response = self.client.post(
            self.login_url,
            {'email': 'validuser@lpu.in', 'password': 'WrongPassword999!'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['detail'], 'Invalid email or password.')

    def test_login_nonexistent_email_returns_identical_generic_error(self):
        response = self.client.post(
            self.login_url,
            {'email': 'nonexistent@lpu.in', 'password': 'AnyPassword123!'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['detail'], 'Invalid email or password.')

    def test_login_inactive_user_rejected(self):
        user = User.objects.create_user(
            email='inactive@lpu.in',
            password='ValidPassword123!'
        )
        user.is_active = False
        user.save()

        response = self.client.post(
            self.login_url,
            {'email': 'inactive@lpu.in', 'password': 'ValidPassword123!'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_token_refresh(self):
        user = User.objects.create_user(
            email='refreshtest@lpu.in',
            password='ValidPassword123!'
        )
        refresh = RefreshToken.for_user(user)

        response = self.client.post(
            self.refresh_url,
            {'refresh': str(refresh)},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_user_a_can_blacklist_own_refresh_token(self):
        user_a = User.objects.create_user(
            email='usera@lpu.in',
            password='ValidPassword123!'
        )
        refresh_a = RefreshToken.for_user(user_a)
        access_a = str(refresh_a.access_token)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_a}')
        response = self.client.post(
            self.logout_url,
            {'refresh': str(refresh_a)},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Successfully logged out.')

        # Attempting to refresh using blacklisted token must fail with 401
        self.client.credentials()
        refresh_response = self.client.post(
            self.refresh_url,
            {'refresh': str(refresh_a)},
            format='json'
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_a_cannot_blacklist_user_b_refresh_token(self):
        user_a = User.objects.create_user(
            email='user_a_tamper@lpu.in',
            password='ValidPassword123!'
        )
        user_b = User.objects.create_user(
            email='user_b_victim@lpu.in',
            password='ValidPassword123!'
        )
        refresh_a = RefreshToken.for_user(user_a)
        refresh_b = RefreshToken.for_user(user_b)
        access_a = str(refresh_a.access_token)

        # User A authenticates and attempts to logout passing User B's refresh token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_a}')
        response = self.client.post(
            self.logout_url,
            {'refresh': str(refresh_b)},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
        self.assertEqual(
            response.data['detail'],
            'You cannot logout with a token belonging to another user.'
        )

    def test_user_b_token_remains_usable_after_rejected_cross_user_logout(self):
        user_a = User.objects.create_user(
            email='user_a_attacker@lpu.in',
            password='ValidPassword123!'
        )
        user_b = User.objects.create_user(
            email='user_b_safe@lpu.in',
            password='ValidPassword123!'
        )
        refresh_a = RefreshToken.for_user(user_a)
        refresh_b = RefreshToken.for_user(user_b)
        access_a = str(refresh_a.access_token)

        # User A attempts cross-user logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_a}')
        self.client.post(
            self.logout_url,
            {'refresh': str(refresh_b)},
            format='json'
        )

        # User B's refresh token must still work and be fully usable
        self.client.credentials()
        refresh_response = self.client.post(
            self.refresh_url,
            {'refresh': str(refresh_b)},
            format='json'
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

    def test_logout_invalid_token_rejected(self):
        user = User.objects.create_user(
            email='invalidtokentest@lpu.in',
            password='ValidPassword123!'
        )
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = self.client.post(
            self.logout_url,
            {'refresh': 'this.is.a.completely.invalid.token'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
        self.assertEqual(response.data['detail'], 'Token is invalid or expired.')

    def test_logout_expired_token_rejected(self):
        user = User.objects.create_user(
            email='expiredtokentest@lpu.in',
            password='ValidPassword123!'
        )
        valid_refresh = RefreshToken.for_user(user)
        access = str(valid_refresh.access_token)

        # Generate an expired refresh token for this user
        expired_refresh = RefreshToken.for_user(user)
        expired_refresh.set_exp(lifetime=-timedelta(minutes=10))

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = self.client.post(
            self.logout_url,
            {'refresh': str(expired_refresh)},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
        self.assertEqual(response.data['detail'], 'Token is invalid or expired.')

    def test_logout_already_blacklisted_token_rejected_safely(self):
        user = User.objects.create_user(
            email='doubleblacklisting@lpu.in',
            password='ValidPassword123!'
        )
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        # First logout succeeds
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        first_resp = self.client.post(
            self.logout_url,
            {'refresh': str(refresh)},
            format='json'
        )
        self.assertEqual(first_resp.status_code, status.HTTP_200_OK)

        # Second logout with the exact same already-blacklisted token is rejected safely
        second_resp = self.client.post(
            self.logout_url,
            {'refresh': str(refresh)},
            format='json'
        )
        self.assertEqual(second_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', second_resp.data)
        self.assertEqual(second_resp.data['detail'], 'Token is invalid or expired.')

    def test_logout_requires_authentication(self):
        response = self.client.post(
            self.logout_url,
            {'refresh': 'dummy_token'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_unauthenticated_fails(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_authenticated_returns_safe_data(self):
        user = User.objects.create_user(
            email='profile.test@lpu.in',
            password='ValidPassword123!',
            first_name='Ananya',
            last_name='Sharma'
        )
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], user.id)
        self.assertEqual(response.data['email'], 'profile.test@lpu.in')
        self.assertEqual(response.data['role'], Role.STUDENT)
        self.assertEqual(response.data['first_name'], 'Ananya')
        self.assertEqual(response.data['last_name'], 'Sharma')
        self.assertIn('created_at', response.data)
        self.assertNotIn('password', response.data)


class RoleBasedPermissionTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email='student.role@lpu.in',
            password='Password123!'
        )
        # Create faculty directly
        self.faculty = User(
            email='faculty.role@lpu.in',
            role=Role.FACULTY
        )
        self.faculty.set_password('Password123!')
        self.faculty.save()

        # Create admin
        self.admin = User.objects.create_superuser(
            email='admin.role@lpu.in',
            password='AdminPassword123!'
        )

        self.is_student = IsStudent()
        self.is_faculty = IsFaculty()
        self.is_admin = IsAdminRole()
        self.rf = RequestFactory()

    def test_is_student_permission(self):
        req_student = self.rf.get('/')
        req_student.user = self.student
        self.assertTrue(self.is_student.has_permission(req_student, None))

        req_faculty = self.rf.get('/')
        req_faculty.user = self.faculty
        self.assertFalse(self.is_student.has_permission(req_faculty, None))

        req_admin = self.rf.get('/')
        req_admin.user = self.admin
        self.assertFalse(self.is_student.has_permission(req_admin, None))

    def test_is_faculty_permission(self):
        req_faculty = self.rf.get('/')
        req_faculty.user = self.faculty
        self.assertTrue(self.is_faculty.has_permission(req_faculty, None))

        req_student = self.rf.get('/')
        req_student.user = self.student
        self.assertFalse(self.is_faculty.has_permission(req_student, None))

        req_admin = self.rf.get('/')
        req_admin.user = self.admin
        self.assertFalse(self.is_faculty.has_permission(req_admin, None))

    def test_is_admin_role_strictly_enforces_role_admin(self):
        # Legitimate ADMIN user
        req_admin = self.rf.get('/')
        req_admin.user = self.admin
        self.assertTrue(self.is_admin.has_permission(req_admin, None))

        # STUDENT with is_staff=True attempt must be rejected (not role=ADMIN)
        fake_staff = User.objects.create_user(email='fakestaff@lpu.in', password='Password123!')
        fake_staff.is_staff = True
        fake_staff.save()
        req_fake_staff = self.rf.get('/')
        req_fake_staff.user = fake_staff
        self.assertFalse(self.is_admin.has_permission(req_fake_staff, None))

        # STUDENT with is_superuser=True attempt must be rejected (not role=ADMIN)
        fake_root = User.objects.create_user(email='fakeroot@lpu.in', password='Password123!')
        fake_root.is_superuser = True
        fake_root.save()
        req_fake_root = self.rf.get('/')
        req_fake_root.user = fake_root
        self.assertFalse(self.is_admin.has_permission(req_fake_root, None))

        # Ordinary student and faculty must be rejected
        req_student = self.rf.get('/')
        req_student.user = self.student
        self.assertFalse(self.is_admin.has_permission(req_student, None))

        req_faculty = self.rf.get('/')
        req_faculty.user = self.faculty
        self.assertFalse(self.is_admin.has_permission(req_faculty, None))


class CaseInsensitiveEmailUniqueConstraintTests(TestCase):
    def test_database_level_case_insensitive_email_unique_constraint(self):
        User.objects.create_user(
            email='casingtest@lpu.in',
            password='Password123!'
        )

        # Attempt to insert a case-variant directly into the DB bypassing serializer validation
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                User(
                    email='CASINGTEST@lpu.in',
                    role=Role.STUDENT
                ).save()
