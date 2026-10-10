"""Check release versions and that wheel/sdist carry identical package resources."""

import argparse
import ast
import json
import tarfile
from email.parser import BytesParser
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]


def source_version():
    tree = ast.parse((ROOT / "src/django_shadcn/__init__.py").read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign):
            if any(
                isinstance(target, ast.Name) and target.id == "__version__"
                for target in node.targets
            ):
                return ast.literal_eval(node.value)
    raise RuntimeError("No package version found")


def check_release(dist, tag=None):
    version = source_version()
    if tag is not None and tag != f"v{version}":
        raise RuntimeError(f"Release tag {tag!r} must be v{version}")
    wheels = list(dist.glob("*.whl"))
    sdists = list(dist.glob("*.tar.gz"))
    if len(wheels) != 1 or len(sdists) != 1:
        raise RuntimeError("Use a clean release directory containing one wheel and one sdist")
    with ZipFile(wheels[0]) as wheel:
        metadata_path = next(name for name in wheel.namelist() if name.endswith("/METADATA"))
        metadata = BytesParser().parsebytes(wheel.read(metadata_path))
        wheel_package = {
            name: wheel.read(name)
            for name in wheel.namelist()
            if name.startswith("django_shadcn/") and not name.endswith("/")
        }
        for license_name in ["LICENSE", "THIRD_PARTY_NOTICES.md"]:
            if not any(name.endswith(f"/licenses/{license_name}") for name in wheel.namelist()):
                raise RuntimeError(f"Wheel is missing {license_name}")
    with tarfile.open(sdists[0]) as sdist:
        sdist_package = {}
        sdist_metadata = None
        hook_found = False
        for member in sdist.getmembers():
            if not member.isfile():
                continue
            name = member.name.split("/", 1)[1]
            if name == "hatch_build.py":
                hook_found = True
            if name == "PKG-INFO":
                sdist_metadata = BytesParser().parsebytes(sdist.extractfile(member).read())
            if name.startswith("src/django_shadcn/"):
                sdist_package[name.removeprefix("src/")] = sdist.extractfile(member).read()
            if "node_modules" in Path(name).parts or "__pycache__" in Path(name).parts:
                raise RuntimeError(f"Unexpected development artifact: {name}")
        if not hook_found:
            raise RuntimeError("Sdist is missing the build hook")
    for item in [metadata, sdist_metadata]:
        if item is None or item["Name"] != "django-shadcn-admin" or item["Version"] != version:
            raise RuntimeError("Distribution name/version does not match this release")
    if wheel_package != sdist_package:
        raise RuntimeError("Wheel and sdist contain different package resources")
    frontend_version = json.loads((ROOT / "frontend/package.json").read_text())["version"]
    frontend_lock = json.loads((ROOT / "frontend/package-lock.json").read_text())
    if (
        frontend_version != version
        or frontend_lock["version"] != version
        or frontend_lock["packages"][""]["version"] != version
    ):
        raise RuntimeError("Update frontend/package.json and its lockfile to the release version")
    print(
        f"Release checks passed: django-shadcn-admin {version}, "
        f"{len(wheel_package)} matching package files."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, default=ROOT / "dist")
    parser.add_argument("--tag")
    args = parser.parse_args()
    check_release(args.dist, args.tag)
