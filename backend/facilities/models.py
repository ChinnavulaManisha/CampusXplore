from decimal import Decimal
from django.db import models
from django.db.models.functions import Lower
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class Category(models.Model):
    """
    Facility category classification (e.g. Academic, Food, Healthcare).
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True, help_text=_('Lucide icon name identifier'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Category')
        verbose_name_plural = _('Categories')
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                Lower('name'),
                name='category_name_ci_uniqueness'
            ),
        ]

    def __str__(self):
        return self.name


class Facility(models.Model):
    """
    Campus facility representation with physical location and operational metadata.
    """
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='facilities',
        help_text=_('Facility category classification')
    )
    description = models.TextField(blank=True, default='')
    building = models.CharField(max_length=150, help_text=_('Campus building or block identifier'))
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal('-90.0')),
            MaxValueValidator(Decimal('90.0'))
        ],
        help_text=_('Latitude coordinate between -90.0 and 90.0')
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal('-180.0')),
            MaxValueValidator(Decimal('180.0'))
        ],
        help_text=_('Longitude coordinate between -180.0 and 180.0')
    )
    opening_hours = models.CharField(max_length=100, blank=True, null=True)
    contact_number = models.CharField(max_length=30, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Facility')
        verbose_name_plural = _('Facilities')
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['building']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(latitude__isnull=True)
                    | (models.Q(latitude__gte=Decimal('-90.0')) & models.Q(latitude__lte=Decimal('90.0')))
                ),
                name='facility_valid_latitude_range',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(longitude__isnull=True)
                    | (models.Q(longitude__gte=Decimal('-180.0')) & models.Q(longitude__lte=Decimal('180.0')))
                ),
                name='facility_valid_longitude_range',
            ),
        ]

    def clean(self):
        super().clean()
        if self.latitude is not None and not (Decimal('-90.0') <= self.latitude <= Decimal('90.0')):
            raise ValidationError({'latitude': _('Latitude must be between -90 and 90 degrees.')})
        if self.longitude is not None and not (Decimal('-180.0') <= self.longitude <= Decimal('180.0')):
            raise ValidationError({'longitude': _('Longitude must be between -180 and 180 degrees.')})

    def __str__(self):
        return f"{self.name} ({self.building})"
