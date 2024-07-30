import uuid
from datetime import date, timedelta
from typing import Dict, Sequence

from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.db import models, transaction
from django.db.models import F, Sum
from django.utils import timezone

from timetracker.utils import to_canonical_name

from .managers import SoftDeleteManager
from .utils import split_datetimes_across_days

# TODO add indexes


# TODO add search by tags
class Profile(models.Model):
    class Meta:
        db_table = "profile"

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    timezone = models.CharField(max_length=255)
    date_format = models.CharField(max_length=50)
    datetime_format = models.CharField(max_length=50)
    today_datetime_format = models.CharField(max_length=50)
    duration_format = models.CharField(max_length=50)


class Task(models.Model):
    class Meta:
        db_table = "tasks"

    objects = SoftDeleteManager()
    objects_deleted = SoftDeleteManager(only_deleted=True)
    objects_with_deleted = SoftDeleteManager(with_deleted=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True)

    completed_at = models.DateTimeField(null=True)
    closed_at = models.DateTimeField(null=True)
    due_at = models.DateTimeField(null=True)

    name = models.CharField(max_length=255)
    canonical_name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    priority = models.IntegerField(default=0)
    template = models.BooleanField(default=False)

    # If true, the task is currently being worked on, or, it's a target to work on.
    active = models.BooleanField(default=False)

    # How long the task is estimated to take in seconds.
    time_estimate = models.IntegerField(null=True)

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)
    parent = models.ForeignKey("self", null=True, on_delete=models.CASCADE)

    def save(self, *args, **kwargs) -> None:
        self.canonical_name = to_canonical_name(self.name)
        return super().save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False, hard: bool = False):
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)

        with transaction.atomic():
            self.deleted_at = timezone.now()
            self.tag_links.delete()

            return self.save()

    def restore(self):
        self.deleted_at = None
        self.save()

    def __str__(self) -> str:
        return self.name


class Timestamp(models.Model):
    class Meta:
        db_table = "timestamps"

    objects = SoftDeleteManager()
    objects_deleted = SoftDeleteManager(only_deleted=True)
    objects_with_deleted = SoftDeleteManager(with_deleted=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True)

    # Any content you wish to add to a timestamp,
    # like "server reports out of memory error this time".
    description = models.TextField()

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)

    def delete(self, using=None, keep_parents=False, hard: bool = False):
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)

        self.deleted_at = timezone.now()
        return self.save()

    def restore(self):
        self.deleted_at = None
        self.save()


class TimeEntry(models.Model):
    class Meta:
        db_table = "time_entries"
        verbose_name = "time entry"
        verbose_name_plural = "time entries"

    objects = SoftDeleteManager()
    objects_deleted = SoftDeleteManager(only_deleted=True)
    objects_with_deleted = SoftDeleteManager(with_deleted=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True)

    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    description = models.TextField()

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.SET_NULL)

    def delete(self, using=None, keep_parents=False, hard: bool = False):
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)

        self.deleted_at = timezone.now()
        return self.save()

    def restore(self):
        self.deleted_at = None
        self.save()


class Tag(models.Model):
    class Meta:
        db_table = "tags"

    objects = SoftDeleteManager()
    objects_deleted = SoftDeleteManager(only_deleted=True)
    objects_with_deleted = SoftDeleteManager(with_deleted=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True)

    name = models.CharField(max_length=255)
    canonical_name = models.CharField(max_length=255, unique=True)

    # Hex color string RGBA. No leading #. E.g. #FF000000
    color = models.CharField(max_length=8)

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)

    def save(self, *args, **kwargs) -> None:
        self.canonical_name = to_canonical_name(self.name)
        return super().save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False, hard: bool = False):
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)

        self.deleted_at = timezone.now()
        return self.save()

    def restore(self):
        self.deleted_at = None
        self.save()

    def get_total_references(self):
        return TagLink.objects.filter(tag=self).count()

    def get_total_time(self, chunk_size=500) -> timedelta:
        total_time = timedelta(0)

        links = (
            TagLink.objects.filter(tag=self)
            .exclude(time_entry_id__isnull=True)
            .order_by("created_at")
        )

        for page in Paginator(links, per_page=chunk_size):
            aggregate = (
                TimeEntry.objects.exclude(ended_at__isnull=True)
                .filter(tag_links__in=page.object_list)
                .aggregate(total_time=Sum(F("ended_at") - F("started_at")))
            )

            if (delta := aggregate["total_time"]) is not None:
                total_time += delta

        return total_time

    def get_time_report(self, chunk_size=500) -> Dict[date, timedelta]:
        results = {}

        links = (
            TagLink.objects.filter(tag=self)
            .exclude(time_entry_id__isnull=True)
            .order_by("created_at")
        )

        for page in Paginator(links, per_page=chunk_size):
            time_entries = TimeEntry.objects.exclude(ended_at__isnull=True).filter(
                tag_links__in=page.object_list
            )

            for time_entry in time_entries:
                # TODO log the error
                try:
                    parts = split_datetimes_across_days(
                        time_entry.started_at, time_entry.ended_at
                    )
                except ValueError:
                    continue

                for i in range(0, len(parts), 2):
                    key = parts[i].date()
                    if key not in results:
                        results[key] = timedelta(0)

                    results[key] += parts[i + 1] - parts[i]

        return results

    def __str__(self):
        return self.name


