from django.urls import path, include
from rest_framework.routers import DefaultRouter
from facilities.views import CategoryViewSet, FacilityViewSet

app_name = 'facilities'

router = DefaultRouter()
router.register(r'facilities', FacilityViewSet, basename='facility')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]
