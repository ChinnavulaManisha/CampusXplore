from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class Role(models.TextChoices):
    STUDENT = 'STUDENT', _('Student')
    ADMIN = 'ADMIN', _('Admin')


class UserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifier
    for authentication instead of usernames.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set.'))
        email = self.normalize_email(email)

        # Security requirement: create_user() must ALWAYS create STUDENT accounts
        # and unconditionally enforce non-staff, non-superuser privileges.
        extra_fields['role'] = Role.STUDENT
        extra_fields['is_staff'] = False
        extra_fields['is_superuser'] = False

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser with the given email and password.
        Enforces ADMIN role, is_staff=True, and is_superuser=True.
        """
        extra_fields['role'] = Role.ADMIN
        extra_fields['is_staff'] = True
        extra_fields['is_superuser'] = True

        if not email:
            raise ValueError(_('The Email field must be set.'))
        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractUser):
    """
    Custom User model for CampusXplore.
    Uses email as the unique primary login identifier.
    """
    username = None
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        help_text=_('Designates whether the user is a Student or Administrator.')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('User')
        verbose_name_plural = _('Users')

    def __str__(self):
        return f"{self.email} ({self.role})"
