from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.models import ProtectedError
from django.core.exceptions import ValidationError
from facilities.models import Category, Facility
from reports.models import IssueReport, IssueType, IssueStatus

User = get_user_model()


class IssueReportModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='reporter@lpu.in',
            password='Password123!'
        )
        self.category = Category.objects.create(name='Washrooms')
        self.facility = Facility.objects.create(
            name='Block 32 1st Floor Restroom',
            category=self.category,
            building='Block 32'
        )

    def test_issue_report_creation_and_defaults(self):
        report = IssueReport.objects.create(
            user=self.user,
            facility=self.facility,
            title='Water Leakage in Basin',
            description='Tap is leaking continuously near entrance basin.',
            issue_type=IssueType.WATER
        )
        self.assertEqual(report.status, IssueStatus.PENDING)
        self.assertEqual(report.issue_type, IssueType.WATER)
        self.assertEqual(self.user.issue_reports.count(), 1)
        self.assertEqual(self.facility.issue_reports.count(), 1)
        self.assertIn('Water Leakage in Basin', str(report))
        self.assertIn('Block 32 1st Floor Restroom', str(report))
        self.assertIsNotNone(report.created_at)
        self.assertIsNotNone(report.updated_at)

    def test_user_deletion_protection_when_reports_exist(self):
        IssueReport.objects.create(
            user=self.user,
            facility=self.facility,
            title='Broken Light Switch',
            description='Switchboard sparking on 1st floor.',
            issue_type=IssueType.ELECTRICAL
        )
        # User cannot be deleted while they have associated issue reports
        with self.assertRaises(ProtectedError):
            self.user.delete()

    def test_facility_deletion_protection_when_reports_exist(self):
        IssueReport.objects.create(
            user=self.user,
            facility=self.facility,
            title='Dustbin Overflow',
            description='Corridor dustbin needs emptying.',
            issue_type=IssueType.CLEANLINESS
        )
        # Facility cannot be deleted while it has associated issue reports
        with self.assertRaises(ProtectedError):
            self.facility.delete()

    def test_status_transition(self):
        report = IssueReport.objects.create(
            user=self.user,
            facility=self.facility,
            title='AC Unit Malfunction',
            description='AC not turning on.',
            issue_type=IssueType.EQUIPMENT
        )
        report.status = IssueStatus.IN_PROGRESS
        report.save()
        report.refresh_from_db()
        self.assertEqual(report.status, IssueStatus.IN_PROGRESS)

        report.status = IssueStatus.RESOLVED
        report.save()
        report.refresh_from_db()
        self.assertEqual(report.status, IssueStatus.RESOLVED)

    def test_invalid_issue_type_choice_raises_validation_error(self):
        invalid_report = IssueReport(
            user=self.user,
            facility=self.facility,
            title='Invalid Type Issue',
            description='Testing invalid choice.',
            issue_type='INVALID_TYPE'
        )
        with self.assertRaises(ValidationError):
            invalid_report.full_clean()

    def test_invalid_status_choice_raises_validation_error(self):
        invalid_report = IssueReport(
            user=self.user,
            facility=self.facility,
            title='Invalid Status Issue',
            description='Testing invalid status choice.',
            issue_type=IssueType.MAINTENANCE,
            status='NON_EXISTENT_STATUS'
        )
        with self.assertRaises(ValidationError):
            invalid_report.full_clean()
