from rest_framework import serializers

from .models import Note, Profile, Tag, TimeEntry, Timestamp
from .utils import to_canonical_name


class TagLinkTagField(serializers.RelatedField):
    def to_representation(self, value):
        return TagSerializer(value.tag).data

    def get_queryset(self):
        # Any tag is fair, as long as it belongs to the user
        if "request" in self.context:
            user = self.context["request"].user
            return Tag.objects.filter(assigned_to=user)

        return Tag.objects.all()

    def to_internal_value(self, data: str):
        return to_canonical_name(data)

    def get_choices(self, cutoff=None):
        return {}


class NoteSerializer(serializers.HyperlinkedModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    assigned_to_id = serializers.HiddenField(default=-1)
    tags = TagLinkTagField(source="tag_links", many=True)

    class Meta:
        model = Note
        fields = [
            "id",
            "created_at",
            "title",
            "content",
            "for_date",
            "assigned_to_id",
            "tags",
        ]


class TagSerializer(serializers.HyperlinkedModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    canonical_name = serializers.CharField(read_only=True)
    assigned_to_id = serializers.HiddenField(default=-1)

    class Meta:
        model = Tag
        fields = [
            "id",
            "created_at",
            "name",
            "canonical_name",
            "color",
            "assigned_to_id",
        ]


class TimeEntrySerializer(serializers.HyperlinkedModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    tags = TagLinkTagField(source="tag_links", many=True, read_only=True)

    class Meta:
        model = TimeEntry
        fields = [
            "id",
            "created_at",
            "updated_at",
            "started_at",
            "ended_at",
            "description",
            "tags",
        ]


class TimestampSerializer(serializers.HyperlinkedModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    tags = TagLinkTagField(source="tag_links", many=True, read_only=True)

    class Meta:
        model = Timestamp
        fields = ["id", "created_at", "description", "tags"]


class ProfileSerializer(serializers.HyperlinkedModelSerializer):
    username = serializers.CharField(read_only=True, source="user.username")

    class Meta:
        model = Profile
        fields = [
            "id",
            "username",
            "timezone",
            "date_format",
            "datetime_format",
            "today_datetime_format",
            "duration_format",
        ]
