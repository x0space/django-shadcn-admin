"""Describe standard form data without exposing values masked by custom widgets."""
import json

from django import forms
from django.core.exceptions import ValidationError
from django.utils.html import conditional_escape
from django.utils.translation import gettext as _


def enhance_field(bound, actual, descriptor, builtin):
    if not builtin or descriptor["widget"] == "hidden":
        return descriptor
    field = bound.field
    if isinstance(field, forms.JSONField):
        raw = bound.value()
        if isinstance(raw, str):
            try:
                value = json.loads(raw)
            except (ValueError, TypeError):
                value = None
        else:
            value = raw
            raw = json.dumps(raw, ensure_ascii=False)
        descriptor.update(widget="json", value=value, raw=raw if raw is not None else "null", layout="full")
    elif type(field).__name__ == "SimpleArrayField" and type(field).__module__.startswith("django.contrib.postgres.forms"):
        raw = bound.value()
        delimiter = field.delimiter
        values = raw.split(delimiter) if isinstance(raw, str) and raw else list(raw or [])
        descriptor.update(widget="array", value=values, delimiter=delimiter, layout="full",
                          item_type="number" if isinstance(field.base_field, (forms.IntegerField, forms.FloatField, forms.DecimalField)) else "string")
    elif isinstance(field, forms.SplitDateTimeField):
        parts = actual.get_context(bound.html_name, bound.value(), {"id": descriptor["id"]})["widget"]["subwidgets"]
        children = []
        for index, part in enumerate(parts):
            value = part.get("value", "")
            try:
                cleaned = field.fields[index].to_python(value)
                value = cleaned.isoformat() if cleaned else ""
            except ValidationError:
                pass
            children.append({**descriptor, "widget": "date" if index == 0 else "time",
                             "name": part["name"], "id": part["attrs"].get("id", f"{descriptor['id']}_{index}"),
                             "value": value, "label": _("Date") if index == 0 else _("Time"), "html": ""})
        descriptor.update(widget="datetime", parts=children, value=None)
    elif isinstance(field, forms.DateTimeField):
        value = bound.value()
        descriptor.update(widget="datetime-local", value=value.isoformat()[:19] if hasattr(value, "isoformat") else str(value or "").replace(" ", "T"))
    elif isinstance(field, forms.FileField):
        value = bound.value()
        descriptor.update(widget="file", value="", image=isinstance(field, forms.ImageField),
                          accept="image/*" if isinstance(field, forms.ImageField) else actual.attrs.get("accept", ""))
        if value and hasattr(value, "url"):
            descriptor["file"] = {"url": value.url, "name": str(value.name).replace("\\", "/").rsplit("/", 1)[-1]}
        descriptor["can_clear"] = not field.required and not field.disabled
    elif isinstance(field, (forms.UUIDField, forms.GenericIPAddressField, forms.DurationField)):
        descriptor["direction"] = "ltr"
    input_type = getattr(actual, "input_type", "")
    if input_type in {"color", "range", "tel", "search"}:
        descriptor["widget"] = input_type
    if isinstance(actual, forms.SelectMultiple):
        descriptor.update(multiple=True, layout="full")
        legacy = _('Hold down “Control”, or “Command” on a Mac, to select more than one.')
        legacy_ascii = _('Hold down "Control", or "Command" on a Mac, to select more than one.')
        for hint in (legacy, legacy_ascii):
            descriptor["help"] = descriptor["help"].replace(str(conditional_escape(hint)), "").replace(hint, "").strip()
    return descriptor
