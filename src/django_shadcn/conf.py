from django.conf import settings
from django.utils.module_loading import import_string

DEFAULTS = {
    "BRAND": "Workspace",
    "DESCRIPTION": "Your operations, beautifully organized.",
    "LANGUAGES": [("en", "English"), ("fa", "فارسی"), ("ar", "العربية")],
    "THEME": "system",
    "CALENDAR": "gregorian",
    "NAVIGATION": [],
    "DASHBOARD": [],
    "EXTENSIONS": [],
    "MODEL_ICONS": {},
}


def config():
    return {**DEFAULTS, **getattr(settings, "SHADCN", {})}


def resolve(value):
    return import_string(value) if isinstance(value, str) else value
