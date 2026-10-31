from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from accounts.models import User, Role


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for public student registration.
    Explicitly accepts only email, password, first_name, and last_name.
    Rejects or discards any attempt to set role, is_staff, is_superuser, groups, or user_permissions.
    Always creates a STUDENT account.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='User password satisfying system password policies.'
    )
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name', 'role', 'created_at')
        read_only_fields = ('id', 'role', 'created_at')

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError('A user with this email address already exists.')
        return value.strip()

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        # Strict enforcement: Public registration always creates STUDENT accounts
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for authenticating users via email and password using Django's authenticate().
    Returns safe generic error messages that never disclose whether an email exists.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        email = attrs.get('email', '').strip()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError('Both email and password are required.')

        request = self.context.get('request')
        user = authenticate(request=request, email=email, password=password)

        if not user:
            # Generic error message - does not reveal if the email exists in the database
            raise serializers.ValidationError('Invalid email or password.')

        if not user.is_active:
            raise serializers.ValidationError('User account is inactive.')

        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer returning safe profile details of the authenticated user.
    Never exposes passwords, hashes, or security-sensitive internal flags.
    """
    class Meta:
        model = User
        fields = ('id', 'email', 'role', 'first_name', 'last_name', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'first_name', 'last_name', 'created_at')


class LogoutSerializer(serializers.Serializer):
    """
    Serializer for handling refresh-token blacklisting upon user logout.
    Validates token format, decodes user claim, and strictly enforces
    token ownership against the authenticated requesting user before blacklisting.
    """
    refresh = serializers.CharField(required=True)

    def validate(self, attrs):
        raw_token = attrs.get('refresh', '').strip()
        if not raw_token:
            raise serializers.ValidationError({'detail': 'Refresh token is required.'})

        try:
            refresh_token = RefreshToken(raw_token)
        except TokenError:
            raise serializers.ValidationError({'detail': 'Token is invalid or expired.'})

        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            raise serializers.ValidationError({'detail': 'Authentication credentials are required.'})

        # Retrieve user identification claim from the token
        token_user_id = refresh_token.get('user_id')
        if token_user_id is None or str(token_user_id) != str(request.user.id):
            raise serializers.ValidationError({'detail': 'You cannot logout with a token belonging to another user.'})

        self.refresh_token = refresh_token
        return attrs

    def save(self, **kwargs):
        try:
            self.refresh_token.blacklist()
        except TokenError:
            raise serializers.ValidationError({'detail': 'Token is invalid or expired.'})
