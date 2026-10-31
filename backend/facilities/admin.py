from django.contrib import admin
from .models import Category, Facility


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'building', 'opening_hours', 'is_active', 'created_at')
    list_filter = ('category', 'is_active', 'building')
    search_fields = ('name', 'building', 'description', 'contact_number')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'category', 'building', 'description', 'is_active')
        }),
        ('Location Coordinates', {
            'fields': ('latitude', 'longitude'),
            'description': 'Decimal latitude and longitude coordinates for map positioning.'
        }),
        ('Contact & Schedule', {
            'fields': ('opening_hours', 'contact_number')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
