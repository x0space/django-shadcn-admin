from django.apps import AppConfig
from django.contrib.admin import apps as admin_apps


class ShadcnConfig(AppConfig):
    default = True
    name = "django_shadcn"
    verbose_name = "Django Shadcn Admin"

    def ready(self):
        from . import checks  # noqa: F401


class ShadcnAdminConfig(admin_apps.AdminConfig):
    default = False
    default_site = "django_shadcn.admin.ShadcnAdminSite"
