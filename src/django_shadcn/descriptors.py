"""Convert already-authorized Django admin context into frontend descriptors.

This module does not implement saving, filtering or permission decisions in place
of Django. Native views construct every form, queryset and confirmation first.
"""

import re
from pathlib import Path

from django import forms
from django.contrib.admin.models import LogEntry
from django.contrib.admin.templatetags.admin_list import pagination, result_headers, results
from django.contrib.admin.templatetags.admin_modify import submit_row
from django.contrib.admin.templatetags.admin_urls import add_preserved_filters
from django.contrib.admin.utils import quote
from django.contrib.admin.views.main import PAGE_VAR
from django.middleware.csrf import get_token
from django.template.defaultfilters import unordered_list
from django.urls import reverse
from django.utils.encoding import force_str
from django.utils.html import conditional_escape
from django.utils.translation import get_language, get_language_bidi

from .conf import config, resolve
from .i18n import messages_for


def text(value):
    return force_str(value) if value is not None else ""


def html(value):
    if value is None:
        return ""
    return text(conditional_escape(value))


def field_descriptor(bound, request, site):
    widget = bound.field.widget
    for cls in type(widget).__mro__:
        if cls in site.widget_adapters:
            return site.widget_adapters[cls](bound, request)
    from django.contrib.admin.widgets import RelatedFieldWidgetWrapper

    related = isinstance(widget, RelatedFieldWidgetWrapper)
    actual = widget.widget if related else widget
    descriptor = {
        "name": bound.html_name,
        "id": bound.id_for_label or "id_" + bound.html_name,
        "label": text(bound.label),
        "help": html(bound.help_text),
        "errors": [text(error) for error in bound.errors],
        "required": bound.field.required,
        "disabled": bound.field.disabled,
        "value": bound.value(),
        "widget": "native",
        "html": text(bound),
        "attrs": {
            key: value
            for key, value in actual.attrs.items()
            if key in {"placeholder", "maxlength", "min", "max", "step", "autocomplete"}
        },
    }
    # Unknown custom widgets keep their original renderer, scripts and assets.
    builtin = type(actual).__module__ in {"django.forms.widgets", "django.contrib.admin.widgets"}
    if builtin:
        if bound.is_hidden:
            descriptor["widget"] = "hidden"
        elif isinstance(actual, forms.CheckboxInput):
            descriptor["widget"] = "checkbox"
        elif isinstance(actual, forms.Textarea):
            descriptor["widget"] = "textarea"
        elif isinstance(actual, (forms.Select, forms.RadioSelect)) and not related:
            descriptor["widget"] = "radio" if isinstance(actual, forms.RadioSelect) else "select"
            descriptor["multiple"] = isinstance(actual, forms.SelectMultiple)
            descriptor["choices"] = [
                {
                    "label": text(group_label),
                    "options": [
                        {
                            "value": text(option["value"]),
                            "label": text(option["label"]),
                            "selected": option["selected"],
                        }
                        for option in options
                    ],
                }
                for group_label, options, index in actual.optgroups(
                    bound.html_name, actual.format_value(bound.value()), actual.attrs
                )
            ]
        elif isinstance(actual, forms.ClearableFileInput):
            descriptor["widget"] = "file"
            descriptor["value"] = ""
            if bound.value():
                descriptor["widget"] = "native"  # Retains clear checkbox and existing-file link.
        elif isinstance(actual, forms.DateInput):
            descriptor["widget"] = "date"
            descriptor["value"] = (
                bound.value().isoformat() if hasattr(bound.value(), "isoformat") else bound.value()
            )
        elif isinstance(actual, forms.TimeInput):
            descriptor["widget"] = "time"
            descriptor["value"] = actual.format_value(bound.value())
        elif isinstance(actual, forms.NumberInput):
            descriptor["widget"] = "number"
        elif isinstance(actual, forms.PasswordInput):
            descriptor["widget"] = "password"
            descriptor["value"] = ""
        elif isinstance(actual, forms.EmailInput):
            descriptor["widget"] = "email"
        elif isinstance(actual, forms.URLInput):
            descriptor["widget"] = "url"
        elif isinstance(actual, forms.TextInput):
            descriptor["widget"] = "text"
    if descriptor["widget"] == "native":
        # Native widgets may intentionally mask a secret. Only their rendered
        # HTML belongs in the client descriptor, never the unrendered initial value.
        descriptor["value"] = None
    return descriptor


