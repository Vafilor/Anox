from datetime import timedelta
from unittest import TestCase as UnitTestCase

from django.test import TestCase
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


class ObjectToQueryClassNameTest(UnitTestCase):
    def test_correct_result(self):
        user = User(username="test")

        self.assertEqual(
            object_to_query_class_name(
                Tag(name="test", color="FF00FFFF", assigned_to=user)
            ),
            "tag",
        )
        self.assertEqual(
            object_to_query_class_name(Task(name="test", assigned_to=user)), "task"
        )
        self.assertEqual(
            object_to_query_class_name(TimeEntry(assigned_to=user)), "time_entry"
        )
        self.assertEqual(
            object_to_query_class_name(Timestamp(assigned_to=user)), "timestamp"
        )
        self.assertEqual(
            object_to_query_class_name(Statistic(assigned_to=user)), "statistic"
        )
        self.assertEqual(object_to_query_class_name(Note(assigned_to=user)), "note")

        class Temp:
            pass

        with self.assertRaises(ValueError):
            object_to_query_class_name(Temp)


class TagObjectTestCase(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create(username="test")

    def test_creates_tag_links(self):
        t1 = Tag.objects.create(name="test", color="FF00FFFF", assigned_to=self.user)
        t2 = Tag.objects.create(name="test2", color="FF00FFFF", assigned_to=self.user)
        t3 = Tag.objects.create(name="test3", color="FF00FFFF", assigned_to=self.user)

        task = Task.objects.create(name="task", assigned_to=self.user)

        self.assertEqual(TagLink.objects.count(), 0)

        task_link_count = tag_object(task, [t1, t2, t3])

        self.assertEqual(task_link_count, 3)
        self.assertEqual(TagLink.objects.count(), 3)

        note = Note.objects.create(title="note test", assigned_to=self.user)

        note_link_count = tag_object(note, [t1, t2])
        self.assertEqual(note_link_count, 2)

    def skips_existing_tag_links(self):
        t1 = Tag.objects.create(name="test", color="FF00FFFF", assigned_to=self.user)
        t2 = Tag.objects.create(name="test2", color="FF00FFFF", assigned_to=self.user)
        t3 = Tag.objects.create(name="test3", color="FF00FFFF", assigned_to=self.user)

        task = Task.objects.create(name="task", assigned_to=self.user)

        self.assertEqual(TagLink.objects.count(), 0)

        task_link_count = tag_object(task, [t1, t2])

        self.assertEqual(task_link_count, 2)
        self.assertEqual(TagLink.objects.count(), 2)

        new_count = tag_object(task, [t3])

        self.assertEqual(new_count, 1)
        self.assertEqual(TagLink.objects.count(), 3)

    def test_total_time(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        start_time = timezone.now()

        time_entry = TimeEntry.objects.create(
            started_at=start_time,
            ended_at=start_time + timedelta(seconds=10),
            assigned_to=self.user,
        )

        tag_object(time_entry, [t])

        self.assertEqual(t.get_total_time(), timedelta(seconds=10))

    def test_no_total_time(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)

        self.assertEqual(t.get_total_time(), timedelta(0))

    def test_no_total_references(self):
        t = Tag.objects.create(name="test", assigned_to=self.user)
        self.assertEqual(t.get_total_references(), 0)

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

        self.assertEqual(t.get_total_time(), timedelta(seconds=20))

        self.assertEqual(t.get_total_time(chunk_size=1), timedelta(seconds=20))

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

        self.assertEqual(t.get_total_time(), timedelta(seconds=20))

        time_entry_2.delete()

        self.assertEqual(t.get_total_time(), timedelta(seconds=10))


class TaskTestCase(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create(username="test")

    def test_delete(self):
        task = Task.objects.create(name="test", assigned_to=self.user)

        t = Tag.objects.create(name="test", color="FF0000FF", assigned_to=self.user)
        TagLink.objects.create(tag=t, task=task)

        self.assertEqual(TagLink.objects.count(), 1)

        task.delete()

        self.assertEqual(TagLink.objects.count(), 0)
        self.assertEqual(TagLink.objects_with_deleted.count(), 1)

        task.delete(hard=True)
        self.assertEqual(TagLink.objects_with_deleted.count(), 0)
