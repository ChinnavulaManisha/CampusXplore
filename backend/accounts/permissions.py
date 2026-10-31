from rest_framework.permissions import BasePermission
from accounts.models import Role


class IsStudent(BasePermission):
    """
    Permission class that grants access only to authenticated users with the STUDENT role.
    """
    message = 'Access restricted to student accounts.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == Role.STUDENT
        )


class IsFaculty(BasePermission):
    """
    Permission class that grants access only to authenticated users with the FACULTY role.
    """
    message = 'Access restricted to faculty accounts.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == Role.FACULTY
        )


class IsAdminRole(BasePermission):
    """
    Permission class that grants access only to authenticated users with the ADMIN role.
    Strictly verifies request.user.role == Role.ADMIN without substituting is_staff/is_superuser.
    """
    message = 'Access restricted to administrator accounts.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == Role.ADMIN
        )
