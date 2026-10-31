from rest_framework import generics, status, views
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    LogoutSerializer,
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
