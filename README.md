# Django Shadcn Admin

A Django admin generated from your existing `ModelAdmin` registrations, with upstream shadcn React components, Persian and Arabic RTL, and optional Jalali dates.

Built from the official Base Nova registry: 64 component families, 128 interactive examples, responsive navigation, accessible forms, and light/dark themes. Django keeps control of authentication, permissions, forms, actions, and persistence. Custom templates and widgets have a documented native compatibility path.

Save filtered workspaces with custom columns, switch between tables, Kanban, and
Gregorian/Jalali calendars, compare records, explore relationships, and review
form changes and bulk actions before saving. Dashboard cards link straight to
the records that need attention. See [workspace configuration](docs/workspaces.md).

## Install

Requires Python 3.12+ and Django 5.2–6.1. Once the first release is published to PyPI:

```sh
python -m pip install django-shadcn-admin
```

In your existing `settings.py`, replace `"django.contrib.admin"` with
`"django_shadcn.apps.ShadcnAdminConfig"` and add `"django_shadcn"` before it:

```python
INSTALLED_APPS = [
    "django_shadcn",  # Before the admin for native compatibility templates.
    "django_shadcn.apps.ShadcnAdminConfig",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Your apps...
]
```

Append the response middleware to your existing middleware list, keeping Django's
standard session, CSRF, authentication, and message middleware:

```python
MIDDLEWARE = [
    # Your existing middleware...
    "django_shadcn.middleware.ShadcnResponseMiddleware",
]
```

Keep your existing model registrations. In `urls.py`, retain the admin route and
add Django's language endpoint:

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("i18n/", include("django.conf.urls.i18n")),
    # Your existing routes...
]
```

For language switching, add `"django.middleware.locale.LocaleMiddleware"` after
`SessionMiddleware` and before `CommonMiddleware`, and set
`LANGUAGES = [("en", "English"), ("fa", "فارسی"), ("ar", "العربية")]`.

Use your existing static file configuration. For production, run:

```sh
python manage.py check
python manage.py collectstatic --noinput
```

Open `/admin/`. Existing users, permissions, and `ModelAdmin` registrations continue
to work; this package adds no database migrations. Both the wheel and source
distribution include compiled JavaScript, CSS, fonts, and licenses. Installing into
a Django project requires no Node, npm, frontend build, or remote CDN.

The distribution name is `django-shadcn-admin`; Python imports and Django settings
use `django_shadcn`.

## Run the demo

Clone this repository and install the development dependencies first:

```sh
git clone https://github.com/x0space/django-shadcn-admin.git
cd django-shadcn-admin
python -m pip install -e ".[dev]"
cd frontend
npm ci
npm run build
cd ..
python demo/manage.py migrate
python demo/manage.py seed_demo --password YOUR_LOCAL_PASSWORD
python demo/manage.py runserver
```

Open `http://127.0.0.1:8000/admin/` and sign in as `admin`. The seed command only sets the password when creating the user; it does not reset an existing user's password. Visit `/admin/components/` for the interactive library. Change language, appearance, and calendar using the header controls.

## Development

```sh
cd frontend
npm ci
npm run build
npm test
npm run coverage:components
cd ..
python -m pytest
python -m build --no-isolation
```

Build the frontend before packaging; distribution builds fail if required assets are
missing. `frontend/dist/library` contains the reusable React library and
declarations. `npm pack` in `frontend/` produces its installable tarball.

Use Python 3.12–3.14 and supported Django 5.2, 6.0, or 6.1. Frontend development requires Node 22.12+; this checkout was validated with Node 24. Version ranges describe compatibility; `package-lock.json` and `uv.lock` pin development resolutions.

## Documentation

- [Configuration and public API](https://github.com/x0space/django-shadcn-admin/blob/main/docs/api.md)
- [RTL, translation, and Jalali dates](https://github.com/x0space/django-shadcn-admin/blob/main/docs/rtl.md)
- [Compatibility and native fallback](https://github.com/x0space/django-shadcn-admin/blob/main/docs/compatibility.md)
- [Component coverage](https://github.com/x0space/django-shadcn-admin/blob/main/docs/component-coverage.md)
- [Development, testing, deployment, and upgrades](https://github.com/x0space/django-shadcn-admin/blob/main/docs/maintenance.md)
- [PyPI release instructions](https://github.com/x0space/django-shadcn-admin/blob/main/docs/releasing.md)
- [Validation results](https://github.com/x0space/django-shadcn-admin/blob/main/docs/validation.md)

MIT licensed. See [third-party notices](https://github.com/x0space/django-shadcn-admin/blob/main/THIRD_PARTY_NOTICES.md).
