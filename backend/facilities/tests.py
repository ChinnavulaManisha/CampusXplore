from decimal import Decimal
from django.test import TestCase
from django.db import transaction
from django.db.models import ProtectedError
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import Role
from facilities.models import Category, Facility

User = get_user_model()


class FacilityModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name='Academic',
            description='Academic buildings',
            icon='GraduationCap'
        )

    def test_category_creation_and_str(self):
        self.assertEqual(str(self.category), 'Academic')
        self.assertIsNotNone(self.category.created_at)

    def test_category_name_uniqueness(self):
        with self.assertRaises(IntegrityError):
            Category.objects.create(name='Academic')

    def test_facility_creation_and_str(self):
        facility = Facility.objects.create(
            name='Block 34 Lecture Hall',
            category=self.category,
            building='Block 34',
            latitude=Decimal('31.253000'),
            longitude=Decimal('75.704000')
        )
        self.assertEqual(str(facility), 'Block 34 Lecture Hall (Block 34)')
        self.assertEqual(self.category.facilities.count(), 1)
        self.assertTrue(facility.is_active)

    def test_category_deletion_protection(self):
        Facility.objects.create(
            name='Block 34 Lecture Hall',
            category=self.category,
            building='Block 34'
        )
        # Category cannot be deleted while it has associated facilities
        with self.assertRaises(ProtectedError):
            self.category.delete()

    def test_facility_valid_coordinates(self):
        facility = Facility(
            name='Main Gate Security',
            category=self.category,
            building='Main Gate',
            latitude=Decimal('31.253678'),
            longitude=Decimal('75.703456')
        )
        # Should not raise any ValidationError
        facility.full_clean()

    def test_facility_exact_boundary_coordinates(self):
        # Testing exact upper and lower boundary bounds for latitude and longitude
        facility_max = Facility(
            name='North-East Boundary Post',
            category=self.category,
            building='Boundary North',
            latitude=Decimal('90.000000'),
            longitude=Decimal('180.000000')
        )
        facility_max.full_clean()

        facility_min = Facility(
            name='South-West Boundary Post',
            category=self.category,
            building='Boundary South',
            latitude=Decimal('-90.000000'),
            longitude=Decimal('-180.000000')
        )
        facility_min.full_clean()

    def test_facility_nullable_coordinates(self):
        # Facilities without GPS coordinates should pass validation
        facility_none = Facility(
            name='Virtual Service Desk',
            category=self.category,
            building='Online',
            latitude=None,
            longitude=None
        )
        facility_none.full_clean()

    def test_facility_invalid_latitude_raises_validation_error(self):
        facility_high = Facility(
            name='Invalid Lat High',
            category=self.category,
            building='Test Block',
            latitude=Decimal('95.000000'),
            longitude=Decimal('75.000000')
        )
        with self.assertRaises(ValidationError):
            facility_high.full_clean()

        facility_low = Facility(
            name='Invalid Lat Low',
            category=self.category,
            building='Test Block',
            latitude=Decimal('-95.000000'),
            longitude=Decimal('75.000000')
        )
        with self.assertRaises(ValidationError):
            facility_low.full_clean()

    def test_facility_invalid_longitude_raises_validation_error(self):
        facility_high = Facility(
            name='Invalid Lon High',
            category=self.category,
            building='Test Block',
            latitude=Decimal('30.000000'),
            longitude=Decimal('185.000000')
        )
        with self.assertRaises(ValidationError):
            facility_high.full_clean()

        facility_low = Facility(
            name='Invalid Lon Low',
            category=self.category,
            building='Test Block',
            latitude=Decimal('30.000000'),
            longitude=Decimal('-185.000000')
        )
        with self.assertRaises(ValidationError):
            facility_low.full_clean()

    def test_facility_database_check_constraint_enforced(self):
        # Direct DB creation bypassing full_clean must be blocked by PostgreSQL CheckConstraint
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Facility.objects.create(
                    name='DB Constraint Test Lat',
                    category=self.category,
                    building='Test Block',
                    latitude=Decimal('99.999999'),
                    longitude=Decimal('75.000000')
                )

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Facility.objects.create(
                    name='DB Constraint Test Lon',
                    category=self.category,
                    building='Test Block',
                    latitude=Decimal('30.000000'),
                    longitude=Decimal('199.999999')
                )

    def test_seed_categories_command_idempotency(self):
        # Initial run of command
        call_command('seed_categories')
        count_after_first = Category.objects.count()
        self.assertEqual(count_after_first, 11)

        # Run command second time - must not create duplicates
        call_command('seed_categories')
        count_after_second = Category.objects.count()
        self.assertEqual(count_after_second, 11)


