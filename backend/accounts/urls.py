from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
]
