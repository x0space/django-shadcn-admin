from django.db.models import F, Sum
from django.urls import reverse
from django.utils.translation import gettext as _

from .models import Customer, Order, Product, Ticket


def overview(request, site):
    widgets = []
    for model, title in [
        (Order, _("Orders")),
        (Customer, _("Customers")),
        (Product, _("Products")),
        (Ticket, _("Tickets")),
    ]:
        model_admin = site._registry[model]
        if model_admin.has_view_or_change_permission(request):
            qs = model_admin.get_queryset(request)
            widgets.append(
                {
                    "kind": "metric",
                    "title": title,
                    "value": qs.count(),
                    "description": _("Records in your workspace"),
                    "url": reverse(
                        f"{site.name}:{model._meta.app_label}_{model._meta.model_name}_changelist"
                    ),
                }
            )
            if model is Order:
                widgets.append(
                    {
                        "kind": "metric",
                        "title": _("Orders needing attention"),
                        "value": qs.exclude(status="shipped").count(),
                        "description": _("New and processing orders"),
                        "url": reverse(f"{site.name}:workspace_order_changelist")
                        + "?status__in=new,processing",
                    }
                )
                points = list(
                    qs.values("placed")
                    .annotate(value=Sum(F("orderline__quantity") * F("orderline__unit_price")))
                    .order_by("placed")
                )
                widgets.append(
                    {
                        "kind": "chart",
                        "title": _("Order volume"),
                        "description": _("Revenue by order date"),
                        "points": [
                            {
                                "label": row["placed"].strftime("%m/%d"),
                                "value": float(row["value"] or 0),
                            }
                            for row in points
                        ],
                    }
                )
    return widgets
