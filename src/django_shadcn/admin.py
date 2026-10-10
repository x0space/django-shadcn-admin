from collections.abc import Callable
from typing import Any, ClassVar

from django.contrib.admin import AdminSite, ModelAdmin
from django.forms import BoundField, Widget
from django.http import HttpRequest
from django.template.response import TemplateResponse
from django.urls import path

WidgetAdapter = Callable[[BoundField, HttpRequest], dict[str, Any]]


class ShadcnAdminSite(AdminSite):
    """A regular AdminSite; the middleware adapts standard TemplateResponses."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.widget_adapters: dict[type[Widget], WidgetAdapter] = {}

    def each_context(self, request):
        return {**super().each_context(request), "_shadcn_site": self}

    def register_widget(self, widget_class: type[Widget], adapter: WidgetAdapter) -> None:
        """Register adapter(bound_field, request) -> JSON-compatible descriptor."""
        self.widget_adapters[widget_class] = adapter

    def get_urls(self):
        return [
            path("components/", self.admin_view(self.components), name="shadcn_components"),
        ] + super().get_urls()

    def components(self, request):
        return TemplateResponse(
            request,
            "django_shadcn/catalog.html",
            {**self.each_context(request), "title": "Component library", "_shadcn_catalog": True},
        )


class ShadcnModelAdmin(ModelAdmin):
    shadcn_field_widgets: ClassVar[dict[str, str]] = {}

    # Only explicitly configured fields/relations are exposed by workspace tools.
    shadcn_workspace: ClassVar[dict[str, str]] = {}
    shadcn_relations: ClassVar[list[str]] = []
    shadcn_action_previews: ClassVar[dict[str, dict[str, Any]]] = {}

    def get_urls(self):
        from .workspace import workspace_view

        return [
            path(
                "workspace/<str:tool>/",
                self.admin_site.admin_view(
                    lambda request, tool: workspace_view(self, request, tool)
                ),
                name=f"{self.opts.app_label}_{self.opts.model_name}_workspace",
            ),
        ] + super().get_urls()

    def response_action(self, request, queryset, **kwargs):
        from .workspace import validate_action_review

        if request.POST.get("_shadcn_review"):
            from django.contrib import messages
            from django.core import signing
            from django.db import transaction
            from django.http import HttpResponseRedirect

            with transaction.atomic():
                # Lock reviewed rows before rechecking their state and invoking the action.
                locked = queryset
                if request.POST.get("select_across") != "1":
                    locked = locked.filter(pk__in=request.POST.getlist("_selected_action"))
                # A subquery avoids locking nullable joins in a custom ChangeList.
                list(
                    self.model._base_manager.using(queryset.db)
                    .filter(pk__in=locked.values("pk"))
                    .select_for_update()
                    .order_by("pk")[:1001]
                )
                error = validate_action_review(self, request)
                if error:
                    self.message_user(request, error, messages.ERROR)
                    return HttpResponseRedirect(request.get_full_path())
                binding = signing.loads(
                    request.POST["_shadcn_review"], salt="shadcn-action-review", max_age=300
                )
                return super().response_action(
                    request, queryset.filter(pk__in=binding["keys"]), **kwargs
                )
        return super().response_action(request, queryset, **kwargs)
