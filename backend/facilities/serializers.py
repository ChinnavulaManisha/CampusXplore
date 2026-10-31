from decimal import Decimal
from rest_framework import serializers
from facilities.models import Category, Facility


class CategorySummarySerializer(serializers.ModelSerializer):
    """
    Lightweight nested representation of a Category.
    """
    class Meta:
        model = Category
        fields = ('id', 'name', 'icon')
        read_only_fields = ('id', 'name', 'icon')


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model with facility count and case-insensitive uniqueness validation.
    """
    facility_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = (
            'id',
            'name',
            'description',
            'icon',
            'facility_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'facility_count', 'created_at', 'updated_at')

    def validate_name(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Category name cannot be empty.')
        qs = Category.objects.filter(name__iexact=trimmed)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A category with this name already exists.')
        return trimmed


class FacilitySerializer(serializers.ModelSerializer):
    """
    Serializer for Facility model supporting nested read representations,
    primary key write association, coordinate validation, and duplicate detection.
    """
    category = CategorySummarySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=True,
        help_text='ID of the associated Category'
    )

    class Meta:
        model = Facility
        fields = (
            'id',
            'name',
            'category',
            'category_id',
            'description',
            'building',
            'latitude',
            'longitude',
            'opening_hours',
            'contact_number',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_name(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Facility name cannot be empty.')
        return trimmed

    def validate_building(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Building identifier cannot be empty.')
        return trimmed

    def validate_latitude(self, value):
        if value is not None and not (Decimal('-90.0') <= value <= Decimal('90.0')):
            raise serializers.ValidationError('Latitude must be between -90.0 and 90.0 degrees.')
        return value

    def validate_longitude(self, value):
        if value is not None and not (Decimal('-180.0') <= value <= Decimal('180.0')):
            raise serializers.ValidationError('Longitude must be between -180.0 and 180.0 degrees.')
        return value

    def validate(self, attrs):
        name = attrs.get('name')
        building = attrs.get('building')

        # Fallback to existing instance values on partial update
        if self.instance:
            if name is None:
                name = self.instance.name
            if building is None:
                building = self.instance.building

        if name and building:
            qs = Facility.objects.filter(
                name__iexact=name.strip(),
                building__iexact=building.strip(),
                is_active=True
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'name': 'An active facility with this name in this building already exists.'}
                )

        return attrs