def fieldsets_descriptor(adminform, request, site):
    output = []
    for fieldset in adminform:
        lines = []
        for line in fieldset:
            fields = []
            for field in line:
                if field.is_readonly:
                    fields.append(
                        {
                            "widget": "readonly",
                            "id": f"id_{fieldset.form.add_prefix(text(field.field['name']))}",
                            "name": text(field.field["name"]),
                            "label": text(field.field["label"]),
                            "help": html(field.field["help_text"]),
                            "html": html(field.contents()),
                            "errors": [],
                        }
                    )
                else:
                    fields.append(field_descriptor(field.field, request, site))
            lines.append(fields)
        output.append(
            {
                "name": text(fieldset.name),
                "description": html(fieldset.description),
                "collapsed": "collapse" in fieldset.classes,
                "lines": lines,
            }
        )
    return output


def form_descriptor(context, request, site):
    adminform = context.get("adminform")
    form = adminform.form if adminform else context["form"]
    fieldsets = (
        fieldsets_descriptor(adminform, request, site)
        if adminform
        else [
            {
                "name": "",
                "description": "",
                "collapsed": False,
                "lines": [
                    [field_descriptor(field, request, site)] for field in form.visible_fields()
                ],
            }
        ]
    )
    overrides = getattr(context.get("model_admin"), "shadcn_field_widgets", {})
    if not overrides and adminform:
        overrides = getattr(adminform.model_admin, "shadcn_field_widgets", {})
    for group in fieldsets:
        for line in group["lines"]:
            for field in line:
                if field["name"] in overrides:
                    field["widget"] = overrides[field["name"]]
    inlines = []
    for inline in context.get("inline_admin_formsets", []):
        formset = inline.formset
        rows = []
        for inlineform in inline:
            if inlineform.form.prefix == f"{formset.prefix}-__prefix__":
                continue
            groups = fieldsets_descriptor(inlineform, request, site)
            if (
                formset.can_delete
                and inline.has_delete_permission
                and "DELETE" in inlineform.form.fields
            ):
                groups.append(
                    {
                        "name": "",
                        "description": "",
                        "collapsed": False,
                        "lines": [[field_descriptor(inlineform.form["DELETE"], request, site)]],
                    }
                )
            rows.append(
                {
                    "label": text(inlineform.original),
                    "fields": groups,
                    "hidden": [text(f) for f in inlineform.form.hidden_fields()],
                }
            )
        from django.contrib.admin.helpers import InlineAdminForm

        empty = InlineAdminForm(
            formset,
            formset.empty_form,
            inline.fieldsets,
            inline.prepopulated_fields,
            None,
            inline.readonly_fields,
            model_admin=inline.opts,
        )
        inlines.append(
            {
                "name": text(inline.opts.verbose_name_plural),
                "prefix": formset.prefix,
                "management": text(formset.management_form),
                "rows": rows,
                "empty": {
                    "label": "",
                    "fields": fieldsets_descriptor(empty, request, site),
                    "hidden": [text(f) for f in formset.empty_form.hidden_fields()],
                },
                "can_add": inline.has_add_permission,
                "max": formset.max_num,
                "errors": [text(e) for e in formset.non_form_errors()],
            }
        )
    buttons = submit_row(context) if adminform else {"show_save": True}
    if hasattr(buttons, "flatten"):
        buttons = buttons.flatten()
    opts = context.get("opts")
    original = context.get("original")
    from .workspace import tool_url

    return {
        "kind": "form",
        "fieldsets": fieldsets,
        "inlines": inlines,
        "hidden": [text(f) for f in form.hidden_fields()],
        "errors": [text(e) for e in form.non_field_errors()],
        "has_errors": bool(
            context.get("errors") or form.errors or any(i["errors"] for i in inlines)
        ),
        "buttons": {key: bool(value) for key, value in buttons.items() if key.startswith("show_")},
        "multipart": bool(context.get("has_file_field") or form.is_multipart()),
        "delete_url": reverse(
            f"{site.name}:{opts.app_label}_{opts.model_name}_delete", args=[quote(original.pk)]
        )
        if opts and original and context.get("has_delete_permission")
        else None,
        "history_url": reverse(
            f"{site.name}:{opts.app_label}_{opts.model_name}_history", args=[quote(original.pk)]
        )
        if opts and original and context.get("has_view_permission", True)
        else None,
        "cancel_url": reverse(f"{site.name}:{opts.app_label}_{opts.model_name}_changelist")
        if opts
        else reverse(f"{site.name}:index"),
        "prepopulated": [
            {
                "target": entry["field"].html_name,
                "sources": [f.html_name for f in entry["dependencies"]],
            }
            for entry in getattr(adminform, "prepopulated_fields", [])
        ],
        "relations_url": tool_url(adminform.model_admin, "relations")
        if adminform and original and getattr(adminform.model_admin, "shadcn_relations", [])
        else None,
        "object_key": text(original.pk) if original else None,
    }


