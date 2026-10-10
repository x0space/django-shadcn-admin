# Development, deployment, and upstream maintenance

## Build and test

Use `npm ci` in `frontend/`, then `npm run build`. The first build produces the admin application, and the second produces the reusable React library with declarations. Asset packaging copies the application manifest, hashed bundles, local fonts and licenses into `src/django_shadcn/static/django_shadcn`.

Run `python -m pytest`, `npm test`, and `npm run coverage:components`. Browser tests require the demo to be migrated and seeded with an explicit password:

```sh
python demo/manage.py migrate
python demo/manage.py seed_demo --password Demo-test-1234
cd frontend
npx playwright install
npm run test:e2e
```

The test password is for local/CI fixtures only. To use another password, set `SHADCN_DEMO_PASSWORD` for Playwright. `SHADCN_CHROME` may point to an installed Chrome executable when Playwright's Chromium distribution is unavailable. `SHADCN_PYTHON` may point to the Python interpreter used to start the test server.

CI tests supported Django/Python combinations, PostgreSQL integration, production assets, frontend unit tests, and Chromium/Firefox/WebKit workflows. `scripts/smoke_package.py` checks a separately installed distribution, registered admin pages, and `collectstatic`. Package only after building assets. The separate [release workflow](releasing.md) publishes to PyPI on a published GitHub release, or to TestPyPI on a manual run.

## Deployment

Install `django-shadcn-admin` with pip, configure Django normally, and run `collectstatic --noinput`. Serve `STATIC_ROOT` through your existing static hosting setup. Use Django's `ManifestStaticFilesStorage` if desired; the library resolves URLs through `staticfiles_storage`. Uploaded media uses the host application's storage and permissions.

Use normal Django production settings: `DEBUG=False`, a private secret key, configured allowed hosts, HTTPS, secure session/CSRF cookies, and an appropriate WSGI/ASGI server. Admin data remains authenticated and non-cacheable. `json_script` escapes bootstrap and mount props; extension scripts receive Django's CSP nonce when it is supplied to the template context. Native third-party widget media may impose its own CSP requirements.

The demo settings and credentials are development fixtures, not production configuration. The library itself has no migrations. Existing databases and model registrations do not need schema changes. Roll back by restoring `django.contrib.admin` and removing the library middleware/app; normal admin URL names remain usable.

## Upstream review — 2026-10-10

Keep the select wrapper's scrolling and inset padding on `Select.List`, with the
popup clipping its outer border. Base UI's scroll arrows measure the list. This
local integration fix prevents a scroll indicator from covering the last Arabic
language option in Firefox. Preserve it when refreshing registry components.

Imported all registry UI items using shadcn CLI 4.21.4 with `base-nova` and `rtl: true`. The inventory contains 61 registry components and three documented compositions: Data Table, Date Picker and Typography. The immutable inventory and source files define this release's coverage.

Primary references:

- [shadcn component catalog](https://ui.shadcn.com/docs/components)
- [shadcn RTL](https://ui.shadcn.com/docs/rtl)
- [Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- [Current DayPicker Persian package](https://daypicker.dev/localization/persian)
- [TanStack Table v9 migration](https://tanstack.com/table/latest/docs/framework/react/guide/migrating)
- [Django admin](https://docs.djangoproject.com/en/6.1/ref/contrib/admin/)

To update, review the changelog and registry diff, then run the pinned shadcn CLI's add/update commands intentionally. Preserve local patches and attribution. Run `node scripts/inventory.mjs` to regenerate inventory, Persian calendar adaptation and public exports; add two preview cases for new families. Run all tests and regenerate `npm run coverage:components`. Updates never run automatically in consumer projects.

Use the lockfile for reproducible builds. Audit runtime and build-time dependencies separately. The current shadcn CLI dependency tree contains the upstream `braces` stack-exhaustion advisory; it is a development tool and is not included in Python runtime requirements. Do not pass untrusted pattern input to the CLI. The runtime npm audit is recorded separately in the validation report; do not use `npm audit fix --force` to downgrade the CLI blindly.
