from datetime import date
from unittest.mock import patch

import pytest
from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.template import Context, Template
from django.test import Client, override_settings

from demo.workspace.models import Order, OrderLine, Product, Ticket
from django_shadcn.admin import ShadcnAdminSite
from django_shadcn.i18n import STRINGS

from .conftest import descriptor

pytestmark = pytest.mark.django_db


def test_default_site_and_registration(admin_client):
    assert isinstance(admin.site, ShadcnAdminSite)
    assert Product in admin.site._registry
    data = descriptor(admin_client, "/admin/")
    assert data["page"]["kind"] == "dashboard"
    assert any(
        model["label"] == "workspace.product"
        for group in data["navigation"]
        for model in group["models"]
    )


@pytest.mark.parametrize("model", ["product", "customer", "order", "article", "ticket"])
def test_generated_lists_and_add_forms(admin_client, model):
    assert descriptor(admin_client, f"/admin/workspace/{model}/")["page"]["kind"] == "list"
    data = descriptor(admin_client, f"/admin/workspace/{model}/add/")
    assert data["page"]["kind"] == "form"


@pytest.mark.parametrize(
    "url",
    [
        "/admin/auth/user/",
        "/admin/auth/user/add/",
        "/admin/auth/group/add/",
        "/admin/password_change/",
    ],
)
def test_auth_admin(admin_client, url):
    assert descriptor(admin_client, url)["page"]["kind"] in {"list", "form"}


def test_crud_validation_and_hooks(admin_client):
    url = "/admin/workspace/product/add/"
    bad = admin_client.post(
        url,
        {"name": "Invalid", "sku": "BAD", "price": "-1", "stock": "2", "_save": "1"},
        HTTP_ACCEPT="application/vnd.django-shadcn+json",
    )
    assert bad.json()["page"]["has_errors"]
    assert not Product.objects.filter(sku="BAD").exists()
    model_admin = admin.site._registry[Product]
    with patch.object(model_admin, "save_model", wraps=model_admin.save_model) as save:
        response = admin_client.post(
            url,
            {
                "name": "Created",
                "sku": "CREATED",
                "price": "15.20",
                "stock": "5",
                "active": "on",
                "_save": "1",
            },
        )
        assert response.status_code == 302
        save.assert_called_once()
    item = Product.objects.get(sku="CREATED")
    assert LogEntry.objects.filter(object_id=str(item.pk)).exists()
    response = admin_client.post(
        f"/admin/workspace/product/{item.pk}/change/",
        {"name": "Changed", "sku": "CREATED", "price": "20.00", "stock": "7", "_save": "1"},
    )
    assert response.status_code == 302
    item.refresh_from_db()
    assert item.name == "Changed"
    assert descriptor(admin_client, f"/admin/workspace/product/{item.pk}/history/")["page"]["rows"]
    assert not descriptor(admin_client, f"/admin/workspace/product/{item.pk}/delete/")["page"][
        "blocked"
    ]
    assert (
        admin_client.post(
            f"/admin/workspace/product/{item.pk}/delete/", {"post": "yes"}
        ).status_code
        == 302
    )
    assert not Product.objects.filter(pk=item.pk).exists()


def test_search_filter_sort_and_pagination(admin_client, product):
    for i in range(12):
        Product.objects.create(name=f"Extra {i}", sku=f"EX-{i}", price=1, stock=i, active=False)
    assert descriptor(admin_client, "/admin/workspace/product/?q=Notebook")["page"]["count"] == 1
    assert (
        descriptor(admin_client, "/admin/workspace/product/?active__exact=0")["page"]["count"] == 12
    )
    data = descriptor(admin_client, "/admin/workspace/product/?o=1")
    assert len(data["page"]["rows"]) == 10
    assert len(data["page"]["pages"]) == 2


