from datetime import datetime, timedelta

import pytest
from django.utils import timezone

from .models import (
    Note,
    Statistic,
    Tag,
    TagLink,
    Task,
    TimeEntry,
    Timestamp,
    User,
    object_to_query_class_name,
    tag_object,
)


class TestObjectToQueryClassName:
    def test_correct_result(self):
        user = User(username="test")

        assert (
            object_to_query_class_name(
                Tag(name="test", color="FF00FFFF", assigned_to=user)
            )
            == "tag"
        )

        assert object_to_query_class_name(Task(name="test", assigned_to=user)) == "task"
        assert object_to_query_class_name(TimeEntry(assigned_to=user)) == "time_entry"

        assert object_to_query_class_name(Timestamp(assigned_to=user)) == "timestamp"
        assert object_to_query_class_name(Statistic(assigned_to=user)) == "statistic"
        assert object_to_query_class_name(Note(assigned_to=user)) == "note"

        class Temp:
            pass

        with pytest.raises(ValueError):
            object_to_query_class_name(Temp)


class TagObjectTestCase:
    def __init__(self) -> None:
        self.user = User.objects.create(username="test")

    def test_creates_tag_links(self):
        t1 = Tag.objects.create(name="test", color="FF00FFFF", assigned_to=self.user)
        t2 = Tag.objects.create(name="test2", color="FF00FFFF", assigned_to=self.user)
        t3 = Tag.objects.create(name="test3", color="FF00FFFF", assigned_to=self.user)

        task = Task.objects.create(name="task", assigned_to=self.user)

        assert TagLink.objects.count() == 0

        task_link_count = tag_object(task, [t1, t2, t3])

        assert task_link_count == 3
        assert TagLink.objects.count() == 3

        note = Note.objects.create(title="note test", assigned_to=self.user)

        note_link_count = tag_object(note, [t1, t2])
        assert note_link_count == 2

    def test_apply_tag_multiple_times(self):
        tag = Tag.objects.create(name="test", color="FF00FFFF", assigned_to=self.user)

        task_1 = Task.objects.create(name="task", assigned_to=self.user)
        task_2 = Task.objects.create(name="task2", assigned_to=self.user)

        tag_object(task_1, [tag])
        tag_object(task_2, [tag])

        assert TagLink.objects.count() == 2

    def skips_existing_tag_links(self):
        t1 = Tag.objects.create(name="test", color="FF00FFFF", assigned_to=self.user)
        t2 = Tag.objects.create(name="test2", color="FF00FFFF", assigned_to=self.user)
        t3 = Tag.objects.create(name="test3", color="FF00FFFF", assigned_to=self.user)

        task = Task.objects.create(name="task", assigned_to=self.user)

        assert TagLink.objects.count() == 0

        task_link_count = tag_object(task, [t1, t2])

        assert task_link_count == 2
        assert TagLink.objects.count() == 2

        new_count = tag_object(task, [t3])

        assert new_count == 1
        assert TagLink.objects.count() == 3


