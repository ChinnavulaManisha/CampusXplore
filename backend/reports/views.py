from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from reports.models import IssueReport, IssueStatus
from reports.serializers import (
    IssueReportReadSerializer,
    IssueReportCreateSerializer,
    IssueReportUpdateSerializer,
)
from reports.permissions import IssueReportPermission
from reports.pagination import IssueReportPagination


class IssueReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing campus issue reports.
    - Role-Based Query Isolation:
      * Students can strictly only view reports they filed themselves.
      * Faculty and Admins can view all reports across the campus.
    - Permissions:
      * Authenticated users can list, retrieve, and create reports.
      * Faculty and Admins can update report status via PATCH.
      * Admins alone can delete reports.
      * Full replacement (PUT) is disallowed.
    - Filtering:
      * Supports ?status=, ?issue_type=, and ?facility= query parameters.
    """
    permission_classes = [IsAuthenticated, IssueReportPermission]
    pagination_class = IssueReportPagination
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'facility__name', 'facility__building']
    ordering_fields = ['created_at', 'updated_at', 'status', 'issue_type', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if not (user and user.is_authenticated):
            return IssueReport.objects.none()

        if getattr(user, 'role', None) in (Role.FACULTY, Role.ADMIN):
            queryset = IssueReport.objects.select_related('facility', 'user').all()
        else:
            queryset = IssueReport.objects.select_related('facility', 'user').filter(user=user)

        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by issue_type
        issue_type_param = self.request.query_params.get('issue_type')
        if issue_type_param:
            queryset = queryset.filter(issue_type=issue_type_param)

        # Filter by facility ID
        facility_param = self.request.query_params.get('facility') or self.request.query_params.get('facility_id')
        if facility_param:
            queryset = queryset.filter(facility_id=facility_param)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return IssueReportCreateSerializer
        elif self.action in ('update', 'partial_update'):
            return IssueReportUpdateSerializer
        return IssueReportReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Always enforce authenticated user as creator and PENDING as initial status
        instance = serializer.save(user=request.user, status=IssueStatus.PENDING)
        read_serializer = IssueReportReadSerializer(instance, context=self.get_serializer_context())
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        read_serializer = IssueReportReadSerializer(updated_instance, context=self.get_serializer_context())
        return Response(read_serializer.data, status=status.HTTP_200_OK)
