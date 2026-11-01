from rest_framework import serializers
from django.contrib.auth import get_user_model
from accounts.models import Role
from facilities.models import Facility
from reports.models import IssueReport, IssueType, IssueStatus

User = get_user_model()

# Valid status transition graph
VALID_STATUS_TRANSITIONS = {
    IssueStatus.PENDING: [IssueStatus.IN_PROGRESS, IssueStatus.REJECTED],
    IssueStatus.IN_PROGRESS: [IssueStatus.RESOLVED, IssueStatus.REJECTED],
    IssueStatus.RESOLVED: [],
    IssueStatus.REJECTED: [],
}


class IssueReportFacilitySummarySerializer(serializers.ModelSerializer):
    """
    Lightweight nested facility representation for issue report detail/list views.
    """
    class Meta:
        model = Facility
        fields = ('id', 'name', 'building')
        read_only_fields = fields


class IssueReportUserSummarySerializer(serializers.ModelSerializer):
    """
    Lightweight nested user representation displaying reporter identity.
    """
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = fields


class IssueReportReadSerializer(serializers.ModelSerializer):
    """
    Complete nested read serializer for issue reports.
    """
    facility = IssueReportFacilitySummarySerializer(read_only=True)
    user = IssueReportUserSummarySerializer(read_only=True)

    class Meta:
        model = IssueReport
        fields = (
            'id',
            'facility',
            'user',
            'title',
            'description',
            'issue_type',
            'status',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields


class IssueReportCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new issue reports.
    Enforces required fields, string length constraints, and facility active status.
    Security: The reporter (user) and initial status (PENDING) are assigned automatically
    and cannot be set or overridden via request payload.
    """
    facility = serializers.PrimaryKeyRelatedField(
        queryset=Facility.objects.all(),
        required=False,
        error_messages={
            'does_not_exist': 'Selected facility does not exist.',
            'incorrect_type': 'Facility ID must be an integer.',
        }
    )
    facility_id = serializers.PrimaryKeyRelatedField(
        queryset=Facility.objects.all(),
        source='facility',
        required=False,
        write_only=True,
        error_messages={
            'does_not_exist': 'Selected facility does not exist.',
            'incorrect_type': 'Facility ID must be an integer.',
        }
    )
    title = serializers.CharField(
        max_length=200,
        required=True,
        error_messages={
            'required': 'Title is required.',
            'blank': 'Title cannot be blank.',
        }
    )
    description = serializers.CharField(
        required=True,
        error_messages={
            'required': 'Description is required.',
            'blank': 'Description cannot be blank.',
        }
    )
    issue_type = serializers.ChoiceField(
        choices=IssueType.choices,
        required=True,
        error_messages={
            'required': 'Issue type is required.',
            'invalid_choice': 'Invalid issue type selection.',
        }
    )

    class Meta:
        model = IssueReport
        fields = (
            'id',
            'facility',
            'facility_id',
            'title',
            'description',
            'issue_type',
            'status',
            'created_at',
        )
        read_only_fields = ('id', 'status', 'created_at')

    def validate_title(self, value):
        trimmed = value.strip()
        if len(trimmed) < 3:
            raise serializers.ValidationError('Title must be at least 3 characters.')
        if len(trimmed) > 200:
            raise serializers.ValidationError('Title must not exceed 200 characters.')
        return trimmed

    def validate_description(self, value):
        trimmed = value.strip()
        if len(trimmed) < 10:
            raise serializers.ValidationError('Description must be at least 10 characters.')
        return trimmed

    def validate(self, attrs):
        facility = attrs.get('facility')
        if not facility:
            raise serializers.ValidationError({'facility': 'Facility is required.'})

        if not facility.is_active:
            raise serializers.ValidationError(
                {'facility': 'Selected facility is inactive and cannot receive new issue reports.'}
            )

        return attrs

    def create(self, validated_data):
        # Security enforcement: Always bind authenticated user and default to PENDING.
        # Strips and unconditionally overrides any user or status supplied in request data.
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['user'] = request.user
        validated_data['status'] = IssueStatus.PENDING
        return super().create(validated_data)


class IssueReportUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating an existing issue report.
    - Faculty members are only permitted to update the report status.
    - Status transitions are strictly validated against allowable state changes:
        PENDING -> IN_PROGRESS or REJECTED
        IN_PROGRESS -> RESOLVED or REJECTED
        RESOLVED and REJECTED are terminal states
    - Reporter (user) is immutable and cannot be modified.
    """
    status = serializers.ChoiceField(
        choices=IssueStatus.choices,
        required=False,
        error_messages={
            'invalid_choice': 'Invalid status selection.',
        }
    )

    class Meta:
        model = IssueReport
        fields = (
            'id',
            'facility',
            'title',
            'description',
            'issue_type',
            'status',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_status(self, new_status):
        if not self.instance:
            return new_status

        current_status = self.instance.status
        if current_status in (IssueStatus.RESOLVED, IssueStatus.REJECTED):
            raise serializers.ValidationError(
                f"Cannot update report status. Status '{current_status}' is a terminal state."
            )

        allowed = VALID_STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            raise serializers.ValidationError(
                f"Invalid status transition from '{current_status}' to '{new_status}'. "
                f"Allowed transitions: {', '.join(allowed) if allowed else 'None (terminal state)'}."
            )
        return new_status

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        user_role = getattr(user, 'role', None) if user else None

        # Disallow any attempt to tamper with the original reporter
        if 'user' in self.initial_data or 'user_id' in self.initial_data:
            raise serializers.ValidationError({'user': 'The report creator cannot be modified.'})

        # Faculty restriction: only status can be updated
        if user_role == Role.FACULTY:
            immutable_fields = {'title', 'description', 'facility', 'facility_id', 'issue_type'}
            attempted = set(self.initial_data.keys()) & immutable_fields
            if attempted:
                raise serializers.ValidationError({
                    field: 'Faculty members are not permitted to modify this field. Only status updates are allowed.'
                    for field in attempted
                })
            if 'status' not in attrs:
                raise serializers.ValidationError({
                    'status': 'Status field is required for faculty updates.'
                })

        # Title length validation if updated
        if 'title' in attrs:
            trimmed = attrs['title'].strip()
            if len(trimmed) < 3 or len(trimmed) > 200:
                raise serializers.ValidationError({'title': 'Title must be between 3 and 200 characters.'})
            attrs['title'] = trimmed

        # Description length validation if updated
        if 'description' in attrs:
            trimmed = attrs['description'].strip()
            if len(trimmed) < 10:
                raise serializers.ValidationError({'description': 'Description must be at least 10 characters.'})
            attrs['description'] = trimmed

        # Facility active validation if updated
        if 'facility' in attrs and not attrs['facility'].is_active:
            raise serializers.ValidationError({'facility': 'Selected facility is inactive.'})

        return attrs
