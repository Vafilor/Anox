from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def only_deleted(self):
        return self.filter(deleted_at__isnull=False)

    def without_deleted(self):
        return self.filter(deleted_at__isnull=True)

    def delete(self, hard: bool = False):
        if hard:
            return super().delete()

        return super().update(deleted_at=timezone.now())

    def restore(self):
        return super.update(deleted_at=None)