def list_descriptor(context, request, site):
    cl = context["cl"]
    headers = list(result_headers(cl))
    rows = []
    for index, row in enumerate(results(cl)):
        editable = row.form
        cells = []
        for column_index, cell in enumerate(row):
            name = cl.list_display[column_index] if column_index < len(cl.list_display) else ""
            field = (
                field_descriptor(editable[name], request, site)
                if editable and name in editable.fields
                else None
            )
            cells.append(
                {"html": re.sub(r"^<(td|th)\b[^>]*>|</(td|th)>$", "", text(cell)), "field": field}
            )
        rows.append(
            {
                "key": text(cl.result_list[index].pk),
                "cells": cells,
                "hidden": [text(f) for f in editable.hidden_fields()] if editable else [],
            }
        )
    page_data = pagination(cl)
    formset = cl.formset
    from .workspace import workspace_descriptor

    return {
        "kind": "list",
        "workspace": workspace_descriptor(cl.model_admin, request, cl.result_list),
        "headers": [
            {
                "label": text(h["text"]),
                "sortable": h["sortable"],
                "url": h.get("url_primary"),
                "sorted": h.get("sorted", False),
                "checkbox": "action-checkbox-column" in text(h.get("class_attrib")),
            }
            for h in headers
        ],
        "rows": rows,
        "count": cl.result_count,
        "page": cl.page_num,
        "pages": [
            {
                "label": text(i),
                "current": i == cl.page_num,
                "url": cl.get_query_string({PAGE_VAR: i}) if isinstance(i, int) else None,
            }
            for i in page_data["page_range"]
        ],
        "search": cl.query,
        "search_enabled": bool(cl.search_fields),
        "search_hidden": [
            {"name": k, "value": v}
            for k, values in cl.params.items()
            if k not in {"q", "p"}
            for v in (values if isinstance(values, list) else [values])
        ],
        "filters": [
            {
                "title": text(spec.title),
                "choices": [
                    {
                        "label": text(c["display"]),
                        "selected": c["selected"],
                        "url": c["query_string"],
                    }
                    for c in spec.choices(cl)
                ],
            }
            for spec in cl.filter_specs
        ],
        "clear_url": cl.clear_all_filters_qs,
        "actions": [
            {"value": text(value), "label": text(label)}
            for value, label in context["action_form"].fields["action"].choices
            if value
        ]
        if context.get("action_form")
        else [],
        "management": text(formset.management_form) if formset else "",
        "errors": [text(e) for e in formset.non_form_errors()] if formset else [],
        "editable": bool(formset),
        "add_url": reverse(f"{site.name}:{cl.opts.app_label}_{cl.opts.model_name}_add")
        if context.get("has_add_permission")
        else None,
    }


def dashboard_descriptor(context, request, site):
    recent = []
    entries = LogEntry.objects.filter(user_id=request.user.pk).select_related("content_type")[:30]
    for entry in entries:
        model = entry.content_type.model_class() if entry.content_type else None
        admin = site._registry.get(model)
        if not admin:
            continue
        obj = admin.get_queryset(request).filter(pk=entry.object_id).first()
        if obj is None or not admin.has_view_or_change_permission(request, obj):
            continue
        recent.append(
            {
                "label": entry.object_repr,
                "message": entry.get_change_message(),
                "time": entry.action_time.isoformat(),
                "url": reverse(
                    f"{site.name}:{model._meta.app_label}_{model._meta.model_name}_change",
                    args=[quote(entry.object_id)],
                ),
            }
        )
        if len(recent) == 8:
            break
    widgets = []
    for provider in config()["DASHBOARD"]:
        widgets.extend(resolve(provider)(request, site) or [])
    return {"kind": "dashboard", "recent": recent, "widgets": widgets}


