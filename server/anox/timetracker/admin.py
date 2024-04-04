from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin, GroupAdmin

from .models import Note, Statistic, StatisticValue, Tag, TagLink, Task, Timestamp, TimeEntry

class AdminSite(admin.AdminSite):
    site_header = "Anox administration"

admin_site = AdminSite(name="anox_admin")

class TimeEntryAdmin(admin.ModelAdmin):
    pass

admin_site.register([Note, Statistic, StatisticValue, Tag, TagLink, Task, Timestamp])
admin_site.register(TimeEntry, TimeEntryAdmin)

admin_site.register(User, UserAdmin)
admin_site.register(Group, GroupAdmin)
