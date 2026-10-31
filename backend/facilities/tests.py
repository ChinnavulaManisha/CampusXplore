from decimal import Decimal
from django.test import TestCase
from django.db import transaction
from django.db.models import ProtectedError
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from django.core.management import call_command
from facilities.models import Category, Facility


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
