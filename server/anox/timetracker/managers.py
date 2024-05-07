from django.db.models import Manager
from django.db.models.query import QuerySet

from .querysets import SoftDeleteQuerySet


class SoftDeleteManager(Manager):
    def __init__(self, *args, **kwargs) -> None:
        self.with_deleted = kwargs.pop("with_deleted", False)
        self.only_deleted = kwargs.pop("only_deleted", False)
        super().__init__(*args, **kwargs)

    def get_queryset(self) -> QuerySet:
        if self.with_deleted:
            return SoftDeleteQuerySet(self.model)

        if self.only_deleted:
            return SoftDeleteQuerySet(self.model).only_deleted()

        return SoftDeleteQuerySet(self.model).without_deleted()

    def delete(self, hard: bool = False):
        return self.get_queryset().delete(hard=hard)

    def restore(self):
        return self.get_queryset().restore()
