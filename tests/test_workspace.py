from datetime import date

import pytest
from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.forms import PasswordInput, TextInput
from django.test import Client

from demo.workspace.models import Customer, Order, OrderLine, Product, Ticket
from tests.conftest import descriptor

pytestmark = pytest.mark.django_db


@pytest.fixture
def orders(customer):
    return [
        Order.objects.create(customer=customer, status=status, placed=date(2026, 10, 9))
        for status in ["new", "processing"]
    ]


def preview(client, orders, query="", **extra):
    return client.post(
        "/admin/workspace/order/workspace/preview/" + query,
        {
            "action": "mark_shipped",
            "_selected_action": [str(o.pk) for o in orders],
            "select_across": "0",
            **extra,
        },
    )


def apply(client, orders, token, query="", **extra):
    return client.post(
        "/admin/workspace/order/" + query,
        {
            "action": "mark_shipped",
            "_selected_action": [str(o.pk) for o in orders],
            "select_across": "0",
            "index": "0",
            "_shadcn_review": token,
            **extra,
        },
    )


def test_workspace_descriptor_and_dashboard_links(admin_client, orders):
    page = descriptor(admin_client, "/admin/workspace/order/")["page"]
    assert page["workspace"]["group_field"] == "status"
    assert page["workspace"]["date_field"] == "placed"
    assert {r["key"] for r in page["workspace"]["records"]} == {str(o.pk) for o in orders}
    assert page["workspace"]["records"][0]["can_move"]
    assert all(r["date"] == "2026-10-09" for r in page["workspace"]["records"])
    dashboard = descriptor(admin_client, "/admin/")
    widget = next(
        w for w in dashboard["page"]["widgets"] if w["title"] == "Orders needing attention"
    )
    assert widget["value"] == 2
    assert descriptor(admin_client, widget["url"])["page"]["count"] == 2


def test_preview_is_read_only_and_confirm_executes(admin_client, orders):
    result = preview(admin_client, orders)
    assert result.status_code == 200
    review = result.json()
    assert review["count"] == 2
    assert review["exact_changes"]
    assert review["records"][0]["changes"] == [
        {"label": "Status", "before": "New", "after": "Shipped"}
    ]
    assert set(Order.objects.values_list("status", flat=True)) == {"new", "processing"}
    assert apply(admin_client, orders, review["token"]).status_code == 302
    assert set(Order.objects.values_list("status", flat=True)) == {"shipped"}


@pytest.mark.parametrize("change", ["state", "selection", "action", "signature", "filter"])
def test_review_rejects_changed_state_or_selection(admin_client, orders, change):
    token = preview(admin_client, orders).json()["token"]
    kwargs = {}
    selection = orders
    if change == "state":
        Order.objects.filter(pk=orders[0].pk).update(notes="Changed since preview")
    elif change == "selection":
        selection = orders[:1]
    elif change == "action":
        kwargs["action"] = "delete_selected"
    elif change == "signature":
        token += "invalid"
    elif change == "filter":
        kwargs["query"] = "?status__exact=new"
    response = apply(admin_client, selection, token, **kwargs)
    assert response.status_code == 302
    assert Order.objects.count() == 2
    assert set(Order.objects.values_list("status", flat=True)) == {"new", "processing"}


def test_across_preview_uses_filtered_queryset(admin_client, orders):
    result = preview(admin_client, orders, query="?status__exact=new", select_across="1").json()
    assert result["count"] == 1
    assert result["records"][0]["key"] == str(orders[0].pk)
    assert (
        apply(
            admin_client, orders, result["token"], query="?status__exact=new", select_across="1"
        ).status_code
        == 302
    )
    orders[0].refresh_from_db()
    orders[1].refresh_from_db()
    assert orders[0].status == "shipped"
    assert orders[1].status == "processing"


def test_across_review_rejects_new_matching_records(admin_client, orders, customer):
    result = preview(admin_client, orders, select_across="1").json()
    Order.objects.create(customer=customer, placed=date(2026, 10, 9))
    apply(admin_client, orders, result["token"], select_across="1")
    assert "shipped" not in Order.objects.values_list("status", flat=True)


def test_generic_action_preview_handles_file_fields(admin_client, product):
    response = admin_client.post(
        "/admin/workspace/product/workspace/preview/",
        {
            "action": "delete_selected",
            "_selected_action": [product.pk],
        },
    )
    assert response.status_code == 200
    assert not response.json()["exact_changes"]
    assert Product.objects.filter(pk=product.pk).exists()


