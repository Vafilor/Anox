from django.test import TestCase

from .models import Note, Tag, TagLink, Task, User, tag_object


class TagObjectTestCase(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create(username="test", password="test")

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


class TaskTestCase(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create(username="test", password="test")

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
