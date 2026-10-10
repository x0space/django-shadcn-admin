import uuid
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Customer(models.Model):
    name = models.CharField(_("Name"), max_length=120)
    email = models.EmailField(_("Email"), unique=True)
    city = models.CharField(_("City"), max_length=80, blank=True)
    active = models.BooleanField(_("Active"), default=True)
    joined = models.DateField(_("Joined"))
    notes = models.TextField(_("Notes"), blank=True)

    class Meta:
        verbose_name = _("Customer")
        verbose_name_plural = _("Customers")

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(_("Name"), max_length=120)
    sku = models.CharField(_("SKU"), max_length=30, unique=True)
    price = models.DecimalField(
        _("Price"), max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    stock = models.PositiveIntegerField(_("Stock"), default=0)
    active = models.BooleanField(_("Active"), default=True)
    image = models.ImageField(_("Image"), upload_to="products/", blank=True)
    description = models.TextField(_("Description"), blank=True)

    class Meta:
        verbose_name = _("Product")
        verbose_name_plural = _("Products")

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS = [("new", _("New")), ("processing", _("Processing")), ("shipped", _("Shipped"))]
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, verbose_name=_("Customer"))
    status = models.CharField(_("Status"), max_length=20, choices=STATUS, default="new")
    placed = models.DateField(_("Placed"))
    notes = models.TextField(_("Notes"), blank=True)

    class Meta:
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")

    def __str__(self):
        return f"ORD-{self.pk or 'NEW'} · {self.customer}"


class OrderLine(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, verbose_name=_("Product"))
    quantity = models.PositiveIntegerField(
        _("Quantity"), default=1, validators=[MinValueValidator(1)]
    )
    unit_price = models.DecimalField(
        _("Unit price"), max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )

    class Meta:
        verbose_name = _("Order line")
        verbose_name_plural = _("Order lines")

    def __str__(self):
        return f"{self.product} × {self.quantity}"


class Article(models.Model):
    title = models.CharField(_("Title"), max_length=200)
    slug = models.SlugField(_("Slug"), unique=True)
    body = models.TextField(_("Body"))
    published = models.BooleanField(_("Published"), default=False)
    publish_date = models.DateField(_("Publish date"), blank=True, null=True)
    created = models.DateTimeField(_("Created"), auto_now_add=True)

    class Meta:
        verbose_name = _("Article")
        verbose_name_plural = _("Articles")

    def __str__(self):
        return self.title


class Ticket(models.Model):
    subject = models.CharField(_("Subject"), max_length=200)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, verbose_name=_("Customer"))
    priority = models.CharField(
        _("Priority"), max_length=10, choices=[("normal", _("Normal")), ("urgent", _("Urgent"))]
    )
    resolved = models.BooleanField(_("Resolved"), default=False)
    attachment = models.FileField(_("Attachment"), upload_to="tickets/", blank=True)
    created = models.DateTimeField(_("Created"), auto_now_add=True)

    class Meta:
        verbose_name = _("Ticket")
        verbose_name_plural = _("Tickets")

    def __str__(self):
        return self.subject


class Reply(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    author = models.CharField(_("Author"), max_length=80)
    body = models.TextField(_("Body"))
    created = models.DateTimeField(_("Created"), auto_now_add=True)

    class Meta:
        verbose_name = _("Reply")
        verbose_name_plural = _("Replies")

    def __str__(self):
        return self.author


class Category(models.Model):
    name = models.CharField(_("Name"), max_length=120)
    parent = models.ForeignKey("self", blank=True, null=True, on_delete=models.SET_NULL)
    image = models.URLField(blank=True)
    position = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class FieldSample(models.Model):
    name = models.CharField(_("Name"), max_length=120)
    images = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    categories = models.ManyToManyField(Category, blank=True)
    customer = models.ForeignKey(Customer, blank=True, null=True, on_delete=models.SET_NULL)
    product = models.ForeignKey(Product, blank=True, null=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=Order.STATUS, default="new")
    featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    alarm = models.TimeField(blank=True, null=True)
    duration = models.DurationField(blank=True, null=True)
    identifier = models.UUIDField(default=uuid.uuid4)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    ratio = models.FloatField(default=0)
    attachment = models.FileField(upload_to="samples/", blank=True)
    image = models.ImageField(upload_to="samples/", blank=True)

    def __str__(self):
        return self.name
