from django.db.models import Count, Q, ProtectedError
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import Role
from facilities.models import Category, Facility
from facilities.serializers import CategorySerializer, FacilitySerializer
from facilities.permissions import IsAdminOrReadOnly
from facilities.pagination import FacilityPagination


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, creating, retrieving, updating, and deleting categories.
    - Read: Authenticated users (STUDENT, FACULTY, ADMIN)
    - Write: ADMIN only
    - Prevents deletion of categories with attached facilities via ProtectedError handling.
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = FacilityPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def paginate_queryset(self, queryset):
        # Allow returning all categories as flat list unless ?page= is explicitly requested
        if 'page' not in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated and user.role == Role.ADMIN:
            # Admins see total facility counts including inactive ones
            return Category.objects.annotate(
                facility_count=Count('facilities')
            ).order_by('name')
        else:
            # Students and faculty see counts of active facilities only
            return Category.objects.annotate(
                facility_count=Count('facilities', filter=Q(facilities__is_active=True))
            ).order_by('name')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {
                    "detail": "Cannot delete category because it has associated facilities. Reassign or remove the facilities first."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def facilities(self, request, pk=None):
        """
        GET /api/categories/<id>/facilities/
        Returns facilities belonging to this specific category.
        Follows the same visibility rules: Students/Faculty see only active facilities.
        """
        category = self.get_object()
        user = request.user
        if user and user.is_authenticated and user.role == Role.ADMIN:
            queryset = category.facilities.select_related('category').all()
            is_active_param = request.query_params.get('is_active')
            if is_active_param is not None:
                if is_active_param.lower() in ('true', '1'):
                    queryset = queryset.filter(is_active=True)
                elif is_active_param.lower() in ('false', '0'):
                    queryset = queryset.filter(is_active=False)
        else:
            queryset = category.facilities.select_related('category').filter(is_active=True)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = FacilitySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = FacilitySerializer(queryset, many=True)
        return Response(serializer.data)


class FacilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing campus facilities:
    - Read: Authenticated users (STUDENT, FACULTY, ADMIN)
    - Write: ADMIN only
    - Deletion is implemented strictly as soft deletion (is_active=False).
    - Students and faculty only ever see active facilities (is_active=True).
    - Admins see both active and inactive facilities and can filter or reactivate them.
    """
    serializer_class = FacilitySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = FacilityPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'building', 'description']
    ordering_fields = ['name', 'building', 'created_at', 'updated_at']
    ordering = ['name']

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated and user.role == Role.ADMIN:
            queryset = Facility.objects.select_related('category').all()
            is_active_param = self.request.query_params.get('is_active')
            if is_active_param is not None:
                if is_active_param.lower() in ('true', '1'):
                    queryset = queryset.filter(is_active=True)
                elif is_active_param.lower() in ('false', '0'):
                    queryset = queryset.filter(is_active=False)
        else:
            # Students and faculty can strictly only see active facilities
            queryset = Facility.objects.select_related('category').filter(is_active=True)

        # Filtering by category (supports primary key integer or case-insensitive category name)
        category_param = self.request.query_params.get('category')
        if category_param:
            stripped_category = category_param.strip()
            if stripped_category.isdigit():
                queryset = queryset.filter(category_id=int(stripped_category))
            else:
                queryset = queryset.filter(category__name__iexact=stripped_category)

        # Filtering by building
        building_param = self.request.query_params.get('building')
        if building_param:
            queryset = queryset.filter(building__icontains=building_param.strip())

        return queryset

    def destroy(self, request, *args, **kwargs):
        """
        Soft deletion: sets is_active=False and preserves related records.
        Idempotent: repeating on already-inactive facility safely succeeds with 204.
        """
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