class TagTestCase:
    def __init__(self) -> None:
        self.user = User.objects.create(username="test")

    def test_total_time(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        start_time = timezone.now()

        time_entry = TimeEntry.objects.create(
            started_at=start_time,
            ended_at=start_time + timedelta(seconds=10),
            assigned_to=self.user,
        )

        tag_object(time_entry, [t])

        assert t.get_total_time() == timedelta(seconds=10)

    def test_no_total_time(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        assert t.get_total_time() == timedelta(0)

    def test_no_total_references(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)
        assert t.get_total_references() == 0

    def test_total_time_many_entries(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        start_time = timezone.now()

        time_entry = TimeEntry.objects.create(
            started_at=start_time,
            ended_at=start_time + timedelta(seconds=10),
            assigned_to=self.user,
        )

        tag_object(time_entry, [t])

        time_entry_2 = TimeEntry.objects.create(
            started_at=start_time + timedelta(seconds=10),
            ended_at=start_time + timedelta(seconds=20),
            assigned_to=self.user,
        )

        tag_object(time_entry_2, [t])

        assert t.get_total_time() == timedelta(seconds=20)

        assert t.get_total_time(chunk_size=1) == timedelta(seconds=20)

    def test_total_time_soft_deletes(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        start_time = timezone.now()

        time_entry = TimeEntry.objects.create(
            started_at=start_time,
            ended_at=start_time + timedelta(seconds=10),
            assigned_to=self.user,
        )

        tag_object(time_entry, [t])

        time_entry_2 = TimeEntry.objects.create(
            started_at=start_time + timedelta(seconds=10),
            ended_at=start_time + timedelta(seconds=20),
            assigned_to=self.user,
        )

        tag_object(time_entry_2, [t])

        assert t.get_total_time() == timedelta(seconds=20)

        time_entry_2.delete()

        assert t.get_total_time() == timedelta(seconds=10)

    def test_time_report_no_entries(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        report = t.get_time_report()

        assert report == {}

    def test_time_report_single_entry(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        start_time = timezone.now()

        time_entry = TimeEntry.objects.create(
            started_at=start_time,
            ended_at=start_time + timedelta(seconds=10),
            assigned_to=self.user,
        )

        tag_object(time_entry, [t])

        report = t.get_time_report()

        assert report == {start_time.date(): timedelta(seconds=10)}

    def test_time_report_single_entry_span_days(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        start_time = datetime(
            year=2000, month=1, day=1, hour=12, tzinfo=timezone.get_current_timezone()
        )
        end_time = start_time + timedelta(hours=13)

        time_entry = TimeEntry.objects.create(
            started_at=start_time,
            ended_at=end_time,
            assigned_to=self.user,
        )

        tag_object(time_entry, [t])

        report = t.get_time_report()

        assert report == {
            start_time.date(): timedelta(hours=12),
            end_time.date(): timedelta(hours=1),
        }

    def test_time_report_many_entries_one_day(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        start_time = timezone.now()

        time_entry = TimeEntry.objects.create(
            started_at=start_time,
            ended_at=start_time + timedelta(hours=1),
            assigned_to=self.user,
        )

        time_entry_2 = TimeEntry.objects.create(
            started_at=start_time + timedelta(minutes=10),
            ended_at=start_time + timedelta(minutes=20),
            assigned_to=self.user,
        )

        tag_object(time_entry, [t])
        tag_object(time_entry_2, [t])

        report = t.get_time_report()

        assert report == {start_time.date(): timedelta(hours=1, minutes=10)}

    def test_time_report_many_entries_many_days(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        start_1 = datetime(
            year=2000, month=1, day=1, hour=12, tzinfo=timezone.get_current_timezone()
        )
        end_1 = start_1 + timedelta(hours=13)

        start_2 = start_1 + timedelta(minutes=30)
        end_2 = start_2 + timedelta(hours=13)

        time_entry = TimeEntry.objects.create(
            started_at=start_1,
            ended_at=end_1,
            assigned_to=self.user,
        )

        time_entry_2 = TimeEntry.objects.create(
            started_at=start_2,
            ended_at=end_2,
            assigned_to=self.user,
        )

        tag_object(time_entry, [t])
        tag_object(time_entry_2, [t])

        report = t.get_time_report()

        assert report == {
            start_1.date(): timedelta(hours=23, minutes=30),
            end_2.date(): timedelta(hours=2, minutes=30),
        }


class TaskTestCase:
    def __init__(self) -> None:
        self.user = User.objects.create(username="test")

    def test_delete(self):
        task = Task.objects.create(name="test", assigned_to=self.user)

        t = Tag.objects.create(name="test", color="FF0000FF", assigned_to=self.user)
        TagLink.objects.create(tag=t, task=task)

        assert TagLink.objects.count() == 1

        task.delete()

        assert TagLink.objects.count() == 0
        assert TagLink.objects_with_deleted.count() == 1

        task.delete(hard=True)
        assert TagLink.objects_with_deleted.count() == 0
