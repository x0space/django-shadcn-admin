from django.conf import settings
from django.core.checks import Error, register


@register()
def check_configuration(app_configs, **kwargs):
    errors = []
    if "django_shadcn.middleware.ShadcnResponseMiddleware" not in settings.MIDDLEWARE:
        errors.append(
            Error(
                "Django Shadcn requires its response middleware.",
                hint="Add django_shadcn.middleware.ShadcnResponseMiddleware to MIDDLEWARE.",
                id="shadcn.E001",
            )
        )
    from .conf import config

    options = config()
    if options["CALENDAR"] not in {"gregorian", "jalali"}:
        errors.append(Error("SHADCN CALENDAR must be gregorian or jalali.", id="shadcn.E002"))
    if options["THEME"] not in {"light", "dark", "system"}:
        errors.append(Error("SHADCN THEME must be light, dark or system.", id="shadcn.E003"))
    return errors
