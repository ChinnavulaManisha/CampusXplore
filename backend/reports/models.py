from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class IssueType(models.TextChoices):
    MAINTENANCE = 'MAINTENANCE', _('Maintenance')
    CLEANLINESS = 'CLEANLINESS', _('Cleanliness')
    WATER = 'WATER', _('Water')
    ELECTRICAL = 'ELECTRICAL', _('Electrical')
    EQUIPMENT = 'EQUIPMENT', _('Equipment')
    OTHER = 'OTHER', _('Other')


class IssueStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending')
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    RESOLVED = 'RESOLVED', _('Resolved')
    REJECTED = 'REJECTED', _('Rejected')


class IssueReport(models.Model):
    """
    Facility issue report filed by authenticated users.
    Protects user and facility records against accidental deletion.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='issue_reports',
        help_text=_('User who reported this issue')
    )
    facility = models.ForeignKey(
        'facilities.Facility',
        on_delete=models.PROTECT,
        related_name='issue_reports',
        help_text=_('Facility where the issue was observed')
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    issue_type = models.CharField(
        max_length=30,
        choices=IssueType.choices,
        help_text=_('Categorization of the reported issue')
    )
    status = models.CharField(
        max_length=20,
        choices=IssueStatus.choices,
        default=IssueStatus.PENDING,
        help_text=_('Current resolution status of the issue')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Issue Report')
        verbose_name_plural = _('Issue Reports')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['issue_type']),
            models.Index(fields=['facility', 'status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"[{self.status}] {self.title} - {self.facility.name}"
