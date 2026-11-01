from django.urls import path, include
from rest_framework.routers import DefaultRouter
from reports.views import IssueReportViewSet

router = DefaultRouter()
router.register(r'reports', IssueReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
