from typing import Dict, List

from django.conf import settings
from django.db import IntegrityError
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from .filters import IsAssignedToFilterBackend
from .models import Note, Profile, Tag, TagLink, TimeEntry, Timestamp
from .serializers import (
    NoteSerializer,
    ProfileSerializer,
    TagSerializer,
    TimeEntrySerializer,
    TimestampSerializer,
)
from .utils import to_canonical_name


class NoteViewSet(viewsets.ModelViewSet):
    queryset = (
        Note.objects.all().prefetch_related("tag_links__tag").order_by("-created_at")
    )
    serializer_class = NoteSerializer
    permissions_classes = [permissions.IsAuthenticated]
    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
        IsAssignedToFilterBackend,
    ]
    search_fields = ["title", "content"]
    ordering_fields = ["created_at", "for_date", "title"]
    ordering = ["-created_at"]

    def create(self, request, *args, **kwargs):
        tag_names = request.data["tags"]
        request.data["tags"] = []

        serializer = NoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                assigned_to_id=request.user.id,
            )

            name_to_canonical: Dict[str, str] = {
                tag_name: to_canonical_name(tag_name) for tag_name in tag_names
            }
            tag_mapping = Tag.objects.in_bulk(
                name_to_canonical.values(), field_name="canonical_name"
            )

            tags: List[Tag] = []
            for tag_name in tag_names:
                canonical_name = name_to_canonical[tag_name]
                if tag := tag_mapping.get(canonical_name):
                    tags.append(tag)
                else:
                    new_tag = Tag(
                        name=tag_name,
                        color=settings.DEFAULT_TAG_COLOR,
                        assigned_to=request.user,
                    )
                    new_tag.save()
                    tags.append(new_tag)

            existing_links = TagLink.objects.filter(note=serializer.data["id"]).in_bulk(
                field_name="id"
            )

            tag_links = [tag_link for _, tag_link in existing_links]
            for tag in tags:
                if tag.id not in existing_links:
                    link = TagLink(tag=tag, note_id=serializer.data["id"])
                    link.save()
                    tag_links.append(link)

            # TODO this works fine, but we might want to move the logic to the
            # serializer as a mixin or something to make it re-usable
            serializer._data["tags"] = [TagSerializer(tag).data for tag in tags]
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permissions_classes = [permissions.IsAuthenticated]
    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
        IsAssignedToFilterBackend,
    ]
    search_fields = ["canonical_name"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]

    def create(self, request, *args, **kwargs):
        serializer = TagSerializer(data=request.data)
        tag_name = to_canonical_name(request.data["name"])
        if serializer.is_valid():
            try:
                serializer.save(
                    assigned_to_id=request.user.id,
                    canonical_name=tag_name,
                )
            except IntegrityError:
                return Response(
                    {
                        "error": {
                            "message": f"Tag with the name '{tag_name}' already exists"
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        tag = self.get_object()

        serializer = TagSerializer(tag, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TimeEntryViewSet(viewsets.ModelViewSet):
    queryset = (
        TimeEntry.objects.all()
        .prefetch_related("tag_links__tag")
        .order_by("-started_at")
    )
    serializer_class = TimeEntrySerializer
    permissions_classes = [permissions.IsAuthenticated]


class TimestampViewSet(viewsets.ModelViewSet):
    queryset = (
        Timestamp.objects.all()
        .prefetch_related("tag_links__tag")
        .order_by("-created_at")
    )
    serializer_class = TimestampSerializer
    permissions_classes = [permissions.IsAuthenticated]


@api_view(["GET"])
def get_profile(request: Request):
    profile = Profile.objects.get(user_id=request.user.id)
    serializer = ProfileSerializer(profile)

    return Response(serializer.data)


@api_view(["PUT"])
def update_profile(request: Request):
    profile = Profile.objects.get(user_id=request.user.id)
    serializer = ProfileSerializer(profile, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.data)


@api_view(["GET"])
def tag_totals(request: Request, tag_id):
    try:
        tag: Tag = Tag.objects.get(pk=tag_id)
    except Tag.DoesNotExist:
        return Response(None, status=status.HTTP_404_NOT_FOUND)

    if tag.assigned_to != request.user:
        return Response(None, status=status.HTTP_403_FORBIDDEN)

    return Response(
        {
            "references": tag.get_total_references(),
            "totalTime": tag.get_total_time().total_seconds(),
        }
    )


@api_view(["GET"])
def tag_time_report(request: Request, tag_id):
    try:
        tag: Tag = Tag.objects.get(pk=tag_id)
    except Tag.DoesNotExist:
        return Response(None, status=status.HTTP_404_NOT_FOUND)

    if tag.assigned_to != request.user:
        return Response(None, status=status.HTTP_403_FORBIDDEN)

    formatted_report = {
        str(key): value.total_seconds() for key, value in tag.get_time_report().items()
    }

    return Response({"report": formatted_report})
