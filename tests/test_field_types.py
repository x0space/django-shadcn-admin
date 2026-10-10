import json
from datetime import datetime

import pytest
from django import forms
from django.conf import settings
from django.contrib import admin
from django.contrib.admin.widgets import AdminSplitDateTime
from django.test import RequestFactory, override_settings
from django.utils import translation

from demo.workspace.models import Category, FieldSample
from django_shadcn.descriptors import field_descriptor

from .conftest import descriptor

pytestmark = pytest.mark.django_db


def fields(data):
    return {f["name"]: f for g in data["page"]["fieldsets"] for line in g["lines"] for f in line}


def test_mixed_form_has_typed_editors_and_no_legacy_multiselect_help(admin_client):
    data = descriptor(admin_client, "/admin/workspace/fieldsample/add/")
    f = fields(data)
    assert f["images"]["widget"] == "json" and f["images"]["value"] == []
    assert f["metadata"]["widget"] == "json" and f["metadata"]["value"] == {}
    assert f["categories"]["multiple"] and f["categories"]["layout"] == "full"
    assert not f["categories"]["help"]
    assert f["published_at"]["widget"] == "datetime"
    assert [part["name"] for part in f["published_at"]["parts"]] == ["published_at_0", "published_at_1"]
    assert f["image"]["image"] and f["image"]["accept"] == "image/*"
    assert f["identifier"]["direction"] == "ltr"
    with translation.override("fa"):
        assert not fields(descriptor(admin_client, "/admin/workspace/fieldsample/add/"))["categories"]["help"]


@pytest.mark.parametrize("value", [[], {}, ["فارسی", "a"], {"a": [True, None, 2.5]}, "text", 42, False, None])
def test_json_descriptor_preserves_all_json_types(value):
    form = forms.Form(initial={"data": value})
    form.fields["data"] = forms.JSONField(required=False)
    field = field_descriptor(form["data"], RequestFactory().get("/"), admin.site)
    assert field["widget"] == "json"
    assert field["value"] == value
    assert json.loads(field["raw"]) == value


def test_invalid_json_is_preserved_and_custom_masking_is_respected():
    form = forms.Form(data={"data": "[invalid"})
    form.fields["data"] = forms.JSONField()
    field = field_descriptor(form["data"], RequestFactory().get("/"), admin.site)
    assert field["raw"] == "[invalid" and field["errors"]

    class Masked(forms.Textarea):
        def format_value(self, value):
            return "masked"

    form = forms.Form(initial={"data": {"secret": "do-not-expose"}})
    form.fields["data"] = forms.JSONField(widget=Masked)
    field = field_descriptor(form["data"], RequestFactory().get("/"), admin.site)
    assert field["widget"] == "native" and field["value"] is None
    assert "do-not-expose" not in str(field)


def test_split_datetime_and_invalid_parts():
    form = forms.Form(initial={"date": datetime(2026, 10, 10, 14, 30)})
    form.fields["date"] = forms.SplitDateTimeField(widget=AdminSplitDateTime)
    field = field_descriptor(form["date"], RequestFactory().get("/"), admin.site)
    assert [p["value"] for p in field["parts"]] == ["2026-10-10", "14:30:00"]
    form = forms.Form(data={"date_0": "bad", "date_1": "invalid"})
    form.fields["date"] = forms.SplitDateTimeField(widget=AdminSplitDateTime)
    field = field_descriptor(form["date"], RequestFactory().get("/"), admin.site)
    assert field["parts"][0]["value"] == "bad" and field["errors"]


@override_settings(MIDDLEWARE=[*settings.MIDDLEWARE, "django.middleware.clickjacking.XFrameOptionsMiddleware"])
def test_popup_forms_and_lookup_keep_shadcn_and_django_validation(admin_client):
    response = admin_client.get("/admin/workspace/category/add/?_popup=1&_to_field=id")
    assert b"django-shadcn-root" in response.content
    assert response["X-Frame-Options"] == "SAMEORIGIN"
    assert admin_client.get("/admin/workspace/category/add/")["X-Frame-Options"] == "DENY"
    response = admin_client.post("/admin/workspace/category/add/", {"_popup": "1", "_to_field": "id", "name": "<script> فارسی", "position": "0", "active": "on", "_save": "1"})
    assert response.status_code == 200
    assert b"django-shadcn-popup-result" in response.content
    assert b"\\u003Cscript\\u003E" in response.content
    category = Category.objects.get(name="<script> فارسی")
    data = descriptor(admin_client, "/admin/workspace/category/?_popup=1&_to_field=id")
    assert data["popup"]
    assert any(row["popup_value"] == str(category.pk) for row in data["page"]["rows"])
    response = admin_client.get("/admin/workspace/category/add/?_popup=1&_to_field=name")
    assert response.status_code == 400


def test_json_list_values_and_model_icons(admin_client):
    FieldSample.objects.create(name="Mixed", tags=["فارسی", "one"], metadata={"nested": [True, None]})
    data = descriptor(admin_client, "/admin/workspace/fieldsample/")
    cells = data["page"]["rows"][0]["cells"]
    assert any(c["display"] == {"kind": "json", "value": ["فارسی", "one"]} for c in cells)
    icons = {m["label"]: m["icon"] for a in data["navigation"] for m in a["models"]}
    assert icons["workspace.customer"] == "users"
    assert icons["workspace.category"] == "folder"
    assert icons["workspace.fieldsample"] == "settings"


def test_custom_popup_template_retains_native_response(admin_client, tmp_path):
    template_dir = tmp_path / "admin"
    template_dir.mkdir()
    (template_dir / "popup_response.html").write_text("Custom popup response", encoding="utf-8")
    templates = [{**settings.TEMPLATES[0], "DIRS": [str(tmp_path)]}]
    with override_settings(TEMPLATES=templates):
        response = admin_client.post(
            "/admin/workspace/category/add/",
            {"_popup": "1", "name": "Custom popup", "position": "0", "active": "on", "_save": "1"},
        )
    assert response.status_code == 200
    assert response.content == b"Custom popup response"
