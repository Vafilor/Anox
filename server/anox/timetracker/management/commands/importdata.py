import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Mapping, Set

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError, OutputWrapper
from django.core.paginator import Paginator
from django.utils.timezone import make_aware, now
from timetracker.models import (
    Note,
    Statistic,
    StatisticValue,
    Tag,
    TagLink,
    Task,
    TimeEntry,
    Timestamp,
)
from timetracker.utils import to_canonical_name

CHUNK_SIZE = 500

# TODO the created/updated timestamps are not actually being set
# TODO use in_bulk() method for mappings.


class TagConsolidator:
    def __init__(self) -> None:
        self.old_id_to_new_id: Mapping[str, str] = dict()

    def add(self, old_id: str, new_id: str):
        # There is no transitivity.
        # It is possible other entries point to an old id
        # Suppose 'cat' 'Cat' and 'CAT' have the same canonical name
        # and we have
        # e.g.   map['Cat'] = 'cat'
        # and we set
        #        map['cat'] = 'CAT'
        # then we need to have 'Cat' point to 'CAT' as well.
        #        map['Cat'] = 'CAT'
        #        map['cat'] = 'CAT'
        keys_to_change = [old_id]
        for key, value in self.old_id_to_new_id.items():
            if value == new_id:
                keys_to_change.append(key)

        for key in keys_to_change:
            self.old_id_to_new_id[key] = new_id

    def get_target_id(self, id: str) -> str:
        if id in self.old_id_to_new_id:
            return self.old_id_to_new_id[id]

        return id

    def is_mapped(self, id: str) -> bool:
        return id in self.old_id_to_new_id


class UserCache:
    def __init__(self) -> None:
        self.username_to_id_cache: Mapping[str, str] = dict()

    def user_from_username(self, username: str) -> User:
        id = self.username_to_id_cache.get(username)
        if id is not None:
            return id

        user = User.objects.filter(username=username).first()
        self.username_to_id_cache[username] = user.id

        return user.id


def ensure_task_canonical_name(task: Task, canonical_names: Set):
    description = task.description
    name = task.name
    canonical_name = task.canonical_name

    counter = 1
    while task.canonical_name in canonical_names:
        task.description = f"Original name: {name}. Original canonical name: {canonical_name}\n{description}"

        append_len = len(str(counter)) + 2
        if len(task.name) >= (255 - append_len):
            task.name = f"{name[:-append_len]}__{counter}"
            task.canonical_name = f"{canonical_name[:-append_len]}__{counter}"
        else:
            task.name = f"{name}__{counter}"
            task.canonical_name = f"{canonical_name}__{counter}"

        counter += 1

    canonical_names.add(task.canonical_name)


user_cache = UserCache()
tag_consolidator = TagConsolidator()


def chunker(seq, size: int):
    return (seq[pos : pos + size] for pos in range(0, len(seq), size))


def format_timestamp(ts: str) -> datetime:
    return make_aware(datetime.fromtimestamp(int(ts)))


def format_color(color: str) -> str:
    # Old colors stored the leading #, get rid of it
    if color[0] == "#":
        color = color[1:]

    # Old colors did not store alpha component, so add those.
    if len(color) == 6:
        return color + "00"


def file_name_to_file_type(name: str) -> str:
    last_index = name.rindex("_")
    return name[:last_index]


def handle_notes(items: List[dict]):
    for chunk in chunker(items, CHUNK_SIZE):
        input_ids = [item["id"] for item in chunk]
        existing = Note.objects.filter(pk__in=input_ids)
        mapping = {str(item.id): item for item in existing}

        TagLink.objects.filter(note__in=mapping.keys()).delete()

        new_items = []
        new_tags = []

        for item in chunk:
            if item["id"] not in mapping:
                new_items.append(
                    Note(
                        id=item["id"],
                        created_at=format_timestamp(item["createdAt"]),
                        updated_at=format_timestamp(item["updatedAt"]),
                        title=item["title"],
                        content=item["content"],
                        assigned_to_id=user_cache.user_from_username(
                            item["assignedTo"]
                        ),
                    )
                )
            else:
                note = mapping[item["id"]]
                note.updated_at = format_timestamp(item["updatedAt"])
                note.title = item["title"]
                note.content = item["content"]
                note.assigned_to_id = user_cache.user_from_username(item["assignedTo"])

            for tag in item["tags"]:
                new_tags.append(
                    TagLink(
                        tag_id=tag_consolidator.get_target_id(tag["id"]),
                        note_id=item["id"],
                    )
                )

        Note.objects.bulk_create(new_items)
        Note.objects.bulk_update(
            existing, ["updated_at", "title", "content", "assigned_to"]
        )
        TagLink.objects.bulk_create(new_tags)


