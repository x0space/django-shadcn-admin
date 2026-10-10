"""Run using a clean environment with the built wheel installed, without Node."""

from pathlib import Path
from tempfile import TemporaryDirectory

import django
from django.conf import settings

import django_shadcn

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = Path(django_shadcn.__file__).resolve().parent
static_directory = TemporaryDirectory(prefix="django-shadcn-smoke-")
if PACKAGE == ROOT / "src/django_shadcn":
    raise RuntimeError(
        "Run this script with a separately installed wheel, not an editable install."
    )

settings.configure(
    SECRET_KEY="smoke-only",
    DEBUG=False,
    ALLOWED_HOSTS=["testserver"],
    ROOT_URLCONF=__name__,
    LANGUAGE_CODE="en",
    USE_I18N=True,
    INSTALLED_APPS=[
        "django_shadcn",
        "django_shadcn.apps.ShadcnAdminConfig",
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.staticfiles",
    ],
    MIDDLEWARE=[
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "django_shadcn.middleware.ShadcnResponseMiddleware",
    ],
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    STATIC_URL="/static/",
    STATIC_ROOT=Path(static_directory.name) / "static",
    STORAGES={
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
        },
    },
    TEMPLATES=[
        {
            "BACKEND": "django.template.backends.django.DjangoTemplates",
            "APP_DIRS": True,
            "OPTIONS": {
                "context_processors": [
                    "django.template.context_processors.request",
                    "django.contrib.auth.context_processors.auth",
                    "django.contrib.messages.context_processors.messages",
                ]
            },
        }
    ],
)
django.setup()
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import Client
from django.urls import include, path

from django_shadcn.templatetags.shadcn import asset_manifest

urlpatterns = [path("admin/", admin.site.urls), path("i18n/", include("django.conf.urls.i18n"))]
try:
    call_command("check")
    call_command("collectstatic", interactive=False, verbosity=0)
    client = Client()
    response = client.get("/admin/login/")
    assert response.status_code == 200
    assert b"django-shadcn-root" in response.content
    for entry in asset_manifest().values():
        for name in [entry["file"], *entry.get("css", []), *entry.get("assets", [])]:
            assert (settings.STATIC_ROOT / "django_shadcn" / name).is_file(), name
    assert list((settings.STATIC_ROOT / "django_shadcn/assets").glob("*.woff2"))
    call_command("migrate", interactive=False, verbosity=0)
    user = get_user_model().objects.create_superuser("smoke", password="local-smoke-only")
    client.force_login(user)
    response = client.get("/admin/auth/user/", HTTP_ACCEPT="application/vnd.django-shadcn+json")
    assert response.status_code == 200
    assert response.json()["page"]["kind"] == "list"
    print(
        f"Installed package smoke passed: {PACKAGE}; "
        "login, registered admin, and collectstatic work without Node."
    )
finally:
    static_directory.cleanup()
