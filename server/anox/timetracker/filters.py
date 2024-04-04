from rest_framework import filters


class IsAssignedToFilterBackend(filters.BaseFilterBackend):
    """
    Filter that only allows users to see their own assigned objects.
    """

    def filter_queryset(self, request, queryset, view):
        return queryset.filter(assigned_to=request.user)