def handle_statistics(items: List[dict]):
    for chunk in chunker(items, CHUNK_SIZE):
        input_ids = [item["id"] for item in chunk]
        existing = Statistic.objects.filter(pk__in=input_ids)
        mapping = {str(item.id): item for item in existing}

        TagLink.objects.filter(statistic__in=mapping.keys()).delete()

        new_items = []
        new_tags = []

        for item in chunk:
            if item["id"] not in mapping:
                new_items.append(
                    Statistic(
                        id=item["id"],
                        created_at=format_timestamp(item["createdAt"]),
                        updated_at=(
                            format_timestamp(item["updatedAt"])
                            if "updated_at" in item
                            else now()
                        ),
                        name=item["name"],
                        canonical_name=to_canonical_name(item["canonicalName"]),
                        description=item["description"],
                        color=format_color(item["color"]),
                        unit=item["unit"],
                        time_type=item["timeType"],
                        icon=item["icon"] if "icon" in item else None,
                        assigned_to_id=user_cache.user_from_username(
                            item["assignedTo"]
                        ),
                    )
                )
            else:
                statistic = mapping[item["id"]]
                statistic.updated_at = (
                    format_timestamp(item["updatedAt"])
                    if "updated_at" in item
                    else now()
                )
                statistic.name = item["name"]
                statistic.canonical_name = to_canonical_name(item["canonicalName"])
                statistic.description = item["description"]
                statistic.color = format_color(item["color"])
                statistic.unit = item["unit"]
                statistic.time_type = item["timeType"]
                statistic.icon = item["icon"] if "icon" in item else None
                statistic.assigned_to_id = user_cache.user_from_username(
                    item["assignedTo"]
                )

            for tag in item["tags"]:
                new_tags.append(
                    TagLink(
                        tag_id=tag_consolidator.get_target_id(tag["id"]),
                        statistic_id=item["id"],
                    )
                )

        Statistic.objects.bulk_create(new_items)
        Statistic.objects.bulk_update(
            existing,
            [
                "updated_at",
                "name",
                "canonical_name",
                "description",
                "color",
                "unit",
                "time_type",
                "icon",
                "assigned_to",
            ],
        )
        TagLink.objects.bulk_create(new_tags)


def handle_statistic_values(items: List[dict]):
    for chunk in chunker(items, CHUNK_SIZE):
        input_ids = [item["id"] for item in chunk]
        existing = StatisticValue.objects.filter(pk__in=input_ids)
        mapping = {str(item.id): item for item in existing}

        new_items = []

        for item in chunk:
            if item["id"] not in mapping:
                new_items.append(
                    StatisticValue(
                        id=item["id"],
                        created_at=format_timestamp(item["createdAt"]),
                        started_at=format_timestamp(item["startedAt"]),
                        ended_at=format_timestamp(item["endedAt"]),
                        value=item["value"],
                        statistic_id=item["statisticId"],
                    )
                )
            else:
                statistic_value = mapping[item["id"]]
                statistic_value.started_at = format_timestamp(item["startedAt"])
                statistic_value.ended_at = format_timestamp(item["endedAt"])
                statistic_value.value = item["value"]
                statistic_value.statistic_id = item["statisticId"]

        StatisticValue.objects.bulk_create(new_items)
        StatisticValue.objects.bulk_update(
            existing, ["started_at", "ended_at", "value", "statistic"]
        )


def handle_tags(items: List[dict]):
    for chunk in chunker(items, CHUNK_SIZE):
        input_ids = [item["id"] for item in chunk]
        existing = Tag.objects.filter(pk__in=input_ids)
        mapping = {str(item.id): item for item in existing}

        new_items = []

        for item in chunk:
            if item["id"] not in mapping:
                if tag_consolidator.is_mapped(item["id"]):
                    continue

                new_items.append(
                    Tag(
                        id=item["id"],
                        created_at=format_timestamp(item["createdAt"]),
                        name=item["name"],
                        canonical_name=to_canonical_name(item["canonicalName"]),
                        color=format_color(item["color"]),
                        assigned_to_id=user_cache.user_from_username(
                            item["assignedTo"]
                        ),
                    )
                )
            else:
                tag = mapping[item["id"]]
                tag.name = item["name"]
                tag.canonical_name = to_canonical_name(item["canonicalName"])
                tag.color = format_color(item["color"])
                tag.assigned_to_id = user_cache.user_from_username(item["assignedTo"])

        Tag.objects.bulk_create(new_items)
        Tag.objects.bulk_update(existing, ["name", "canonical_name", "assigned_to"])