class CategoryDatabaseConstraintTests(TestCase):
    def test_database_level_case_insensitive_category_name_unique_constraint(self):
        Category.objects.create(name='Academic')

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Category.objects.create(name='ACADEMIC')

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Category.objects.create(name='academic')


class FacilityAPITests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(email='student@lpu.in', password='Password123!')
        self.faculty = User(email='faculty@lpu.in', role=Role.FACULTY)
        self.faculty.set_password('Password123!')
        self.faculty.save()
        self.admin = User.objects.create_superuser(email='admin@lpu.in', password='Password123!')

        self.student_token = str(RefreshToken.for_user(self.student).access_token)
        self.faculty_token = str(RefreshToken.for_user(self.faculty).access_token)
        self.admin_token = str(RefreshToken.for_user(self.admin).access_token)

        self.category_academic = Category.objects.create(name='Academic', icon='Book')
        self.category_food = Category.objects.create(name='Food & Cafeteria', icon='Coffee')

        self.facility_active = Facility.objects.create(
            name='Central Library Reading Room',
            category=self.category_academic,
            building='Block 34',
            latitude=Decimal('31.253000'),
            longitude=Decimal('75.704000'),
            is_active=True
        )
        self.facility_inactive = Facility.objects.create(
            name='Old Cafeteria Kiosk',
            category=self.category_food,
            building='Block 12',
            latitude=Decimal('31.251000'),
            longitude=Decimal('75.702000'),
            is_active=False
        )

        self.facilities_url = '/api/facilities/'
        self.detail_url = f'/api/facilities/{self.facility_active.id}/'
        self.inactive_detail_url = f'/api/facilities/{self.facility_inactive.id}/'

    # Authentication & Access Control Tests
    def test_unauthenticated_request_rejected(self):
        response = self.client.get(self.facilities_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_can_list_and_retrieve_active_facilities(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get(self.facilities_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('results', res.data)

        res_detail = self.client.get(self.detail_url)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data['name'], 'Central Library Reading Room')
        self.assertEqual(res_detail.data['category']['name'], 'Academic')

    def test_faculty_can_list_and_retrieve_active_facilities(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.faculty_token}')
        res = self.client.get(self.facilities_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res_detail = self.client.get(self.detail_url)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)

    def test_student_cannot_create_facility(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        payload = {
            'name': 'Robotics Lab',
            'category_id': self.category_academic.id,
            'building': 'Block 36'
        }
        res = self.client.post(self.facilities_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_faculty_cannot_create_facility(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.faculty_token}')
        payload = {
            'name': 'Robotics Lab',
            'category_id': self.category_academic.id,
            'building': 'Block 36'
        }
        res = self.client.post(self.facilities_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_update_facility(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.patch(self.detail_url, {'name': 'Hacked Name'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_faculty_cannot_update_facility(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.faculty_token}')
        res = self.client.patch(self.detail_url, {'name': 'Faculty Renamed'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_delete_facility(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.delete(self.detail_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_faculty_cannot_delete_facility(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.faculty_token}')
        res = self.client.delete(self.detail_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # Admin Management & Soft Deletion Tests
    def test_admin_can_create_facility(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            'name': 'Innovation Hub',
            'category_id': self.category_academic.id,
            'building': 'Block 38',
            'latitude': '31.254100',
            'longitude': '75.705200',
            'opening_hours': '08:00 - 20:00',
            'contact_number': '+91 1800 123 456'
        }
        res = self.client.post(self.facilities_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['name'], 'Innovation Hub')
        self.assertEqual(res.data['category']['name'], 'Academic')
        self.assertTrue(res.data['is_active'])

    def test_admin_can_update_facility_put_and_patch(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        # Full update (PUT)
        put_payload = {
            'name': 'Renovated Central Library',
            'category_id': self.category_academic.id,
            'building': 'Block 34 Level 2',
            'latitude': '31.253100',
            'longitude': '75.704100'
        }
        res_put = self.client.put(self.detail_url, put_payload, format='json')
        self.assertEqual(res_put.status_code, status.HTTP_200_OK)
        self.assertEqual(res_put.data['name'], 'Renovated Central Library')
        self.assertEqual(res_put.data['building'], 'Block 34 Level 2')

        # Partial update (PATCH)
        res_patch = self.client.patch(self.detail_url, {'opening_hours': '24/7'}, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data['opening_hours'], '24/7')

    def test_admin_soft_delete_facility(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.delete(self.detail_url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # Database record must NOT be deleted
        self.facility_active.refresh_from_db()
        self.assertFalse(self.facility_active.is_active)
        self.assertTrue(Facility.objects.filter(pk=self.facility_active.pk).exists())

        # Repeated DELETE is idempotent and succeeds safely
        repeat_res = self.client.delete(self.detail_url)
        self.assertEqual(repeat_res.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_can_reactivate_facility_via_patch(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.patch(self.inactive_detail_url, {'is_active': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.facility_inactive.refresh_from_db()
        self.assertTrue(self.facility_inactive.is_active)

    # Inactive Facility Visibility Tests
    def test_student_cannot_see_inactive_facility_in_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get(self.facilities_url)
        ids = [item['id'] for item in res.data['results']]
        self.assertIn(self.facility_active.id, ids)
        self.assertNotIn(self.facility_inactive.id, ids)

    def test_student_cannot_retrieve_inactive_facility_by_id(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get(self.inactive_detail_url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_faculty_cannot_retrieve_inactive_facility_by_id(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.faculty_token}')
        res = self.client.get(self.inactive_detail_url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_see_and_retrieve_inactive_facility(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res_list = self.client.get(self.facilities_url)
        ids = [item['id'] for item in res_list.data['results']]
        self.assertIn(self.facility_active.id, ids)
        self.assertIn(self.facility_inactive.id, ids)

        res_detail = self.client.get(self.inactive_detail_url)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertFalse(res_detail.data['is_active'])

    def test_admin_can_filter_by_is_active(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res_active = self.client.get(f'{self.facilities_url}?is_active=true')
        for f in res_active.data['results']:
            self.assertTrue(f['is_active'])

        res_inactive = self.client.get(f'{self.facilities_url}?is_active=false')
        for f in res_inactive.data['results']:
            self.assertFalse(f['is_active'])

    # Filtering, Search & Pagination Tests
    def test_filter_facilities_by_category_id_and_name(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        # By ID
        res_id = self.client.get(f'{self.facilities_url}?category={self.category_academic.id}')
        for f in res_id.data['results']:
            self.assertEqual(f['category']['id'], self.category_academic.id)

        # By Name
        res_name = self.client.get(f'{self.facilities_url}?category=Academic')
        for f in res_name.data['results']:
            self.assertEqual(f['category']['name'], 'Academic')

    def test_filter_facilities_by_building(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get(f'{self.facilities_url}?building=Block 34')
        for f in res.data['results']:
            self.assertIn('Block 34', f['building'])

    def test_search_facilities(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get(f'{self.facilities_url}?search=Library')
        self.assertEqual(len(res.data['results']), 1)
        self.assertEqual(res.data['results'][0]['name'], 'Central Library Reading Room')

    def test_facility_pagination(self):
        # Create additional facilities
        for i in range(12):
            Facility.objects.create(
                name=f'Facility Paginated {i}',
                category=self.category_academic,
                building=f'Block {i}'
            )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get(f'{self.facilities_url}?page_size=5')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['results']), 5)
        self.assertIsNotNone(res.data['next'])

    # Validation Tests
    def test_facility_create_missing_required_fields(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.post(self.facilities_url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', res.data)
        self.assertIn('category_id', res.data)
        self.assertIn('building', res.data)

    def test_facility_create_invalid_category(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            'name': 'Test Facility',
            'category_id': 99999,
            'building': 'Block 1'
        }
        res = self.client.post(self.facilities_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('category_id', res.data)

    def test_facility_coordinate_validation(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        # Invalid Latitude (> 90)
        res_lat = self.client.post(
            self.facilities_url,
            {
                'name': 'Invalid Lat Facility',
                'category_id': self.category_academic.id,
                'building': 'Block 1',
                'latitude': '95.000000',
                'longitude': '75.000000'
            },
            format='json'
        )
        self.assertEqual(res_lat.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('latitude', res_lat.data)

        # Invalid Longitude (> 180)
        res_lon = self.client.post(
            self.facilities_url,
            {
                'name': 'Invalid Lon Facility',
                'category_id': self.category_academic.id,
                'building': 'Block 1',
                'latitude': '30.000000',
                'longitude': '185.000000'
            },
            format='json'
        )
        self.assertEqual(res_lon.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('longitude', res_lon.data)

    def test_facility_duplicate_prevention(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            'name': 'central library reading room',  # Case variation of existing active facility
            'category_id': self.category_academic.id,
            'building': 'block 34'  # Case variation of existing building
        }
        res = self.client.post(self.facilities_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', res.data)


class CategoryAPITests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(email='cat_student@lpu.in', password='Password123!')
        self.admin = User.objects.create_superuser(email='cat_admin@lpu.in', password='Password123!')

        self.student_token = str(RefreshToken.for_user(self.student).access_token)
        self.admin_token = str(RefreshToken.for_user(self.admin).access_token)

        self.category = Category.objects.create(
            name='Laboratories',
            description='Science and engineering labs',
            icon='FlaskConical'
        )
        self.facility_active = Facility.objects.create(
            name='Physics Lab',
            category=self.category,
            building='Block 28',
            is_active=True
        )
        self.facility_inactive = Facility.objects.create(
            name='Old Chemistry Lab',
            category=self.category,
            building='Block 28',
            is_active=False
        )

        self.categories_url = '/api/categories/'
        self.detail_url = f'/api/categories/{self.category.id}/'
        self.cat_facilities_url = f'/api/categories/{self.category.id}/facilities/'

    def test_list_categories_with_facility_count(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get(self.categories_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Students see active facility count only
        cat_data = next(c for c in res.data if c['id'] == self.category.id)
        self.assertEqual(cat_data['facility_count'], 1)

    def test_admin_category_facility_count_reflects_total(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(self.categories_url)
        cat_data = next(c for c in res.data if c['id'] == self.category.id)
        # Admins see total facility count (active + inactive)
        self.assertEqual(cat_data['facility_count'], 2)

    def test_admin_can_create_category(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            'name': 'Healthcare & Pharmacy',
            'description': 'Campus clinics and medical dispensaries',
            'icon': 'Cross'
        }
        res = self.client.post(self.categories_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['name'], 'Healthcare & Pharmacy')

    def test_student_cannot_create_category(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        payload = {'name': 'Student Club Area'}
        res = self.client.post(self.categories_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_case_insensitive_category_uniqueness_validation(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        # 'Laboratories' exists; attempt to create 'laboratories' in lowercase
        res = self.client.post(self.categories_url, {'name': 'laboratories'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', res.data)

    def test_category_safe_protected_deletion(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        # Deleting category that has associated facilities must return safe 400 error
        res = self.client.delete(self.detail_url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', res.data)
        self.assertIn('Cannot delete category because it has associated facilities', res.data['detail'])
        # Category still exists
        self.assertTrue(Category.objects.filter(pk=self.category.pk).exists())

    def test_admin_can_delete_empty_category(self):
        empty_cat = Category.objects.create(name='Empty Category', icon='Trash')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.delete(f'/api/categories/{empty_cat.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Category.objects.filter(pk=empty_cat.pk).exists())

    def test_category_facilities_endpoint(self):
        # Student sees only active facility
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res_student = self.client.get(self.cat_facilities_url)
        self.assertEqual(res_student.status_code, status.HTTP_200_OK)
        names_student = [f['name'] for f in res_student.data]
        self.assertIn('Physics Lab', names_student)
        self.assertNotIn('Old Chemistry Lab', names_student)

        # Admin sees both active and inactive facilities
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res_admin = self.client.get(self.cat_facilities_url)
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        names_admin = [f['name'] for f in res_admin.data]
        self.assertIn('Physics Lab', names_admin)
        self.assertIn('Old Chemistry Lab', names_admin)

