from datetime import datetime, timedelta
from unittest import TestCase as UnitTestCase

from .utils import split_datetimes_across_days, start_of_next_day, to_canonical_name


class UtilsTests(UnitTestCase):
    def test_to_canonical_name(self):
        self.assertEqual(to_canonical_name("CaPitAl"), "capital")
        self.assertEqual(to_canonical_name("  spa ce   "), "spa ce")

    def test_start_of_next_day(self):
        when = datetime(year=2000, month=11, day=23)
        next = start_of_next_day(when=when)
        self.assertEqual(next.day, 24)
        self.assertEqual(next.month, 11)

        when = datetime(year=2000, month=11, day=30)
        next = start_of_next_day(when=when)
        self.assertEqual(next.day, 1)
        self.assertEqual(next.month, 12)

        when = datetime(year=2000, month=12, day=31)
        next = start_of_next_day(when=when)
        self.assertEqual(next.day, 1)
        self.assertEqual(next.month, 1)
        self.assertEqual(next.year, 2001)

    def test_split_datetimes_across_days_same_day(self):
        start = datetime(year=2000, month=11, day=23)
        end = start + timedelta(hours=1)

        parts = split_datetimes_across_days(start=start, end=end)

        self.assertEqual(len(parts), 2)
        self.assertEqual(parts[0].day, 23)
        self.assertEqual(parts[1].day, 23)

    def test_split_datetimes_across_days_exception(self):
        start = datetime(year=2000, month=11, day=23)
        end = start - timedelta(days=1)

        with self.assertRaises(ValueError):
            split_datetimes_across_days(start=start, end=end)

    def test_split_datetimes_across_days(self):
        start = datetime(year=2000, month=11, day=23)
        end = datetime(year=2000, month=11, day=25, hour=13)

        parts = split_datetimes_across_days(start=start, end=end)

        self.assertEqual(len(parts), 6)

        self.assertEqual(parts[0].day, 23)
        self.assertEqual(parts[1].day, 24)

        self.assertEqual(parts[2].day, 24)
        self.assertEqual(parts[3].day, 25)

        self.assertEqual(parts[4].day, 25)
        self.assertEqual(parts[5].day, 25)
