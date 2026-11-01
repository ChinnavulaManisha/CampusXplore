"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    StudentListView,
)
from facilities.views import FacilityViewSet, CategoryViewSet
from reports.views import IssueReportViewSet
from core.views import health_check

# Direct router without /api prefix to support clients configured with base root URL
direct_router = DefaultRouter()
direct_router.register(r'facilities', FacilityViewSet, basename='direct_facility')
direct_router.register(r'categories', CategoryViewSet, basename='direct_category')
direct_router.register(r'reports', IssueReportViewSet, basename='direct_report')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    # Direct auth paths without /api prefix
    path('auth/register/', RegisterView.as_view(), name='direct_register'),
    path('auth/login/', LoginView.as_view(), name='direct_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='direct_token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='direct_logout'),
    path('auth/me/', UserProfileView.as_view(), name='direct_me'),
    path('auth/students/', StudentListView.as_view(), name='direct_students'),
    path('health/', health_check, name='direct_health_check'),
    # Standard api-prefixed paths
    path('api/', include('facilities.urls')),
    path('api/', include('core.urls')),
    path('api/', include('reports.urls')),
    # Direct routes without /api prefix
    path('', include(direct_router.urls)),
]
