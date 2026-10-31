from rest_framework.permissions import BasePermission, SAFE_METHODS
from accounts.models import Role


class IsAdminOrReadOnly(BasePermission):
    """
    Custom permission for facility and category endpoints:
    - Safe read operations (GET, HEAD, OPTIONS) are allowed for any authenticated user (STUDENT, FACULTY, ADMIN).
    - State-modifying operations (POST, PUT, PATCH, DELETE) are strictly restricted to users with Role.ADMIN.
    - Unauthenticated requests are denied.
    """
    message = 'Access restricted to administrator accounts.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.method in SAFE_METHODS:
            return True

        return bool(request.user.role == Role.ADMIN)
