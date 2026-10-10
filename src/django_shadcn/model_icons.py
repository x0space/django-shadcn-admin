"""Stable semantic icons, with an explicit override for domain-specific models."""
import re

from .conf import config

ICON_NAMES = ("box", "users", "receipt", "file-text", "folder", "tag", "message", "calendar", "image", "shield", "settings", "database", "mail", "globe", "chart", "key")
RULES = (
    (r"user|customer|client|member|person|author|contact", "users"),
    (r"group|permission|role|policy", "shield"),
    (r"order|invoice|payment|transaction|purchase|cart", "receipt"),
    (r"product|stock|inventory|item|variant", "box"),
    (r"categor|folder|collection", "folder"),
    (r"tag|label", "tag"),
    (r"ticket|reply|comment|message|chat", "message"),
    (r"article|post|page|document|note|blog", "file-text"),
    (r"image|photo|media|gallery|asset", "image"),
    (r"event|schedule|booking|appointment", "calendar"),
    (r"setting|config|preference", "settings"),
    (r"token|credential|secret|key", "key"),
    (r"mail|newsletter|campaign", "mail"),
    (r"site|domain|region|country|language", "globe"),
    (r"report|metric|analytic", "chart"),
)


def model_icon(model, site):
    label = model._meta.label_lower
    model_admin = site._registry.get(model)
    override = getattr(model_admin, "shadcn_icon", None) or config()["MODEL_ICONS"].get(label)
    if override in ICON_NAMES:
        return override
    for pattern, icon in RULES:
        if re.search(pattern, model._meta.model_name):
            return icon
    return "database"
