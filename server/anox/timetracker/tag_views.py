from django.db import IntegrityError
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from .filters import IsAssignedToFilterBackend
from .models import Tag
from .serializers import TagSerializer
from .utils import to_canonical_name


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
        if not serializer.is_valid():
            return Response(
                serializer.errors, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

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

    def update(self, request, *args, **kwargs):
        tag = self.get_object()

        serializer = TagSerializer(tag, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
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

    result = []
    report = tag.get_time_report()
    total = 0
    for date_key in sorted(report.keys()):
        seconds = report[date_key].total_seconds()
        total += seconds
        result.append({"date": str(date_key), "seconds": seconds})

    return Response({"report": result, "total": total})
