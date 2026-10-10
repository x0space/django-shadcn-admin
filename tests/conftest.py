from datetime import date
from pathlib import Path

import pytest
from django.contrib.auth import get_user_model

from demo.workspace.models import Customer, Product

Path(__file__).resolve().parents[1].joinpath(".cache").mkdir(exist_ok=True)


@pytest.fixture
def admin_user(db):
    return get_user_model().objects.create_superuser("owner", "owner@example.com", "test-password")


@pytest.fixture
def admin_client(client, admin_user):
    client.force_login(admin_user)
    return client


@pytest.fixture
def product(db):
    return Product.objects.create(name="Notebook", sku="NOTE-001", price="24.50", stock=10)


@pytest.fixture
def customer(db):
    return Customer.objects.create(name="سینا", email="sina@example.com", joined=date(2026, 10, 9))


def descriptor(client, url):
    response = client.get(url, HTTP_ACCEPT="application/vnd.django-shadcn+json")
    assert response.status_code == 200
    return response.json()
