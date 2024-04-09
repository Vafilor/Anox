from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group, User

from .models import (
    Note,
    Profile,
    Statistic,
    StatisticValue,
    Tag,
    TagLink,
    Task,
    TimeEntry,
    Timestamp,
)


class AdminSite(admin.AdminSite):
    site_header = "Anox administration"


admin_site = AdminSite(name="anox_admin")


class TimeEntryAdmin(admin.ModelAdmin):
    pass


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = "profile"


class UserAdmin(BaseUserAdmin):
    inlines = [ProfileInline]


admin_site.register([Note, Statistic, StatisticValue, Tag, TagLink, Task, Timestamp])
admin_site.register(TimeEntry, TimeEntryAdmin)

admin_site.register(User, UserAdmin)
admin_site.register(Group, GroupAdmin)