class Note(models.Model):
    class Meta:
        db_table = "notes"

    objects = SoftDeleteManager()
    objects_deleted = SoftDeleteManager(only_deleted=True)
    objects_with_deleted = SoftDeleteManager(with_deleted=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True)

    """
    This is the date the note is for. So, if I'm writing down some notes on
    what happened on 1.1.2020, I can set that to this variable. I may
    remember things on different times and add to them later, or I may add a note
    for a day later.
    """
    for_date = models.DateTimeField(null=True)
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)

    def delete(self, using=None, keep_parents=False, hard: bool = False):
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)

        self.deleted_at = timezone.now()
        return self.save()

    def restore(self):
        self.deleted_at = None
        self.save()


class Statistic(models.Model):
    class Meta:
        db_table = "statistics"

    objects = SoftDeleteManager()
    objects_deleted = SoftDeleteManager(only_deleted=True)
    objects_with_deleted = SoftDeleteManager(with_deleted=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True)

    icon = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255)
    canonical_name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    # Hex color string RGBA. No leading #. E.g. #FF000000
    color = models.CharField(max_length=8)
    unit = models.CharField(max_length=255, blank=True)

    TIME_TYPE_CHOICES = {"instance": "instance", "interval": "interval"}
    time_type = models.CharField(max_length=255, choices=TIME_TYPE_CHOICES)

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)

    def save(self, *args, **kwargs) -> None:
        self.canonical_name = to_canonical_name(self.name)
        return super().save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False, hard: bool = False):
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)

        self.deleted_at = timezone.now()
        return self.save()

    def restore(self):
        self.deleted_at = None
        self.save()


class StatisticValue(models.Model):
    class Meta:
        db_table = "statistic_values"

    objects = SoftDeleteManager()
    objects_deleted = SoftDeleteManager(only_deleted=True)
    objects_with_deleted = SoftDeleteManager(with_deleted=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True)

    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)

    value = models.FloatField()

    statistic = models.ForeignKey(Statistic, on_delete=models.CASCADE)
    time_entry = models.ForeignKey(
        TimeEntry, on_delete=models.CASCADE, null=True, blank=True
    )
    timestamp = models.ForeignKey(
        Timestamp, on_delete=models.CASCADE, null=True, blank=True
    )

    def delete(self, using=None, keep_parents=False, hard: bool = False):
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)

        self.deleted_at = timezone.now()
        return self.save()

    def restore(self):
        self.deleted_at = None
        self.save()


class TagLink(models.Model):
    class Meta:
        db_table = "tag_links"

    objects = SoftDeleteManager()
    objects_deleted = SoftDeleteManager(only_deleted=True)
    objects_with_deleted = SoftDeleteManager(with_deleted=True)

    created_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True)

    time_entry = models.ForeignKey(
        TimeEntry,
        related_name="tag_links",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    timestamp = models.ForeignKey(
        Timestamp,
        related_name="tag_links",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    task = models.ForeignKey(
        Task, related_name="tag_links", on_delete=models.CASCADE, null=True, blank=True
    )
    note = models.ForeignKey(
        Note, related_name="tag_links", on_delete=models.CASCADE, null=True, blank=True
    )
    tag = models.ForeignKey(
        Tag, related_name="tag_links", on_delete=models.CASCADE, null=True, blank=True
    )
    statistic = models.ForeignKey(
        Statistic,
        related_name="tag_links",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )


def object_to_query_class_name(obj) -> str:
    class_name = type(obj).__name__

    if class_name == "Tag":
        return "tag"
    elif class_name == "Task":
        return "task"
    elif class_name == "TimeEntry":
        return "time_entry"
    elif class_name == "Timestamp":
        return "timestamp"
    elif class_name == "Statistic":
        return "statistic"
    elif class_name == "Note":
        return "note"

    raise ValueError(f"Unsupported object of type '{class_name}'")


def tag_object(obj, tags: Sequence[Tag]) -> int:
    """Links Tag objects to the input object, obj by creating TagLinks.
    If a TagLink already exists, it is skipped.
    The input tags are assumed to all exist in the database
    """

    class_name = object_to_query_class_name(obj)

    tag_ids = [tag.id for tag in tags]

    existing_links_map = (
        TagLink.objects.filter(tag_id__in=tag_ids, **{class_name: obj})
        .distinct("tag_id")
        .in_bulk(field_name="tag_id")
    )

    new_links = [
        TagLink(tag=tag, **{class_name: obj})
        for tag in tags
        if tag.id not in existing_links_map
    ]

    TagLink.objects.bulk_create(new_links)

    return len(new_links)