def test_move_validates_logs_and_detects_conflicts(admin_client, orders):
    obj = orders[0]
    url = "/admin/workspace/order/workspace/move/"
    body = {"pk": obj.pk, "expected": "new", "value": "processing"}
    assert admin_client.post(url, {**body, "value": "invalid"}).status_code == 400
    obj.refresh_from_db()
    assert obj.status == "new"
    assert admin_client.post(url, body).status_code == 200
    obj.refresh_from_db()
    assert obj.status == "processing"
    assert LogEntry.objects.filter(
        object_id=str(obj.pk), change_message__contains="Status"
    ).exists()
    assert admin_client.post(url, {**body, "value": "shipped"}).status_code == 409
    obj.refresh_from_db()
    assert obj.status == "processing"


def test_move_calls_admin_save_hooks(admin_client, orders, monkeypatch):
    model_admin = admin.site._registry[Order]
    original = model_admin.save_model
    called = []

    def save(request, obj, form, change):
        called.append(form.changed_data)
        return original(request, obj, form, change)

    monkeypatch.setattr(model_admin, "save_model", save)
    assert (
        admin_client.post(
            "/admin/workspace/order/workspace/move/",
            {
                "pk": orders[0].pk,
                "expected": "new",
                "value": "shipped",
            },
        ).status_code
        == 200
    )
    assert called == [["status"]]


def test_relationships_and_recursive_links(admin_client, orders, product, customer):
    line = OrderLine.objects.create(order=orders[0], product=product, quantity=1, unit_price=10)
    Ticket.objects.create(customer=customer, subject="Question", priority="normal")
    form = descriptor(admin_client, f"/admin/workspace/customer/{customer.pk}/change/")["page"]
    result = admin_client.get(form["relations_url"], {"pk": customer.pk}).json()
    assert [g["name"] for g in result["groups"]] == ["order", "ticket"]
    assert len(result["groups"][0]["records"]) == 2
    node = next(r for r in result["groups"][0]["records"] if r["key"] == str(orders[0].pk))
    related = admin_client.get(node["explore_url"], {"pk": node["key"]}).json()
    assert next(g for g in related["groups"] if g["name"] == "orderline")["records"][0][
        "key"
    ] == str(line.pk)


def test_relationships_honor_related_queryset_and_permissions(
    admin_client, orders, customer, monkeypatch
):
    model_admin = admin.site._registry[Order]
    monkeypatch.setattr(
        model_admin, "get_queryset", lambda request: Order.objects.filter(pk=orders[0].pk)
    )
    response = admin_client.get(
        "/admin/workspace/customer/workspace/relations/", {"pk": customer.pk}
    ).json()
    assert len(response["groups"][0]["records"]) == 1
    monkeypatch.setattr(
        model_admin, "has_view_or_change_permission", lambda request, obj=None: False
    )
    response = admin_client.get(
        "/admin/workspace/customer/workspace/relations/", {"pk": customer.pk}
    ).json()
    assert "order" not in [group["name"] for group in response["groups"]]


def test_compare_highlights_visible_fields_and_excludes_hidden_fields(
    admin_client, product, monkeypatch
):
    other = Product.objects.create(name="Pen", sku="PEN", price=5, stock=2)
    model_admin = admin.site._registry[Product]
    monkeypatch.setattr(model_admin, "exclude", ["description"])
    result = admin_client.get(
        "/admin/workspace/product/workspace/compare/", {"pk": [product.pk, other.pk]}
    ).json()
    fields = result["records"][0]["fields"]
    assert "description" not in [f["name"] for f in fields]
    assert next(f for f in fields if f["name"] == "name")["value"] == "Notebook"
    assert (
        admin_client.get(
            "/admin/workspace/product/workspace/compare/", {"pk": [product.pk]}
        ).status_code
        == 400
    )


def test_compare_does_not_expose_password_widgets(admin_client, product, monkeypatch):
    other = Product.objects.create(name="Pen", sku="PEN", price=5, stock=2)
    model_admin = admin.site._registry[Product]
    original = model_admin.get_form

    def get_form(*args, **kwargs):
        form = original(*args, **kwargs)
        form.base_fields["description"].widget = PasswordInput()
        return form

    monkeypatch.setattr(model_admin, "get_form", get_form)
    result = admin_client.get(
        "/admin/workspace/product/workspace/compare/", {"pk": [product.pk, other.pk]}
    ).json()
    assert "description" not in [f["name"] for f in result["records"][0]["fields"]]


def test_tools_require_permissions_and_object_scope(client, orders, monkeypatch):
    user = get_user_model().objects.create_user("reader", is_staff=True)
    client.force_login(user)
    url = "/admin/workspace/order/workspace/compare/"
    assert client.get(url, {"pk": [o.pk for o in orders]}).status_code == 403
    user.user_permissions.add(Permission.objects.get(codename="view_order"))
    assert client.get(url, {"pk": [o.pk for o in orders]}).status_code == 200
    assert preview(client, orders).status_code == 403
    assert (
        client.post(
            "/admin/workspace/order/workspace/move/",
            {"pk": orders[0].pk, "value": "shipped", "expected": "new"},
        ).status_code
        == 403
    )
    model_admin = admin.site._registry[Order]
    monkeypatch.setattr(
        model_admin, "get_queryset", lambda request: Order.objects.filter(pk=orders[0].pk)
    )
    assert client.get(url, {"pk": [o.pk for o in orders]}).status_code == 403