def handle_tasks(items: List[dict]):
    paginator = Paginator(
        Task.objects.only("canonical_name").order_by("canonical_name"), per_page=1000
    )

    existing_canonical_names = set()
    for page in paginator:
        for task in page:
            existing_canonical_names.add(task.canonical_name)

    for chunk in chunker(items, CHUNK_SIZE):
        input_ids = [task["id"] for task in chunk]
        existing = Task.objects.filter(pk__in=input_ids)
        task_dict = {str(task.id): task for task in existing}

        TagLink.objects.filter(task__in=task_dict.keys()).delete()

        new_tasks = []
        new_tags = []

        for item in chunk:
            if item["id"] not in task_dict:
                task = Task(
                    id=item["id"],
                    created_at=format_timestamp(item["createdAt"]),
                    updated_at=format_timestamp(item["updatedAt"]),
                    completed_at=(
                        format_timestamp(item["completedAt"])
                        if "completedAt" in item
                        else None
                    ),
                    priority=item["priority"],
                    active=bool(item["active"]),
                    name=item["name"],
                    canonical_name=item["canonicalName"],
                    description=item["description"],
                    assigned_to_id=user_cache.user_from_username(item["assignedTo"]),
                    template="template" in item,
                    parent_id=item["parentId"] if "parentId" in item else None,
                )

                ensure_task_canonical_name(task, existing_canonical_names)

                new_tasks.append(task)
            else:
                task = task_dict[item["id"]]
                task.updated_at = format_timestamp(item["updatedAt"])
                task.completed_at = (
                    format_timestamp(item["completedAt"])
                    if "completedAt" in item
                    else None
                )
                task.priority = item["priority"]
                task.active = bool(item["active"])
                task.name = item["name"]
                task.canonical_name = to_canonical_name(item["canonicalName"])
                task.description = item["description"]
                task.assigned_to_id = user_cache.user_from_username(item["assignedTo"])
                task.template = "template" in item
                task.parent_id = item["parentId"] if "parentId" in item else None

                ensure_task_canonical_name(task, existing_canonical_names)

            for tag in item["tags"]:
                new_tags.append(
                    TagLink(
                        tag_id=tag_consolidator.get_target_id(tag["id"]),
                        task_id=item["id"],
                    )
                )

        Task.objects.bulk_create(new_tasks)
        Task.objects.bulk_update(
            existing,
            [
                "updated_at",
                "completed_at",
                "priority",
                "active",
                "name",
                "canonical_name",
                "description",
                "assigned_to",
            ],
        )
        TagLink.objects.bulk_create(new_tags)


def handle_time_entries(items: List[dict]):
    for chunk in chunker(items, CHUNK_SIZE):
        input_ids = [time_entry["id"] for time_entry in chunk]
        existing = TimeEntry.objects.filter(pk__in=input_ids)
        time_entry_dict = {str(time_entry.id): time_entry for time_entry in existing}

        TagLink.objects.filter(time_entry__in=time_entry_dict.keys()).delete()

        new_time_entries = []
        new_tags = []

        for item in chunk:
            if item["id"] not in time_entry_dict:
                new_time_entries.append(
                    TimeEntry(
                        id=item["id"],
                        created_at=format_timestamp(item["createdAt"]),
                        updated_at=format_timestamp(item["updatedAt"]),
                        started_at=format_timestamp(item["startedAt"]),
                        ended_at=(
                            format_timestamp(item["endedAt"])
                            if "endedAt" in item
                            else None
                        ),
                        description=item["description"],
                        assigned_to_id=user_cache.user_from_username(
                            item["assignedTo"]
                        ),
                        task_id=item["task"]["id"] if "task" in item else None,
                    )
                )
            else:
                time_entry = time_entry_dict[item["id"]]
                time_entry.updated_at = format_timestamp(item["updatedAt"])
                time_entry.started_at = format_timestamp(item["startedAt"])
                time_entry.ended_at = (
                    format_timestamp(item["endedAt"]) if "endedAt" in item else None
                )
                time_entry.description = item["description"]
                time_entry.assigned_to_id = user_cache.user_from_username(
                    item["assignedTo"]
                )
                time_entry.task_id = item["task"]["id"] if "task" in item else None

            for tag in item["tags"]:
                new_tags.append(
                    TagLink(
                        tag_id=tag_consolidator.get_target_id(tag["id"]),
                        time_entry_id=item["id"],
                    )
                )

        TimeEntry.objects.bulk_create(new_time_entries)
        TimeEntry.objects.bulk_update(
            existing,
            [
                "updated_at",
                "started_at",
                "ended_at",
                "description",
                "assigned_to",
                "task_id",
            ],
        )
        TagLink.objects.bulk_create(new_tags)


