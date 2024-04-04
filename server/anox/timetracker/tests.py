from django.test import TestCase
from unittest import TestCase as UnitTestCase

from .utils import to_canonical_name

class UtilsTests(UnitTestCase):
    def test_to_canonical_name(self):
        self.assertEqual(to_canonical_name("CaPitAl"), "capital")
        self.assertEqual(to_canonical_name("  spa ce   "), "spa ce")
