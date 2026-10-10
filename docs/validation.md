# Validation report

Validation performed locally on Windows on 2026-10-10.

## Workspace feature validation

- **30 targeted browser checks pass** across Chromium, Firefox, and WebKit. The
  ten workflows cover saved filters/columns/layouts, Kanban persistence, dated
  and undated calendar records, comparison, relationship traversal, bulk review
  cancellation/confirmation, list-editable saves, form review and collapsed
  field preservation, existing CRUD/widget behavior, accessibility, Jalali
  calendars, and mobile Persian RTL. Results include focused reruns after fixing
  test selectors for preserved filter URLs and Persian numerals.
- **52 Django integration tests pass** on Django 5.2, 6.0, and 6.1. Added coverage
  includes scoped querysets, object permissions, CSRF, masked comparison fields,
  related-field visibility, action permission variants, expired/tampered/stale
  reviews, save hooks and change logs, readonly dates, and split datetime fields.
- **23 frontend tests pass**. Form snapshots cover checkbox/repeated values,
  choice labels, native split controls/file clearing, inline additions, masking,
  and malformed saved-view storage.
- Official Base Nova primitives were refreshed from the live shadcn registry
  using the verified latest CLI, **4.21.4**.
- Production admin/library builds, declaration generation, packaged static
  assets, the 64-family composition coverage check, Django system checks, Ruff,
  and whitespace checks pass.

## Release baseline

- Baseline Playwright suite: **18/18 passed** across Chrome (Chromium), Firefox 157 and WebKit 27.2. All 128 component compositions were scanned in each browser with no serious or critical accessibility findings. Supported admin screens also pass these scans.
- Responsive matrix: English, Persian and Arabic, light and dark themes, at 390, 768 and 1440 pixels. RTL portal direction, keyboard dismissal, command navigation, CRUD and inline controls pass.
- Frontend unit suite: **16/16 passed**, covering canonical/Jalali date conversion, invalid values, native widgets, semantic compositions, late extension registration, single/multiple select submission, widget synchronization, and Django autocomplete. Select tests send pointer-down before click to exercise Base UI's mouse activation contract.

- Django integration suite: **27/27 tests pass** on Django 5.2.18 / Python 3.12.14, Django 6.0.9 / Python 3.13.12, and Django 6.1.2 / Python 3.14.3 (free-threaded). The primary development environment also passes on Django 6.1.2 / Python 3.12.14. Regressions cover preserved filter navigation and masked native widget values.
- Django system checks and Ruff pass.
- Production admin and reusable React builds pass with declaration generation.
- The inventory contains 64 families and 128 compositions; coverage validation passes.
- The `django-shadcn-admin` 0.1.0 wheel and source archive both install into fresh environments, render the login page, load a registered admin model, and complete `collectstatic` with `ManifestStaticFilesStorage` without Node. PyPI metadata/README validation, matching distribution resources, version checks, and missing-asset build rejection pass.
- npm runtime audit (`--omit=dev`) reports zero vulnerabilities. Build-time CLI dependencies retain the documented upstream advisory.

## Boundaries

- PostgreSQL and the complete nine-combination Python/Django matrix are configured in CI. A local PostgreSQL server is unavailable, so its job has not been executed here.
- Installed Chrome covers Chromium locally because the Chromium download provider denies regional access. Firefox and WebKit use their downloaded Playwright distributions.
- Native relationship/custom-widget compatibility is intentional; see the compatibility matrix. Third-party templates and widgets require their own integration tests.
- Vite reports a chunk-size warning for the admin bootstrap (about 273 KB gzip). Charts and the component catalog are lazy chunks. Further bundle optimization remains possible without changing the public API.
