from rest_framework.permissions import BasePermission, SAFE_METHODS
from accounts.models import Role


class IssueReportPermission(BasePermission):
    """
    Role-based access control for Issue Reports:
    - STUDENT:
      * Can submit new reports (POST).
      * Can only view their own reports (GET / SAFE).
      * Cannot update (PATCH/PUT) or delete (DELETE).
    - FACULTY:
      * Can submit new reports (POST).
      * Can view all reports across campus (GET / SAFE).
      * Can update status of any report (PATCH).
      * Cannot delete reports (DELETE) or modify non-status fields.
    - ADMIN:
      * Full management permissions including deletion (DELETE).
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        user = request.user
        role = getattr(user, 'role', None)

        # All authenticated roles can read and submit reports
        if request.method in SAFE_METHODS or request.method == 'POST':
            return True

        # Status updates (PATCH) are permitted only for FACULTY and ADMIN
        if request.method == 'PATCH':
            return role in (Role.FACULTY, Role.ADMIN)

        # Deletion is strictly restricted to ADMIN
        if request.method == 'DELETE':
            return role == Role.ADMIN

        # Any other method (e.g. PUT) is disallowed
        return False

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False

        user = request.user
        role = getattr(user, 'role', None)

        if request.method in SAFE_METHODS:
            # Faculty and Admin can inspect any report; Students only their own
            if role in (Role.FACULTY, Role.ADMIN):
                return True
            return obj.user == user

        if request.method == 'PATCH':
            # Faculty and Admin can update report status
            return role in (Role.FACULTY, Role.ADMIN)

        if request.method == 'DELETE':
            # Strictly Admin
            return role == Role.ADMIN

        return False
