from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.models import ProtectedError
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Role
from facilities.models import Category, Facility
from reports.models import IssueReport, IssueType, IssueStatus

User = get_user_model()


class IssueReportModelTests(TestCase):
    """
    Unit tests for IssueReport model data integrity, foreign key protection, and constraints.
    """
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
            description='AC not turning on in lecture room.',
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


class IssueReportAPITests(APITestCase):
    """
    API, security, RBAC, creation tampering, and status transition tests for /api/reports/.
    """
    def setUp(self):
        self.category = Category.objects.create(name='Academic Block', icon='Building')
        self.active_facility = Facility.objects.create(
            name='Central Library Reading Hall',
            category=self.category,
            building='Block 37',
            is_active=True
        )
        self.inactive_facility = Facility.objects.create(
            name='Old Chemistry Lab',
            category=self.category,
            building='Block 12',
            is_active=False
        )

        self.student_a = User.objects.create_user(
            email='student_a@lpu.in',
            password='Password123!',
            first_name='Student',
            last_name='A'
        )
        self.student_b = User.objects.create_user(
            email='student_b@lpu.in',
            password='Password123!',
            first_name='Student',
            last_name='B'
        )
        self.faculty = User.objects.create_user(
            email='faculty@lpu.in',
            password='Password123!',
            first_name='Faculty',
            last_name='User'
        )
        self.faculty.role = Role.FACULTY
        self.faculty.save()

        self.admin = User.objects.create_superuser(
            email='admin@lpu.in',
            password='Password123!',
            first_name='Admin',
            last_name='User'
        )

        self.reports_url = '/api/reports/'

    # 1. Authentication requirement
    def test_unauthenticated_requests_denied(self):
        # GET
        response = self.client.get(self.reports_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # POST
        payload = {
            'facility': self.active_facility.id,
            'title': 'Broken Door Hinge',
            'description': 'Main entrance door does not close properly.',
            'issue_type': IssueType.MAINTENANCE,
        }
        response = self.client.post(self.reports_url, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # 2. Student creation
    def test_student_can_create_report(self):
        self.client.force_authenticate(user=self.student_a)
        payload = {
            'facility': self.active_facility.id,
            'title': 'Projector flickering in room 301',
            'description': 'HDMI display cable seems loose and screen keeps blinking.',
            'issue_type': IssueType.EQUIPMENT,
        }
        response = self.client.post(self.reports_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], payload['title'])
        self.assertEqual(response.data['status'], IssueStatus.PENDING)
        self.assertEqual(response.data['user']['email'], self.student_a.email)
        self.assertEqual(response.data['facility']['name'], self.active_facility.name)

        # Verify DB entry
        report = IssueReport.objects.get(pk=response.data['id'])
        self.assertEqual(report.user, self.student_a)
        self.assertEqual(report.status, IssueStatus.PENDING)

    # 3. Creation security: user and status tampering prevented
    def test_creation_security_tampering_prevented(self):
        self.client.force_authenticate(user=self.student_a)
        # Malicious payload attempting to impersonate another user and bypass pending status
        payload = {
            'facility': self.active_facility.id,
            'title': 'Attempted privilege escalation report',
            'description': 'Testing that user cannot spoof reporter or status.',
            'issue_type': IssueType.OTHER,
            'user': self.student_b.id,
            'user_id': self.student_b.id,
            'status': IssueStatus.RESOLVED,
        }
        response = self.client.post(self.reports_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Confirm the returned data and the persisted database record strictly enforce
        # the authenticated user (student_a) and initial PENDING status
        self.assertEqual(response.data['status'], IssueStatus.PENDING)
        self.assertEqual(response.data['user']['id'], self.student_a.id)
        self.assertEqual(response.data['user']['email'], self.student_a.email)

        report = IssueReport.objects.get(pk=response.data['id'])
        self.assertEqual(report.user, self.student_a)
        self.assertEqual(report.status, IssueStatus.PENDING)

    # 4. Validation: Title constraints
    def test_create_validation_title_constraints(self):
        self.client.force_authenticate(user=self.student_a)
        # Title too short (< 3 chars)
        res_short = self.client.post(self.reports_url, {
            'facility': self.active_facility.id,
            'title': 'Hi',
            'description': 'Valid description for this issue report.',
            'issue_type': IssueType.MAINTENANCE,
        })
        self.assertEqual(res_short.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', res_short.data)

        # Blank title
        res_blank = self.client.post(self.reports_url, {
            'facility': self.active_facility.id,
            'title': '   ',
            'description': 'Valid description for this issue report.',
            'issue_type': IssueType.MAINTENANCE,
        })
        self.assertEqual(res_blank.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', res_blank.data)

    # 5. Validation: Description constraints
    def test_create_validation_description_constraints(self):
        self.client.force_authenticate(user=self.student_a)
        # Description too short (< 10 chars)
        res = self.client.post(self.reports_url, {
            'facility': self.active_facility.id,
            'title': 'Valid Title Here',
            'description': 'Short',
            'issue_type': IssueType.CLEANLINESS,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('description', res.data)

    # 6. Validation: Inactive facility rejected
    def test_create_validation_inactive_facility_rejected(self):
        self.client.force_authenticate(user=self.student_a)
        res = self.client.post(self.reports_url, {
            'facility': self.inactive_facility.id,
            'title': 'Issue in closed building',
            'description': 'Reporting an issue for an inactive lab facility.',
            'issue_type': IssueType.WATER,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('facility', res.data)

    # 7. Validation: Invalid issue type rejected
    def test_create_validation_invalid_issue_type_rejected(self):
        self.client.force_authenticate(user=self.student_a)
        res = self.client.post(self.reports_url, {
            'facility': self.active_facility.id,
            'title': 'Valid Title',
            'description': 'Valid description with sufficient length.',
            'issue_type': 'INVALID_TYPE',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('issue_type', res.data)

    # 8. Student Query Isolation: Student A sees only Student A's reports
    def test_student_query_isolation(self):
        report_a = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Report by Student A',
            description='Detailed description for Student A issue.',
            issue_type=IssueType.ELECTRICAL
        )
        report_b = IssueReport.objects.create(
            user=self.student_b,
            facility=self.active_facility,
            title='Report by Student B',
            description='Detailed description for Student B issue.',
            issue_type=IssueType.WATER
        )

        # Authenticate as Student A
        self.client.force_authenticate(user=self.student_a)
        res_a = self.client.get(self.reports_url)
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        ids_a = [item['id'] for item in res_a.data['results']]
        self.assertIn(report_a.id, ids_a)
        self.assertNotIn(report_b.id, ids_a)

        # Authenticate as Student B
        self.client.force_authenticate(user=self.student_b)
        res_b = self.client.get(self.reports_url)
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)
        ids_b = [item['id'] for item in res_b.data['results']]
        self.assertIn(report_b.id, ids_b)
        self.assertNotIn(report_a.id, ids_b)

    # 9. Student cannot retrieve another student's report detail
    def test_student_cannot_retrieve_other_student_report(self):
        report_b = IssueReport.objects.create(
            user=self.student_b,
            facility=self.active_facility,
            title='Student B Private Issue',
            description='Detailed description for private issue.',
            issue_type=IssueType.WATER
        )
        self.client.force_authenticate(user=self.student_a)
        res = self.client.get(f'{self.reports_url}{report_b.id}/')
        # Filtered queryset returns 404
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # 10. Student cannot update or patch reports
    def test_student_cannot_update_report(self):
        report_a = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Student A Issue',
            description='Detailed description for Student A issue.',
            issue_type=IssueType.ELECTRICAL
        )
        self.client.force_authenticate(user=self.student_a)
        res = self.client.patch(f'{self.reports_url}{report_a.id}/', {'status': IssueStatus.IN_PROGRESS})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # 11. Student cannot delete reports
    def test_student_cannot_delete_report(self):
        report_a = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Student A Issue',
            description='Detailed description for Student A issue.',
            issue_type=IssueType.ELECTRICAL
        )
        self.client.force_authenticate(user=self.student_a)
        res = self.client.delete(f'{self.reports_url}{report_a.id}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # 12. Faculty can view all reports across campus
    def test_faculty_can_view_all_reports(self):
        report_a = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Student A Report',
            description='Student A description here.',
            issue_type=IssueType.MAINTENANCE
        )
        report_b = IssueReport.objects.create(
            user=self.student_b,
            facility=self.active_facility,
            title='Student B Report',
            description='Student B description here.',
            issue_type=IssueType.CLEANLINESS
        )

        self.client.force_authenticate(user=self.faculty)
        res = self.client.get(self.reports_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in res.data['results']]
        self.assertIn(report_a.id, ids)
        self.assertIn(report_b.id, ids)

    # 13. Valid status transition: PENDING -> IN_PROGRESS
    def test_valid_status_transition_pending_to_in_progress(self):
        report = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Broken AC Unit',
            description='AC unit not cooling in lecture hall.',
            issue_type=IssueType.EQUIPMENT,
            status=IssueStatus.PENDING
        )
        self.client.force_authenticate(user=self.faculty)
        res = self.client.patch(f'{self.reports_url}{report.id}/', {'status': IssueStatus.IN_PROGRESS})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], IssueStatus.IN_PROGRESS)
        report.refresh_from_db()
        self.assertEqual(report.status, IssueStatus.IN_PROGRESS)

    # 14. Valid status transition: IN_PROGRESS -> RESOLVED
    def test_valid_status_transition_in_progress_to_resolved(self):
        report = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Broken AC Unit',
            description='AC unit not cooling in lecture hall.',
            issue_type=IssueType.EQUIPMENT,
            status=IssueStatus.IN_PROGRESS
        )
        self.client.force_authenticate(user=self.faculty)
        res = self.client.patch(f'{self.reports_url}{report.id}/', {'status': IssueStatus.RESOLVED})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], IssueStatus.RESOLVED)
        report.refresh_from_db()
        self.assertEqual(report.status, IssueStatus.RESOLVED)

    # 15. Valid status transition: PENDING -> REJECTED
    def test_valid_status_transition_pending_to_rejected(self):
        report = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Duplicate issue',
            description='Duplicate issue reported by mistake.',
            issue_type=IssueType.OTHER,
            status=IssueStatus.PENDING
        )
        self.client.force_authenticate(user=self.faculty)
        res = self.client.patch(f'{self.reports_url}{report.id}/', {'status': IssueStatus.REJECTED})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], IssueStatus.REJECTED)
        report.refresh_from_db()
        self.assertEqual(report.status, IssueStatus.REJECTED)

    # 16. Invalid status transition: PENDING -> RESOLVED (must go through IN_PROGRESS)
    def test_invalid_status_transition_pending_to_resolved_rejected(self):
        report = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Direct Jump Attempt',
            description='Testing invalid direct transition from pending to resolved.',
            issue_type=IssueType.WATER,
            status=IssueStatus.PENDING
        )
        self.client.force_authenticate(user=self.faculty)
        res = self.client.patch(f'{self.reports_url}{report.id}/', {'status': IssueStatus.RESOLVED})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', res.data)
        self.assertIn('Invalid status transition', str(res.data['status']))

    # 17. Terminal state: RESOLVED cannot transition to any other status
    def test_terminal_state_resolved_cannot_transition(self):
        report = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Already Resolved Issue',
            description='This issue has already been resolved.',
            issue_type=IssueType.ELECTRICAL,
            status=IssueStatus.RESOLVED
        )
        self.client.force_authenticate(user=self.faculty)
        res = self.client.patch(f'{self.reports_url}{report.id}/', {'status': IssueStatus.IN_PROGRESS})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', res.data)
        self.assertIn('terminal state', str(res.data['status']))

    # 18. Terminal state: REJECTED cannot transition to any other status
    def test_terminal_state_rejected_cannot_transition(self):
        report = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Already Rejected Issue',
            description='This issue has already been rejected.',
            issue_type=IssueType.CLEANLINESS,
            status=IssueStatus.REJECTED
        )
        self.client.force_authenticate(user=self.faculty)
        res = self.client.patch(f'{self.reports_url}{report.id}/', {'status': IssueStatus.IN_PROGRESS})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', res.data)
        self.assertIn('terminal state', str(res.data['status']))

    # 19. Faculty cannot modify non-status fields (title, description, facility, reporter)
    def test_faculty_cannot_modify_title_or_description(self):
        report = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Original Student Title',
            description='Original student description with enough characters.',
            issue_type=IssueType.MAINTENANCE,
            status=IssueStatus.PENDING
        )
        self.client.force_authenticate(user=self.faculty)
        # Attempt modifying title
        res = self.client.patch(f'{self.reports_url}{report.id}/', {
            'title': 'Faculty Tampered Title',
            'status': IssueStatus.IN_PROGRESS,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', res.data)

        # Confirm DB unchanged
        report.refresh_from_db()
        self.assertEqual(report.title, 'Original Student Title')
        self.assertEqual(report.status, IssueStatus.PENDING)

    # 20. Faculty cannot delete reports
    def test_faculty_cannot_delete_report(self):
        report = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Student Report',
            description='Original student description.',
            issue_type=IssueType.MAINTENANCE
        )
        self.client.force_authenticate(user=self.faculty)
        res = self.client.delete(f'{self.reports_url}{report.id}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(IssueReport.objects.filter(pk=report.id).exists())

    # 21. Admin can delete report
    def test_admin_can_delete_report(self):
        report = IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Report for Deletion',
            description='Original student description for deletion test.',
            issue_type=IssueType.MAINTENANCE
        )
        self.client.force_authenticate(user=self.admin)
        res = self.client.delete(f'{self.reports_url}{report.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(IssueReport.objects.filter(pk=report.id).exists())

    # 22. Filtering by status and issue_type
    def test_filtering_by_status_and_issue_type(self):
        IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Water Leak Block 37',
            description='Water leaking in washroom.',
            issue_type=IssueType.WATER,
            status=IssueStatus.PENDING
        )
        IssueReport.objects.create(
            user=self.student_a,
            facility=self.active_facility,
            title='Power Cut Block 37',
            description='Power cut in library.',
            issue_type=IssueType.ELECTRICAL,
            status=IssueStatus.IN_PROGRESS
        )

        self.client.force_authenticate(user=self.admin)

        # Filter status=PENDING
        res_pending = self.client.get(f'{self.reports_url}?status={IssueStatus.PENDING}')
        self.assertEqual(res_pending.status_code, status.HTTP_200_OK)
        for item in res_pending.data['results']:
            self.assertEqual(item['status'], IssueStatus.PENDING)

        # Filter issue_type=WATER
        res_water = self.client.get(f'{self.reports_url}?issue_type={IssueType.WATER}')
        self.assertEqual(res_water.status_code, status.HTTP_200_OK)
        for item in res_water.data['results']:
            self.assertEqual(item['issue_type'], IssueType.WATER)
