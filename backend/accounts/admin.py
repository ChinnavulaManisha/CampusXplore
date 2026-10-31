from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.utils.translation import gettext_lazy as _
from .models import User, Role


class CustomUserCreationForm(UserCreationForm):
    """
    Form for superusers adding new users with role and permission options.
    """
    class Meta:
        model = User
        fields = ('email', 'role', 'is_staff', 'is_superuser')


class StaffUserCreationForm(UserCreationForm):
    """
    Form for non-superuser staff adding new users with restricted attributes.
    """
    class Meta:
        model = User
        fields = ('email',)


class CustomUserChangeForm(UserChangeForm):
    """
    Form for modifying existing users in Django admin.
    """
    class Meta:
        model = User
        fields = '__all__'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Hardened UserAdmin enforcing permission boundaries between ordinary staff and superusers.
    """
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    list_display = ('email', 'role', 'is_staff', 'is_superuser', 'is_active', 'created_at')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'created_at')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Role & Permissions'), {
            'fields': (
                'role',
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions',
            ),
        }),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at', 'last_login')

    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('email', 'password1', 'password2', 'role', 'is_staff', 'is_superuser'),
            },
        ),
    )

    staff_add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('email', 'password1', 'password2'),
            },
        ),
    )

    PRIVILEGED_FIELDS = ('role', 'is_staff', 'is_superuser', 'groups', 'user_permissions')

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            for field in self.PRIVILEGED_FIELDS:
                if field not in readonly:
                    readonly.append(field)
        return tuple(readonly)

    def get_fieldsets(self, request, obj=None):
        if not obj:
            if not request.user.is_superuser:
                return self.staff_add_fieldsets
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

    def get_form(self, request, obj=None, **kwargs):
        if not obj:
            if not request.user.is_superuser:
                self.add_form = StaffUserCreationForm
            else:
                self.add_form = CustomUserCreationForm
        return super().get_form(request, obj, **kwargs)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            if not change:
                # Ordinary staff creating a user can only create student accounts without privileges
                obj.role = Role.STUDENT
                obj.is_staff = False
                obj.is_superuser = False
            else:
                # Prevent tampering with privileged fields on existing records
                orig = User.objects.get(pk=obj.pk)
                obj.role = orig.role
                obj.is_staff = orig.is_staff
                obj.is_superuser = orig.is_superuser
        super().save_model(request, obj, form, change)

    def has_delete_permission(self, request, obj=None):
        # Non-superusers cannot delete superusers
        if obj and obj.is_superuser and not request.user.is_superuser:
            return False
        return super().has_delete_permission(request, obj)
