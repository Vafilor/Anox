from django.urls import include, path
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(f"notes", views.NoteViewSet)
router.register(f"tags", views.TagViewSet)
router.register(f"time_entries", views.TimeEntryViewSet)
router.register(f"timestamps", views.TimestampViewSet)

app_name = "timetracker"
urlpatterns = [
    path("api/", include(router.urls)),
]
