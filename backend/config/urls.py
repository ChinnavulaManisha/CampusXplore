"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    StudentListView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    # Direct auth paths without /api prefix to support clients configured with base root URL
    path('auth/register/', RegisterView.as_view(), name='direct_register'),
    path('auth/login/', LoginView.as_view(), name='direct_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='direct_token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='direct_logout'),
    path('auth/me/', UserProfileView.as_view(), name='direct_me'),
    path('auth/students/', StudentListView.as_view(), name='direct_students'),
    path('api/', include('facilities.urls')),
    path('api/', include('core.urls')),
    path('api/', include('reports.urls')),
]