def page_descriptor(context, request, site, template_name):
    language = get_language() or "en"
    options = config()
    authenticated = (
        request.user.is_authenticated and request.user.is_active and request.user.is_staff
    )
    apps = context.get("available_apps", []) if authenticated else []
    navigation = [
        {
            "name": text(app["name"]),
            "models": [
                {
                    "name": text(model["name"]),
                    "url": model.get("admin_url"),
                    "add_url": model.get("add_url"),
                    "label": model["model"]._meta.label_lower,
                }
                for model in app["models"]
                if model.get("admin_url")
            ],
        }
        for app in apps
    ]
    custom_navigation = []
    if authenticated:
        for item in options["NAVIGATION"]:
            if not item.get("permission") or request.user.has_perm(item["permission"]):
                custom_navigation.append({"name": text(item["name"]), "url": item["url"]})
    base = {
        "version": 1,
        "title": text(context.get("title")),
        "language": language,
        "direction": "rtl" if get_language_bidi() else "ltr",
        "strings": messages_for(language),
        "brand": text(options["BRAND"]),
        "description": text(options["DESCRIPTION"]),
        "theme": options["THEME"],
        "calendar": options["CALENDAR"],
        "languages": options["LANGUAGES"],
        "navigation": navigation,
        "custom_navigation": custom_navigation,
        "csrf": get_token(request),
        "path": request.get_full_path(),
        "index_url": reverse(f"{site.name}:index"),
        "logout_url": reverse(f"{site.name}:logout"),
        "password_url": reverse(f"{site.name}:password_change"),
        "site_url": site.site_url,
        "catalog_url": reverse(f"{site.name}:shadcn_components"),
        "jsi18n_url": reverse(f"{site.name}:jsi18n"),
        "language_url": reverse("set_language"),
        "user": {
            "id": text(request.user.pk),
            "name": request.user.get_full_name() or request.user.get_username(),
        }
        if authenticated
        else None,
        "messages": [],
    }
    if context.get("_shadcn_catalog"):
        import json

        inventory = Path(__file__).parent / "component-inventory.json"
        page = {
            "kind": "catalog",
            "inventory": json.loads(inventory.read_text()) if inventory.exists() else [],
        }
    elif "cl" in context:
        page = list_descriptor(context, request, site)
    elif "deleted_objects" in context or "deletable_objects" in context:
        page = {
            "kind": "delete",
            "objects_html": text(
                unordered_list(context.get("deleted_objects", context.get("deletable_objects", [])))
            ),
            "blocked": bool(context.get("perms_lacking") or context.get("protected")),
            "protected": [text(o) for o in context.get("protected", [])],
            "selected": request.POST.getlist("_selected_action"),
            "action": request.POST.get("action", ""),
            "select_across": request.POST.get("select_across", "0"),
            "cancel_url": "../",
        }
    elif "action_list" in context:
        page = {
            "kind": "history",
            "rows": [
                {
                    "date": row.action_time.isoformat(),
                    "user": text(row.user),
                    "message": row.get_change_message(),
                }
                for row in context["action_list"]
            ],
        }
    elif template_name.endswith("login.html"):
        page = {
            **form_descriptor(context, request, site),
            "kind": "login",
            "next": context.get("next", base["index_url"]),
        }
    elif "adminform" in context or "form" in context:
        page = form_descriptor(context, request, site)
    else:
        page = dashboard_descriptor(context, request, site)
    opts = context.get("opts")
    if opts:
        for key in ("add_url", "delete_url", "history_url", "cancel_url"):
            if page.get(key):
                page[key] = add_preserved_filters(
                    {"opts": opts, "preserved_filters": context.get("preserved_filters", "")},
                    page[key],
                )
    return {**base, "page": page}