def handle_timestamps(items: List[dict]):
    for chunk in chunker(items, CHUNK_SIZE):
        input_ids = [item["id"] for item in chunk]
        existing = Timestamp.objects.filter(pk__in=input_ids)
        mapping = {str(item.id): item for item in existing}

        TagLink.objects.filter(timestamp__in=mapping.keys()).delete()

        new_items = []
        new_tags = []

        for item in chunk:
            if item["id"] not in mapping:
                new_items.append(
                    Timestamp(
                        id=item["id"],
                        created_at=format_timestamp(item["createdAt"]),
                        description=item["description"],
                        assigned_to_id=user_cache.user_from_username(
                            item["assignedTo"]
                        ),
                    )
                )
            else:
                timestamp = mapping[item["id"]]
                timestamp.created_at = format_timestamp(item["createdAt"])
                timestamp.description = item["description"]
                timestamp.assigned_to_id = user_cache.user_from_username(
                    item["assignedTo"]
                )

            for tag in item["tags"]:
                new_tags.append(
                    TagLink(
                        tag_id=tag_consolidator.get_target_id(tag["id"]),
                        timestamp_id=item["id"],
                    )
                )

        Timestamp.objects.bulk_create(new_items)
        Timestamp.objects.bulk_update(
            existing, ["created_at", "description", "assigned_to"]
        )
        TagLink.objects.bulk_create(new_tags)


def handle_users(items: List[dict]):
    for item in items:
        # TODO handle if user already exists. Change id to username for now
        # TODO additional user data fields
        if not User.objects.filter(username=item["username"]).exists():
            User.objects.create_user(
                # TODO make sure usernames are unique
                # TODO check id type, see if we can make it a uuid
                # id=item["id"]
                username=item["username"],
                email=item["email"],
                # TODO indicate that a password needs to be changed?
                password=str(uuid.uuid4()),
            )


def ensure_tags_have_unqiue_names(data_path: Path, stdout: OutputWrapper):
    tag_paths = []
    for path in data_path.iterdir():
        if path.name.startswith("tags_"):
            tag_paths.append(path.absolute())

    tag_mapping: Mapping[str, Mapping] = dict()

    for path in tag_paths:
        with path.open() as f:
            data = json.load(f)

        for item in data:
            id = item["id"]
            name = item["name"]
            color = item["color"]

            canonical_name = to_canonical_name(name)
            if canonical_name in tag_mapping:
                existing_tag = tag_mapping[canonical_name]
                existing_name = existing_tag["name"]
                existing_color = existing_tag["color"]
                stdout.write(
                    f"Tag '{name}' -> '{canonical_name}' already exists as '{existing_name}'"
                )
                stdout.write("Which one do you want to keep?")
                stdout.write(f"1. '{existing_name}': {existing_color}")
                stdout.write(f"2. '{name}': {color}")

                choice = 0
                while choice not in [1, 2]:
                    try:
                        choice = int(input("Keep: "))
                    except:
                        stdout.write("Unknown input, please enter 1 or 2")

                if choice == 1:
                    tag_consolidator.add(id, existing_tag["id"])
                else:
                    tag_consolidator.add(existing_tag["id"], id)

                stdout.write("Mapping updated")
                stdout.write()
            else:
                tag_mapping[canonical_name] = item


class Command(BaseCommand):
    help = "Imports existing data from files inside a directory"

    def add_arguments(self, parser):
        parser.add_argument("directory_path", type=Path)

    def handle(self, *args, **options):
        dir_path: Path = options["directory_path"]

        if not dir_path.exists():
            raise CommandError(f'Path "{dir_path}" does not exist')

        if not dir_path.is_dir():
            raise CommandError(f'Path "{dir_path}" is not a directory')

        order_file_path = dir_path / "order.json"
        if not order_file_path.exists():
            raise CommandError('Missing an "order.json" file')

        with order_file_path.open() as f:
            file_order = json.load(f)

        start = datetime.now()

        ensure_tags_have_unqiue_names(dir_path, self.stdout)

        for file_path in file_order:
            path = Path(dir_path / file_path)
            if not path.exists():
                raise CommandError(f'"{file_path}" does not exist')

            file_type = file_name_to_file_type(path.name)

            self.stdout.write(f"Importing '{path.name}'")

            with path.open() as f:
                data = json.load(f)

            if file_type == "notes":
                handle_notes(data)
            elif file_type == "statistics":
                handle_statistics(data)
            elif file_type == "statistic_values":
                handle_statistic_values(data)
            elif file_type == "tags":
                handle_tags(data)
            elif file_type == "tasks":
                handle_tasks(data)
            elif file_type == "time_entries":
                handle_time_entries(data)
            elif file_type == "time_entries":
                handle_time_entries(data)
            elif file_type == "timestamps":
                pass
                # handle_timestamps(data)
            elif file_type == "users":
                handle_users(data)
            else:
                raise CommandError(f'Unknown file type f"{file_type}"')

        end = datetime.now()
        elapsed = (end - start).total_seconds()

        self.stdout.write(f"Took {elapsed} seconds")
        self.stdout.write(self.style.SUCCESS("Successfully imported all data"))