def test_workspace_posts_require_csrf(admin_user, orders):
    client = Client(enforce_csrf_checks=True)
    client.force_login(admin_user)
    assert preview(client, orders).status_code == 403
    assert (
        client.post(
            "/admin/workspace/order/workspace/move/",
            {"pk": orders[0].pk, "value": "shipped", "expected": "new"},
        ).status_code
        == 403
    )


def test_compare_respects_masked_custom_widgets(admin_client, product, monkeypatch):
    class MaskedInput(TextInput):
        pass

    other = Product.objects.create(name="Pen", sku="PEN", price=5, stock=2)
    model_admin = admin.site._registry[Product]
    original = model_admin.get_form

    def get_form(*args, **kwargs):
        form = original(*args, **kwargs)
        form.base_fields["description"].widget = MaskedInput()
        return form

    monkeypatch.setattr(model_admin, "get_form", get_form)
    result = admin_client.get(
        "/admin/workspace/product/workspace/compare/", {"pk": [product.pk, other.pk]}
    ).json()
    assert "description" not in [field["name"] for field in result["records"][0]["fields"]]


def test_compare_scopes_related_field_labels(admin_client, orders, monkeypatch):
    url = "/admin/workspace/order/workspace/compare/"
    payload = {"pk": [obj.pk for obj in orders]}
    result = admin_client.get(url, payload).json()
    assert (
        next(field for field in result["records"][0]["fields"] if field["name"] == "customer")[
            "value"
        ]
        == "سینا"
    )
    monkeypatch.setattr(
        admin.site._registry[Customer], "get_queryset", lambda request: Customer.objects.none()
    )
    result = admin_client.get(url, payload).json()
    assert (
        next(field for field in result["records"][0]["fields"] if field["name"] == "customer")[
            "value"
        ]
        == "Restricted"
    )


def test_readonly_dates_can_be_used_for_calendar(admin_client, customer):
    from django.utils import timezone

    ticket = Ticket.objects.create(customer=customer, subject="Question", priority="normal")
    data = descriptor(admin_client, "/admin/workspace/ticket/")["page"]["workspace"]
    assert data["date_field"] == "created"
    assert data["records"][0]["date"] == timezone.localtime(ticket.created).date().isoformat()


def test_calendar_accepts_django_split_datetime_fields(admin_client, customer, monkeypatch):
    Ticket.objects.create(customer=customer, subject="Split date", priority="normal")
    monkeypatch.setattr(Ticket._meta.get_field("created"), "editable", True)
    monkeypatch.setattr(admin.site._registry[Ticket], "readonly_fields", [])
    data = descriptor(admin_client, "/admin/workspace/ticket/")["page"]["workspace"]
    assert data["date_field"] == "created"
    assert data["records"][0]["date"]


def test_preview_honors_view_only_action_permissions(client, orders, monkeypatch):
    model_admin = admin.site._registry[Order]

    @admin.action(permissions=["view"], description="Export visible orders")
    def export_orders(modeladmin, request, queryset):
        pass

    monkeypatch.setattr(model_admin, "actions", [export_orders])
    user = get_user_model().objects.create_user("exporter", is_staff=True)
    user.user_permissions.add(Permission.objects.get(codename="view_order"))
    client.force_login(user)
    response = preview(client, orders, action="export_orders")
    assert response.status_code == 200
    assert response.json()["count"] == 2


def test_review_expiry_is_enforced(admin_client, orders, monkeypatch):
    import time

    token = preview(admin_client, orders).json()["token"]
    now = time.time()
    monkeypatch.setattr(time, "time", lambda: now + 301)
    apply(admin_client, orders, token)
    assert "shipped" not in Order.objects.values_list("status", flat=True)


def test_invalid_and_readonly_configuration_is_not_exposed(admin_client, orders, monkeypatch):
    model_admin = admin.site._registry[Order]
    monkeypatch.setattr(model_admin, "readonly_fields", ["status"])
    page = descriptor(admin_client, "/admin/workspace/order/")["page"]
    assert page["workspace"]["group_field"] is None
    assert (
        admin_client.post(
            "/admin/workspace/order/workspace/move/",
            {"pk": orders[0].pk, "value": "shipped", "expected": "new"},
        ).status_code
        == 403
    )
