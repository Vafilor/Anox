from django.contrib.auth.models import User
from django.test import TestCase

from .models import Tag


# A lot of this is heavily inspired by:
# https://medium.com/xgeeks/timestamps-and-soft-delete-with-django-65f74d86e022
class SoftDeletesTestCase(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create(username="test")

    def create_tag(self, name: str) -> Tag:
        return Tag(name=name, color="FF0000FF", assigned_to=self.user)

    def test_soft_delete(self):
        # Tag is used as a dummy model here because it is relatively simple
        # anything that uses SoftDelete should work
        tag = self.create_tag("test")
        tag.save()

        self.assertIsNone(tag.deleted_at)

        tag.delete()

        self.assertIsNotNone(tag.deleted_at)

    def test_restore(self):
        tag = self.create_tag("test")
        tag.save()
        tag.delete()

        self.assertIsNotNone(tag.deleted_at)
        self.assertEqual(Tag.objects.count(), 0)

        tag.restore()

        self.assertIsNone(tag.deleted_at)
        self.assertEqual(Tag.objects.count(), 1)

    def test_querysets_count(self):
        tag = self.create_tag("test")
        tag.save()

        self.assertEqual(Tag.objects.count(), 1)
        self.assertEqual(Tag.objects_deleted.count(), 0)
        self.assertEqual(Tag.objects_with_deleted.count(), 1)

        tag.delete()
        self.assertEqual(Tag.objects.count(), 0)
        self.assertEqual(Tag.objects_deleted.count(), 1)
        self.assertEqual(Tag.objects_with_deleted.count(), 1)

        tag.restore()

        tag2 = self.create_tag("test2")
        tag2.save()

        self.assertEqual(Tag.objects.count(), 2)
        self.assertEqual(Tag.objects_deleted.count(), 0)
        self.assertEqual(Tag.objects_with_deleted.count(), 2)

        tag2.delete()

        self.assertEqual(Tag.objects.count(), 1)
        self.assertEqual(Tag.objects_deleted.count(), 1)
        self.assertEqual(Tag.objects_with_deleted.count(), 2)

        tag2.delete(hard=True)
        self.assertEqual(Tag.objects.count(), 1)
        self.assertEqual(Tag.objects_deleted.count(), 0)
        self.assertEqual(Tag.objects_with_deleted.count(), 1)

    def test_bulk_soft_delete(self):
        self.create_tag("test").save()
        self.create_tag("test2").save()

        self.assertEqual(Tag.objects.count(), 2)
        Tag.objects.delete()

        self.assertEqual(Tag.objects.count(), 0)
        self.assertEqual(Tag.objects_deleted.count(), 2)
        self.assertEqual(Tag.objects_with_deleted.count(), 2)

    def test_bulk_hard_delete(self):
        self.create_tag("test").save()
        self.create_tag("test2").save()

        self.assertEqual(Tag.objects.count(), 2)

        Tag.objects.delete(hard=True)
        self.assertEqual(Tag.objects.count(), 0)
        self.assertEqual(Tag.objects_deleted.count(), 0)
        self.assertEqual(Tag.objects_with_deleted.count(), 0)

    def test_bulk_restore(self):
        self.create_tag("test").save()
        self.create_tag("test2").save()

        self.assertEqual(Tag.objects.count(), 2)

        Tag.objects.delete()
        self.assertEqual(Tag.objects.count(), 0)

        Tag.objects_deleted.restore()
        self.assertEqual(Tag.objects.count(), 2)
