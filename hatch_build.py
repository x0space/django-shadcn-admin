"""Require prebuilt assets in distributions; installing them never runs Node."""

import json
from pathlib import Path

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        # Let contributors install tooling before their first frontend build.
        if version == "editable":
            return
        package = Path(self.root) / "src/django_shadcn"
        static = package / "static/django_shadcn"
        manifest_path = static / "manifest.json"
        hint = "Run npm ci and npm run build in frontend/ before packaging."
        if not manifest_path.is_file():
            raise RuntimeError(f"Compiled Django Shadcn assets are missing. {hint}")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        main = manifest.get("src/main.tsx", {})
        if not main.get("file") or not main.get("css") or not main.get("assets"):
            raise RuntimeError(f"The admin asset manifest is incomplete. {hint}")
        required = [
            "native.css",
            "licenses/index.json",
            "licenses/geist-LICENSE",
            "licenses/noto-sans-arabic-LICENSE",
        ]
        for entry in manifest.values():
            required.append(entry["file"])
            required.extend(entry.get("css", []))
            required.extend(entry.get("assets", []))
            for dependency in entry.get("imports", []) + entry.get("dynamicImports", []):
                if dependency not in manifest:
                    raise RuntimeError(f"Missing asset manifest entry: {dependency}. {hint}")
        for name in required:
            path = (static / name).resolve()
            if not path.is_relative_to(static.resolve()) or not path.is_file():
                raise RuntimeError(f"Missing or invalid packaged asset: {name}. {hint}")
        if not list((static / "assets").glob("*.woff2")):
            raise RuntimeError(f"Bundled fonts are missing. {hint}")
        for name in [
            "templates/django_shadcn/shell.html",
            "templates/django_shadcn/catalog.html",
            "templates/admin/base_site.html",
            "component-inventory.json",
            "py.typed",
        ]:
            if not (package / name).is_file():
                raise RuntimeError(f"Missing package resource: {name}")
