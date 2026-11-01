from django.db.models import Count
from rest_framework import generics, status, views, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User, Role
from accounts.permissions import IsAdminRole
from accounts.pagination import StudentPagination
from accounts.serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    LogoutSerializer,
    StudentAdminSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    Public student registration endpoint.
    POST /api/auth/register/
    """
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserProfileSerializer(user).data
        return Response(
            {
                "message": "User registered successfully.",
                "user": user_data
            },
            status=status.HTTP_201_CREATED
        )


class LoginView(views.APIView):
    """
    Email and password authentication endpoint generating JWT tokens.
    POST /api/auth/login/
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            # Return safe generic authentication error
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserProfileSerializer(user).data
            },
            status=status.HTTP_200_OK
        )


class LogoutView(views.APIView):
    """
    Token blacklisting logout endpoint.
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = LogoutSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            detail = serializer.errors.get('detail')
            if isinstance(detail, list) and len(detail) > 0:
                return Response(
                    {"detail": str(detail[0])},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
        return Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_200_OK
        )


class UserProfileView(generics.RetrieveAPIView):
    """
    Protected user profile endpoint returning authenticated user's safe profile.
    GET /api/auth/me/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


class StudentListView(generics.ListAPIView):
    """
    Admin-only paginated list of registered student accounts.
    Includes search by email, first_name, last_name, and annotated report count.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = StudentAdminSerializer
    pagination_class = StudentPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'date_joined', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']

    def get_queryset(self):
        return User.objects.filter(role=Role.STUDENT).annotate(
            report_count=Count('issue_reports')
        )
