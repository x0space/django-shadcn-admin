import os
from datetime import timedelta
from decimal import Decimal

from django.contrib.admin.models import ADDITION, LogEntry
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from demo.workspace.models import Article, Customer, Order, OrderLine, Product, Reply, Ticket


class Command(BaseCommand):
    help = "Seed reproducible demo content; password must be provided explicitly."

    def add_arguments(self, parser):
        parser.add_argument("--password", default=os.environ.get("SHADCN_DEMO_PASSWORD"))

    @transaction.atomic
    def handle(self, *args, **options):
        if not options["password"]:
            raise CommandError("Provide --password or SHADCN_DEMO_PASSWORD for the demo admin.")
        user, created = get_user_model().objects.get_or_create(
            username="admin",
            defaults={"is_staff": True, "is_superuser": True, "email": "admin@example.com"},
        )
        if created:
            user.set_password(options["password"])
            user.save()
        today = timezone.localdate()
        customers = []
        for i, (name, city) in enumerate(
            [
                ("سینا احمدی", "Tehran"),
                ("ليلى حسن", "Dubai"),
                ("Emma Laurent", "Paris"),
                ("Arman Studio", "Shiraz"),
                ("Noah Park", "Seoul"),
            ]
        ):
            customer, _ = Customer.objects.get_or_create(
                email=f"customer{i}@example.com",
                defaults={"name": name, "city": city, "joined": today - timedelta(days=30 + i)},
            )
            customers.append(customer)
        products = []
        for i, name in enumerate(
            [
                "Studio notebook",
                "Desk light",
                "Canvas tote",
                "Ceramic cup",
                "Weekly planner",
                "Brass pen",
                "Linen cover",
                "Sketchbook",
                "Travel pouch",
                "Glass carafe",
                "Oak tray",
                "Paper clips",
            ]
        ):
            product, _ = Product.objects.get_or_create(
                sku=f"FRM-{1000 + i}",
                defaults={
                    "name": name,
                    "price": Decimal(18 + i * 7),
                    "stock": 10 + i * 3,
                    "description": "Thoughtfully made for your everyday workspace.",
                },
            )
            products.append(product)
        for i in range(24):
            order, _ = Order.objects.get_or_create(
                customer=customers[i % 5],
                placed=today - timedelta(days=23 - i),
                defaults={"status": ["new", "processing", "shipped"][i % 3]},
            )
            OrderLine.objects.get_or_create(
                order=order,
                product=products[i % 12],
                defaults={"quantity": i % 4 + 1, "unit_price": products[i % 12].price},
            )
        for i, title in enumerate(
            ["A quieter way to work", "Designing for every direction", "Behind the collection"]
        ):
            Article.objects.get_or_create(
                slug=f"story-{i}",
                defaults={
                    "title": title,
                    "body": "Good tools should feel effortless. This is where our next chapter begins.",
                    "published": i != 2,
                    "publish_date": today,
                },
            )
        for i, subject in enumerate(["Delivery update", "درخواست تغییر نشانی", "مساعدة في الطلب"]):
            ticket, _ = Ticket.objects.get_or_create(
                subject=subject,
                defaults={"customer": customers[i], "priority": "normal", "resolved": i == 0},
            )
            Reply.objects.get_or_create(
                ticket=ticket,
                author=customers[i].name,
                defaults={"body": "Can you help me with my order?"},
            )
        for example in (products[0], customers[0], Order.objects.first(), Ticket.objects.first()):
            LogEntry.objects.get_or_create(
                user_id=user.pk,
                content_type=ContentType.objects.get_for_model(example),
                object_id=str(example.pk),
                action_flag=ADDITION,
                defaults={"object_repr": str(example)[:200], "change_message": "[]"},
            )
        self.stdout.write(
            self.style.SUCCESS("Demo ready: admin user and commerce, content, support records.")
        )
