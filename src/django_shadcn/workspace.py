"""Permission-scoped workspace tools for opt-in ShadcnModelAdmin registrations."""

import hashlib
import json

from django.contrib.admin.utils import construct_change_message, quote
from django.core import signing
from django.core.exceptions import FieldDoesNotExist, PermissionDenied, ValidationError
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.http import JsonResponse
from django.urls import reverse
from django.utils.encoding import force_str
from django.utils.translation import gettext as _

LIMIT = 1000


def tool_url(admin, tool):
    return reverse(
        f"{admin.admin_site.name}:{admin.opts.app_label}_{admin.opts.model_name}_workspace",
        args=[tool],
    )


def record_url(admin, obj):
    return reverse(
        f"{admin.admin_site.name}:{admin.opts.app_label}_{admin.opts.model_name}_change",
        args=[quote(obj.pk)],
    )


def get_object(admin, request, pk):
    obj = admin.get_queryset(request).filter(pk=pk).first()
    if obj is None or not admin.has_view_or_change_permission(request, obj):
        raise PermissionDenied
    return obj


def visible_fields(admin, request, obj):
    """Honor dynamic fieldsets, exclusions, readonly fields, and custom forms."""
    from django.contrib.admin.utils import flatten_fieldsets

    names = flatten_fieldsets(admin.get_fieldsets(request, obj))
    form = admin.get_form(request, obj)(instance=obj)
    readonly = admin.get_readonly_fields(request, obj)
    values = []
    for name in names:
        if name not in form.fields and name not in readonly:
            continue
        try:
            field = admin.model._meta.get_field(name)
        except FieldDoesNotExist:
            continue  # Do not invoke arbitrary readonly display functions.
        if not field.concrete or field.is_relation or field.many_to_many:
            continue
        if name in form.fields:
            widget = form.fields[name].widget
            from django.forms import HiddenInput, PasswordInput

            if isinstance(widget, (HiddenInput, PasswordInput)):
                continue
        value = getattr(obj, name)
        display = getattr(obj, f"get_{name}_display")() if field.choices else value
        values.append({"name": name, "label": force_str(field.verbose_name),
                       "value": force_str(display) if display is not None else ""})
    return values


def workspace_descriptor(admin, request, objects):
    options = getattr(admin, "shadcn_workspace", {})
    if not hasattr(admin, "shadcn_relations"):
        return None
    group_name, date_name = options.get("group_field"), options.get("date_field")
    fields = admin.get_form(request).base_fields
    group = fields.get(group_name)
    date = fields.get(date_name)
    from django import forms

    if not isinstance(group, forms.ChoiceField) or isinstance(group, forms.ModelChoiceField):
        group_name, group = None, None
    if not isinstance(date, (forms.DateField, forms.DateTimeField)):
        date_name = None
    choices = []
    if group:
        for value, label in group.choices:
            if isinstance(label, (list, tuple)):
                choices.extend({"value": force_str(v), "label": force_str(l)} for v, l in label)
            else:
                choices.append({"value": force_str(value), "label": force_str(label)})
    records = []
    for obj in objects:
        if not admin.has_view_or_change_permission(request, obj):
            continue
        # Object-specific forms may hide a configured field.
        object_fields = admin.get_form(request, obj).base_fields
        when = getattr(obj, date_name, None) if date_name in object_fields else None
        records.append({
            "key": force_str(obj.pk), "label": force_str(obj), "url": record_url(admin, obj),
            "group": force_str(getattr(obj, group_name, "")) if group_name in object_fields else "",
            "date": when.isoformat()[:10] if when else None,
            "can_move": bool(group_name in object_fields and admin.has_change_permission(request, obj)
                             and group_name not in admin.get_readonly_fields(request, obj)),
        })
    return {"group_field": group_name, "date_field": date_name, "groups": choices,
            "records": records, "compare_url": tool_url(admin, "compare"),
            "preview_url": tool_url(admin, "preview"), "move_url": tool_url(admin, "move")}


def relations(admin, request, obj):
    groups = []
    for name in admin.shadcn_relations:
        try:
            field = admin.model._meta.get_field(name)
        except FieldDoesNotExist:
            continue
        related_admin = admin.admin_site._registry.get(field.related_model)
        if related_admin is None or not related_admin.has_view_or_change_permission(request):
            continue
        if field.auto_created:
            lookup = field.field.name
            qs = related_admin.get_queryset(request).filter(**{lookup: obj})
        elif field.many_to_many:
            qs = related_admin.get_queryset(request).filter(pk__in=getattr(obj, name).values("pk"))
        elif field.is_relation:
            qs = related_admin.get_queryset(request).filter(pk=getattr(obj, field.attname))
        else:
            continue
        nodes = []
        for related in qs[:51]:
            if related_admin.has_view_or_change_permission(request, related):
                nodes.append({"key": force_str(related.pk), "label": force_str(related),
                              "url": record_url(related_admin, related),
                              "explore_url": tool_url(related_admin, "relations")
                              if hasattr(related_admin, "shadcn_relations") else None})
        groups.append({"name": name, "label": force_str(field.related_model._meta.verbose_name_plural),
                       "records": nodes[:50], "truncated": len(nodes) > 50})
    return {"record": {"key": force_str(obj.pk), "label": force_str(obj),
                       "url": record_url(admin, obj)}, "groups": groups}


