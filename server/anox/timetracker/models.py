import uuid

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from timetracker.utils import to_canonical_name

# TODO add indexes


class Task(models.Model):
    class Meta:
        db_table = "tasks"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    completed_at = models.DateTimeField(null=True)
    closed_at = models.DateTimeField(null=True)
    due_at = models.DateTimeField(null=True)

    name = models.CharField(max_length=255)
    canonical_name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    priority = models.IntegerField()
    template = models.BooleanField()

    # If true, the task is currently being worked on, or, it's a target to work on.
    active = models.BooleanField()

    # How long the task is estimated to take in seconds.
    time_estimate = models.IntegerField(null=True)

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)
    parent = models.ForeignKey("self", null=True, on_delete=models.CASCADE)

    def __str__(self) -> str:
        return self.name


class Timestamp(models.Model):
    class Meta:
        db_table = "timestamps"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)

    # Any content you wish to add to a timestamp,
    # like "server reports out of memory error this time".
    description = models.TextField()

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)


class TimeEntry(models.Model):
    class Meta:
        db_table = "time_entries"
        verbose_name = "time entry"
        verbose_name_plural = "time entries"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    description = models.TextField()

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.SET_NULL)


class Tag(models.Model):
    class Meta:
        db_table = "tags"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    name = models.CharField(max_length=255)
    canonical_name = models.CharField(max_length=255, unique=True)

    # Hex color string RGBA. No leading #. E.g. #FF000000
    color = models.CharField(max_length=8)

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)

    def save(self, *args, **kwargs) -> None:
        self.canonical_name = to_canonical_name(self.name)
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Note(models.Model):
    class Meta:
        db_table = "notes"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

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


class Statistic(models.Model):
    class Meta:
        db_table = "statistics"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

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


class StatisticValue(models.Model):
    class Meta:
        db_table = "statistic_values"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
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


class TagLink(models.Model):
    class Meta:
        db_table = "tag_links"

    created_at = models.DateTimeField(default=timezone.now)
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
