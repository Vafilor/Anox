from django.apps import AppConfig


class TimetrackerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "timetracker"

    def ready(self) -> None:
        from . import signals  # noqa: F401