def test_list_editable(admin_client, product):
    response = admin_client.post(
        "/admin/workspace/product/",
        {
            "form-TOTAL_FORMS": "1",
            "form-INITIAL_FORMS": "1",
            "form-MIN_NUM_FORMS": "0",
            "form-MAX_NUM_FORMS": "1000",
            "form-0-id": product.pk,
            "form-0-price": "30.50",
            "form-0-stock": "50",
            "form-0-active": "on",
            "_save": "1",
        },
    )
    assert response.status_code == 302
    product.refresh_from_db()
    assert str(product.price) == "30.50"


def test_preserved_filters_on_add_and_cancel(admin_client, product):
    from urllib.parse import parse_qs, urlsplit

    page = descriptor(admin_client, "/admin/workspace/product/?q=Notebook")["page"]
    assert parse_qs(urlsplit(page["add_url"]).query)["_changelist_filters"] == ["q=Notebook"]
    add = descriptor(admin_client, page["add_url"])["page"]
    assert parse_qs(urlsplit(add["cancel_url"]).query)["q"] == ["Notebook"]


def test_inline_add_and_delete(admin_client, product, customer):
    data = descriptor(admin_client, "/admin/workspace/order/add/")
    assert data["page"]["inlines"][0]["prefix"] == "orderline_set"
    assert data["page"]["inlines"][0]["rows"] == []
    payload = {
        "customer": customer.pk,
        "status": "new",
        "placed": "2026-10-09",
        "_save": "1",
        "orderline_set-TOTAL_FORMS": "1",
        "orderline_set-INITIAL_FORMS": "0",
        "orderline_set-MIN_NUM_FORMS": "0",
        "orderline_set-MAX_NUM_FORMS": "1000",
        "orderline_set-0-product": product.pk,
        "orderline_set-0-quantity": "2",
        "orderline_set-0-unit_price": "24.50",
    }
    assert admin_client.post("/admin/workspace/order/add/", payload).status_code == 302
    order = Order.objects.get()
    line = order.orderline_set.get()
    changed = descriptor(admin_client, f"/admin/workspace/order/{order.pk}/change/")
    assert changed["page"]["inlines"][0]["rows"]
    payload.update(
        {
            "orderline_set-INITIAL_FORMS": "1",
            "orderline_set-0-id": line.pk,
            "orderline_set-0-DELETE": "on",
        }
    )
    assert (
        admin_client.post(f"/admin/workspace/order/{order.pk}/change/", payload).status_code == 302
    )
    assert not order.orderline_set.exists()


def test_actions_and_protected_deletion(admin_client, product, customer):
    order = Order.objects.create(customer=customer, placed=date(2026, 10, 9))
    OrderLine.objects.create(order=order, product=product, quantity=1, unit_price=10)
    assert (
        admin_client.post(
            "/admin/workspace/order/",
            {"action": "mark_shipped", "_selected_action": order.pk, "index": "0"},
        ).status_code
        == 302
    )
    order.refresh_from_db()
    assert order.status == "shipped"
    assert descriptor(admin_client, f"/admin/workspace/customer/{customer.pk}/delete/")["page"][
        "blocked"
    ]


def test_permissions_no_metadata_leak(client, product):
    user = get_user_model().objects.create_user("viewer", password="test", is_staff=True)
    client.force_login(user)
    assert descriptor(client, "/admin/")["navigation"] == []
    assert (
        client.get(
            "/admin/workspace/product/", HTTP_ACCEPT="application/vnd.django-shadcn+json"
        ).status_code
        == 403
    )
    user.user_permissions.add(Permission.objects.get(codename="view_product"))
    data = descriptor(client, "/admin/workspace/product/")
    assert data["page"]["add_url"] is None
    change = descriptor(client, f"/admin/workspace/product/{product.pk}/change/")
    assert not change["page"]["buttons"]["show_save"]
    assert (
        client.post(
            f"/admin/workspace/product/{product.pk}/change/", {"name": "Attack"}
        ).status_code
        == 403
    )


