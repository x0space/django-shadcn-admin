import json
from functools import lru_cache
from pathlib import Path
from uuid import uuid4

from django import template
from django.contrib.staticfiles.storage import staticfiles_storage
from django.utils.html import format_html, format_html_join, json_script

register = template.Library()
STATIC_ROOT = Path(__file__).resolve().parents[1] / "static" / "django_shadcn"


@lru_cache(maxsize=1)
def asset_manifest():
    path = STATIC_ROOT / "manifest.json"
    if not path.exists():
        raise RuntimeError("Django Shadcn assets are missing. Run npm run build in frontend/.")
    return json.loads(path.read_text(encoding="utf-8"))


@register.simple_tag(takes_context=True)
def shadcn_assets(context):
    entry = asset_manifest()["src/main.tsx"]
    links = format_html_join(
        "",
        '<link rel="stylesheet" href="{}">',
        ((staticfiles_storage.url("django_shadcn/" + css),) for css in entry.get("css", [])),
    )
    nonce = context.get("csp_nonce", "")
    from django_shadcn.conf import config

    extensions = format_html_join(
        "",
        '<script type="module" src="{}" nonce="{}"></script>',
        ((staticfiles_storage.url(path), nonce) for path in config()["EXTENSIONS"]),
    )
    return format_html(
        '{}<script type="module" src="{}" nonce="{}"></script>{}',
        links,
        staticfiles_storage.url("django_shadcn/" + entry["file"]),
        nonce,
        extensions,
    )


@register.simple_tag
def shadcn_mount(component, props=None):
    mount_id = "shadcn-" + uuid4().hex
    payload_id = mount_id + "-props"
    return format_html(
        '<div id="{}" data-shadcn-component="{}" data-shadcn-props="{}"></div>{}',
        mount_id,
        component,
        payload_id,
        json_script(props or {}, payload_id),
    )