def action_preview(admin, request):
    action = request.POST.get("action", "")
    actions = admin.get_actions(request)
    if action not in actions:
        raise PermissionDenied
    qs = admin.get_changelist_instance(request).queryset
    selected = request.POST.getlist("_selected_action")
    if not selected:
        raise ValidationError(_("Select at least one record."))
    if request.POST.get("select_across") != "1":
        qs = qs.filter(pk__in=selected)
    objects = list(qs.order_by("pk")[:LIMIT + 1])
    if not objects or len(objects) > LIMIT:
        raise ValidationError(_("Review up to 1,000 records at a time. Narrow your filters."))
    permission = admin.has_delete_permission if action == "delete_selected" else admin.has_change_permission
    for obj in objects:
        if not admin.has_view_or_change_permission(request, obj) or not permission(request, obj):
            raise PermissionDenied
    changes = admin.shadcn_action_previews.get(action, {})
    rows, state = [], []
    for obj in objects:
        fields = admin.get_form(request, obj).base_fields
        public = {field["name"] for field in visible_fields(admin, request, obj)}
        differences = []
        for name, value in changes.items():
            if name not in fields or name not in public or name in admin.get_readonly_fields(request, obj):
                raise ValidationError(_("The action preview includes an unavailable field."))
            model_field = admin.model._meta.get_field(name)
            if model_field.is_relation:
                raise ValidationError(_("Action previews require ordinary model fields."))
            before = getattr(obj, name)
            labels = dict(model_field.flatchoices)
            differences.append({"label": force_str(model_field.verbose_name),
                                "before": force_str(labels.get(before, before)),
                                "after": force_str(labels.get(value, value))})
        rows.append({"key": force_str(obj.pk), "label": force_str(obj), "changes": differences})
        # Hash all model state; sensitive values never leave the server.
        state.append([force_str(obj.pk), [f.value_from_object(obj) for f in obj._meta.concrete_fields]])
    digest = hashlib.sha256(json.dumps([state, rows], cls=DjangoJSONEncoder, sort_keys=True).encode()).hexdigest()
    binding = {"user": force_str(request.user.pk), "site": admin.admin_site.name,
               "model": admin.opts.label_lower, "action": action,
               "query": request.GET.urlencode(), "digest": digest}
    return {"action": action, "label": force_str(actions[action][2]), "count": len(rows),
            "records": rows, "exact_changes": bool(changes),
            "token": signing.dumps(binding, salt="shadcn-action-review")}, binding


def validate_action_review(admin, request):
    try:
        binding = signing.loads(request.POST["_shadcn_review"], salt="shadcn-action-review", max_age=300)
        _, current = action_preview(admin, request)
        if binding == current:
            return None
    except (signing.BadSignature, ValidationError, PermissionDenied, ValueError):
        pass
    return _("The selection changed or the review expired. Review the action again.")


def move(admin, request):
    name = admin.shadcn_workspace.get("group_field")
    if not name:
        raise PermissionDenied
    with transaction.atomic():
        obj = admin.get_queryset(request).select_for_update().filter(pk=request.POST.get("pk")).first()
        if obj is None or not admin.has_change_permission(request, obj) or not admin.has_view_or_change_permission(request, obj):
            raise PermissionDenied
        if name in admin.get_readonly_fields(request, obj):
            raise PermissionDenied
        full_form = admin.get_form(request, obj)
        from django import forms

        if name not in full_form.base_fields or not isinstance(full_form.base_fields[name], forms.ChoiceField):
            raise PermissionDenied
        if force_str(getattr(obj, name)) != request.POST.get("expected"):
            return JsonResponse({"error": _("This record changed. Refresh before moving it.")}, status=409)
        form_class = admin.get_form(request, obj, fields=[name])
        form = form_class({name: request.POST.get("value", "")}, instance=obj)
        if not form.is_valid():
            return JsonResponse({"error": force_str(form.errors.as_text())}, status=400)
        saved = admin.save_form(request, form, change=True)
        admin.save_model(request, saved, form, change=True)
        admin.save_related(request, form, [], change=True)
        admin.log_change(request, saved, construct_change_message(form, [], False))
    return JsonResponse({"ok": True})


def workspace_view(admin, request, tool):
    if not admin.has_view_or_change_permission(request):
        raise PermissionDenied
    try:
        if tool == "relations" and request.method == "GET":
            return JsonResponse(relations(admin, request, get_object(admin, request, request.GET.get("pk"))))
        if tool == "compare" and request.method == "GET":
            keys = list(dict.fromkeys(request.GET.getlist("pk")))
            if len(keys) != 2:
                raise ValidationError(_("Select exactly two records to compare."))
            objects = [get_object(admin, request, key) for key in keys]
            values = [visible_fields(admin, request, obj) for obj in objects]
            common = {f["name"] for f in values[0]} & {f["name"] for f in values[1]}
            return JsonResponse({"records": [{"key": force_str(obj.pk), "label": force_str(obj),
                                              "fields": [f for f in fields if f["name"] in common]}
                                             for obj, fields in zip(objects, values, strict=True)]})
        if tool == "preview" and request.method == "POST":
            preview, _ = action_preview(admin, request)
            return JsonResponse(preview)
        if tool == "move" and request.method == "POST":
            return move(admin, request)
    except (ValidationError, ValueError, TypeError) as error:
        return JsonResponse({"error": force_str(error)}, status=400)
    return JsonResponse({"error": _("Unsupported workspace operation.")}, status=405)
