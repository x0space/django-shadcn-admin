from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from django_shadcn.admin import ShadcnModelAdmin

from .models import Article, Customer, Order, OrderLine, Product, Reply, Ticket


@admin.register(Customer)
class CustomerAdmin(ShadcnModelAdmin):
    shadcn_workspace = {"date_field": "joined"}
    shadcn_relations = ["order", "ticket"]
    list_display = ["name", "email", "city", "active", "joined"]
    list_filter = ["active", "city"]
    search_fields = ["name", "email"]
    fieldsets = [
        (None, {"fields": ["name", "email", "city", "joined", "active"]}),
        (_("Notes"), {"fields": ["notes"], "classes": ["collapse"]}),
    ]


@admin.register(Product)
class ProductAdmin(ShadcnModelAdmin):
    shadcn_relations = ["orderline"]
    list_display = ["name", "sku", "price", "stock", "active"]
    list_editable = ["price", "stock", "active"]
    list_filter = ["active"]
    search_fields = ["name", "sku"]
    list_per_page = 10


class OrderLineInline(admin.TabularInline):
    model = OrderLine
    extra = 0


@admin.register(Order)
class OrderAdmin(ShadcnModelAdmin):
    shadcn_workspace = {"group_field": "status", "date_field": "placed"}
    shadcn_relations = ["customer", "orderline"]
    shadcn_action_previews = {"mark_shipped": {"status": "shipped"}}
    list_display = ["__str__", "customer", "status", "placed"]
    list_filter = ["status"]
    search_fields = ["customer__name"]
    autocomplete_fields = ["customer"]
    inlines = [OrderLineInline]
    actions = ["mark_shipped"]

    @admin.action(description=_("Mark selected orders as shipped"))
    def mark_shipped(self, request, queryset):
        count = queryset.update(status="shipped")
        self.message_user(request, f"{count} orders shipped.")


@admin.register(Article)
class ArticleAdmin(ShadcnModelAdmin):
    shadcn_workspace = {"date_field": "publish_date"}
    list_display = ["title", "published", "publish_date"]
    list_filter = ["published"]
    search_fields = ["title"]
    prepopulated_fields = {"slug": ["title"]}
    readonly_fields = ["created"]


class ReplyInline(admin.StackedInline):
    model = Reply
    extra = 0
    readonly_fields = ["created"]


@admin.register(Ticket)
class TicketAdmin(ShadcnModelAdmin):
    readonly_fields = ["created"]
    shadcn_workspace = {"group_field": "priority", "date_field": "created"}
    shadcn_relations = ["customer", "reply"]
    list_display = ["subject", "customer", "priority", "resolved"]
    list_filter = ["priority", "resolved"]
    search_fields = ["subject", "customer__email"]
    inlines = [ReplyInline]


@admin.register(OrderLine)
class OrderLineAdmin(ShadcnModelAdmin):
    list_display = ["order", "product", "quantity", "unit_price"]
    shadcn_relations = ["order", "product"]


@admin.register(Reply)
class ReplyAdmin(ShadcnModelAdmin):
    list_display = ["ticket", "author", "created"]
    readonly_fields = ["created"]
    shadcn_relations = ["ticket"]
