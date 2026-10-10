from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class WorkspaceConfig(AppConfig):
    name = "demo.workspace"
    verbose_name = _("Workspace")
