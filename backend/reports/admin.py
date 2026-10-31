from django.contrib import admin
from .models import IssueReport


@admin.register(IssueReport)
class IssueReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'facility', 'user', 'issue_type', 'status', 'created_at')
    list_filter = ('status', 'issue_type', 'created_at')
    search_fields = ('title', 'description', 'user__email', 'facility__name', 'facility__building')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('title', 'facility', 'user', 'description')
        }),
        ('Classification & Status', {
            'fields': ('issue_type', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
