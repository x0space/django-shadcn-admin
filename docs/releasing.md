# Publishing django-shadcn-admin

The PyPI distribution is `django-shadcn-admin`. Its import package remains
`django_shadcn`. Consumer installs need only pip and Django; all frontend assets
ship in the wheel and source distribution.

## One-time account setup

Create a PyPI account, verify your email, and enable two-factor authentication.
In [PyPI publishing settings](https://pypi.org/manage/account/publishing/), add a
pending GitHub publisher with these exact values:

| Field | Value |
| --- | --- |
| PyPI project name | `django-shadcn-admin` |
| GitHub owner | `x0space` |
| Repository | `django-shadcn-admin` |
| Workflow filename | `release.yml` |
| Environment name | `pypi` |

Create a GitHub environment named `pypi` under repository Settings → Environments.
If the project already exists on PyPI and you own it, configure the publisher in
that project's settings instead of adding a pending publisher. A pending publisher
does not reserve the package name. See the official
[first-project publishing guide](https://docs.pypi.org/trusted-publishers/creating-a-project-through-oidc/).

For a trial release, create a separate account on
[TestPyPI](https://test.pypi.org/account/register/), register the same publisher
there with environment `testpypi`, and create that GitHub environment too.
Accounts and publisher configurations are separate on the two indexes.

Publishing uses [PyPI Trusted Publishing](https://docs.pypi.org/trusted-publishers/using-a-publisher/)
through GitHub's identity token. No PyPI password or persistent API token is
stored in the repository.

## Build locally

From the repository root:

```sh
python -m pip install -e ".[dev,release]"
cd frontend
npm ci
npm run build
npm test
npm run coverage:components
cd ..
python -m pytest
python -m ruff check src demo tests scripts hatch_build.py
python -m build --outdir dist/release
python -m twine check --strict dist/release/*
python scripts/check_release.py --dist dist/release --tag v0.1.0
```

Use a clean `dist/release` directory for each version. The build produces an sdist
and then builds the wheel from that sdist, exercising the same build consumers
use without running Node. The build hook rejects missing assets, fonts, template
resources, and font notices. The release check verifies package versions, license
notices, and identical package files in both distributions.

To verify the wheel in a separate environment:

```sh
python -m venv .cache/release-wheel
# POSIX:
.cache/release-wheel/bin/python -m pip install dist/release/*.whl
.cache/release-wheel/bin/python scripts/smoke_package.py
# Windows PowerShell (substitute the version for later releases):
.cache/release-wheel/Scripts/python.exe -m pip install dist/release/django_shadcn_admin-0.1.0-py3-none-any.whl
.cache/release-wheel/Scripts/python.exe scripts/smoke_package.py
```

The smoke script configures an independent Django project, collects static files
with `ManifestStaticFilesStorage`, renders the login page, and loads a registered
admin model. It uses a temporary static directory and an in-memory database.

## Publish the first release

1. Push the source and `.github/workflows/release.yml` to
   [x0space/django-shadcn-admin](https://github.com/x0space/django-shadcn-admin).
2. Let CI pass. Optionally run **Publish Python package** manually from Actions;
   manual runs publish only to TestPyPI after building and checking distributions.
3. Publish a GitHub release with tag `v0.1.0` targeting the tested commit.
   Publishing the release triggers the PyPI workflow. Its build job checks the tag
   against the package version, runs tests, and installs both the wheel and sdist
   into fresh environments before upload.
4. Wait for the publish job to succeed, then verify installation from PyPI in a
   fresh environment:

   ```sh
   python -m pip install django-shadcn-admin==0.1.0
   ```

For later releases, update `src/django_shadcn/__init__.py` (the single source of
Python version metadata), update the frontend version and lockfile using
`npm version VERSION --no-git-tag-version` in `frontend/`, and refresh `uv.lock`.
Publish a release with the matching `vVERSION` tag. Uploaded versions cannot be
replaced; fixes require a new version. TestPyPI uploads also need unique versions.