def test_csrf_and_session_expiry(admin_user, client):
    strict = Client(enforce_csrf_checks=True)
    strict.force_login(admin_user)
    assert strict.post("/admin/workspace/product/add/", {}).status_code == 403
    assert (
        client.get("/admin/", HTTP_ACCEPT="application/vnd.django-shadcn+json").status_code == 302
    )


@pytest.mark.parametrize("language,direction", [("en", "ltr"), ("fa", "rtl"), ("ar", "rtl")])
def test_locale(admin_client, language, direction):
    response = admin_client.post("/i18n/setlang/", {"language": language, "next": "/admin/"})
    assert response.status_code == 302
    data = descriptor(admin_client, "/admin/")
    assert data["language"] == language
    assert data["direction"] == direction
    assert data["strings"] == STRINGS[language]


def test_catalog_and_translation_completeness(admin_client):
    data = descriptor(admin_client, "/admin/components/")
    assert len(data["page"]["inventory"]) == 64
    assert all(set(values) == set(STRINGS["en"]) for values in STRINGS.values())


def test_custom_widget_adapter(admin_user):
    from django import forms
    from django.test import RequestFactory

    from django_shadcn.descriptors import field_descriptor

    class CustomInput(forms.TextInput):
        pass

    form = forms.Form()
    form.fields["name"] = forms.CharField(widget=CustomInput)
    request = RequestFactory().get("/")
    site = ShadcnAdminSite("custom")
    assert field_descriptor(form["name"], request, site)["widget"] == "native"
    site.register_widget(
        CustomInput, lambda field, request: {"widget": "custom", "name": field.html_name}
    )
    assert field_descriptor(form["name"], request, site)["widget"] == "custom"


def test_native_widget_does_not_expose_masked_initial_values():
    from django import forms
    from django.test import RequestFactory

    from django_shadcn.descriptors import field_descriptor

    class MaskedWidget(forms.PasswordInput):
        pass

    form = forms.Form(initial={"secret": "server-only-secret"})
    form.fields["secret"] = forms.CharField(widget=MaskedWidget)
    data = field_descriptor(form["secret"], RequestFactory().get("/"), ShadcnAdminSite())
    assert data["value"] is None
    assert "server-only-secret" not in data["html"]


def test_custom_template_retains_native_response(admin_client, tmp_path):
    from django.conf import settings

    (tmp_path / "custom.html").write_text("Native widget integration {{ title }}")
    templates = [{**settings.TEMPLATES[0], "DIRS": [str(tmp_path)]}]
    with (
        override_settings(TEMPLATES=templates),
        patch.object(admin.site._registry[Product], "change_list_template", "custom.html"),
    ):
        response = admin_client.get(
            "/admin/workspace/product/", HTTP_ACCEPT="application/vnd.django-shadcn+json"
        )
    assert response.status_code == 200
    assert b"Native widget integration" in response.content


def test_mount_safely_serializes_payload():
    result = Template('{% load shadcn %}{% shadcn_mount "Card" props %}').render(
        Context({"props": {"children": '</script><script>alert("x")</script>'}})
    )
    assert "\\u003C/script\\u003E" in result
    assert result.count("<script") == 1


def test_file_upload_and_existing_file_descriptor(admin_client, customer, tmp_path):
    with override_settings(MEDIA_ROOT=tmp_path):
        response = admin_client.post(
            "/admin/workspace/ticket/add/",
            {
                "subject": "Attachment",
                "customer": customer.pk,
                "priority": "normal",
                "attachment": SimpleUploadedFile("readme.txt", b"hello"),
                "reply_set-TOTAL_FORMS": "0",
                "reply_set-INITIAL_FORMS": "0",
                "reply_set-MIN_NUM_FORMS": "0",
                "reply_set-MAX_NUM_FORMS": "1000",
                "_save": "1",
            },
        )
        assert response.status_code == 302
        ticket = Ticket.objects.get(subject="Attachment")
        assert ticket.attachment.read() == b"hello"
        assert (
            descriptor(admin_client, f"/admin/workspace/ticket/{ticket.pk}/change/")["page"]["kind"]
            == "form"
        )
