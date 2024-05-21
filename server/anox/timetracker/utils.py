from datetime import datetime, timedelta


def to_canonical_name(name: str) -> str:
    return name.lower().strip()


def start_of_next_day(when: datetime) -> datetime:
    next = when + timedelta(days=1)

    return next.replace(hour=0, minute=0, second=0, microsecond=0)


def split_datetimes_across_days(start: datetime, end: datetime) -> list[datetime]:
    """
    Given a start and end datetime, return a list of datetimes
    that split the input dates by the day.

    If the inputs are:
        start: 1/1/2000 8:35
        end: 1/4/2000 7:23

    the resulting list will have (with hours/min/seconds/microseconds
    kept for start/end dates and 0 for others)
    [
        1/1/2000 8:35, 1/2/2000 0:00,
        1/2/2000 0:00, 1/3/2000 0:00,
        1/3/2000 0:00, 1/4/2000 7:23
    ]
    """
    if start.day == end.day:
        return [start, end]

    if end.day < start.day:
        raise ValueError(f"End day ({end.day}) is before start day ({start.day})")

    result = []

    mid = start_of_next_day(start)
    result.append(start)
    result.append(mid)

    while mid.day < end.day:
        next = start_of_next_day(mid)
        result.append(mid)
        result.append(next)
        mid = next

    result.append(mid)
    result.append(end)

    return result
