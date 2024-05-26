from django.urls import include, path
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register("notes", views.NoteViewSet)
router.register("tags", views.TagViewSet)
router.register("time_entries", views.TimeEntryViewSet)
router.register("timestamps", views.TimestampViewSet)

app_name = "timetracker"
urlpatterns = [
    path("api/", include(router.urls)),
    path("api/tags/<tag_id>/totals/", views.tag_totals, name="tag_totals"),
    path(
        "api/tags/<tag_id>/time-report/", views.tag_time_report, name="tag_time_report"
    ),
    path("api/user/profile/", views.get_profile, name="get_user_profile"),
    path("api/user/profile/", views.update_profile, name="update_user_profile"),
]
