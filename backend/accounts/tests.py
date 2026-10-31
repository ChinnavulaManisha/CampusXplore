from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib.admin.sites import AdminSite
from django.db.utils import IntegrityError
from accounts.models import Role
from accounts.admin import UserAdmin, StaffUserCreationForm, CustomUserCreationForm

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
