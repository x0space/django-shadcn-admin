# Configuration and extension API

## Admin setup

`ShadcnAdminConfig` preserves Django's automatic admin discovery. `ShadcnAdminSite` subclasses Django's `AdminSite`. Keep ordinary `ModelAdmin` classes and registrations; use `ShadcnModelAdmin` when you need presentation overrides.

The response middleware adapts standard Django admin `TemplateResponse` context before rendering. It never replaces model forms, querysets, save hooks, actions, or permission checks. Normal navigation and POST use Django's original URLs and redirects; there is no separate CRUD API to configure. The JSON representation is available by requesting `Accept: application/vnd.django-shadcn+json`. Its `version` is currently `1`. This is an authenticated presentation interface, not a public model API.

Custom AdminSite instances also work. Register models on that instance and include `site.urls`. Custom URL namespaces are preserved.

## Settings

```python
SHADCN = {
    "BRAND": "Forma",
    "DESCRIPTION": "Your operations, beautifully organized.",
    "LANGUAGES": [("en", "English"), ("fa", "فارسی"), ("ar", "العربية")],
    "THEME": "system",          # light / dark / system
    "CALENDAR": "gregorian",   # gregorian / jalali
    "NAVIGATION": [
        {"name": "Reports", "url": "/admin/reports/", "permission": "sales.view_order"},
    ],
    "DASHBOARD": ["myapp.dashboard.metrics"],
    "EXTENSIONS": ["myapp/admin-extension.js"],  # Django static paths
}
```

`NAVIGATION` controls visibility; the destination view must also check authorization. Without a permission entry, a link is visible to active staff. Dashboard providers receive `(request, site)` and return metric/chart descriptors. Providers must apply both model/object authorization and queryset scoping. Navigation, autocomplete and recent activity use the registered admin's permissions. The default activity feed only includes the current user's changes to objects still visible through that admin's queryset.

```python
def metrics(request, site):
    model_admin = site._registry[Order]
    if not model_admin.has_view_or_change_permission(request):
        return []
    count = model_admin.get_queryset(request).count()
    return [{"kind": "metric", "title": "Orders", "value": count,
             "description": "Visible orders"}]
```

Chart descriptors have `kind="chart"`, `title`, optional `description`, and `points=[{"label": "Oct", "value": 100}]`. Numeric values are numeric JSON values; decimal currency should be formatted intentionally by the provider.

## Widget adapters

Register a Python adapter using `site.register_widget(WidgetClass, adapter)`. The adapter receives `(bound_field, request)` and returns a JSON-compatible field descriptor. Required keys are `widget`, `name`, `id`, `label`, and `errors`; additional keys include `value`, `help`, `required`, `disabled`, `attrs`, and `html`.

Adapters are selected through the widget's class hierarchy. Unknown custom widgets retain their native renderer and form media. On `ShadcnModelAdmin`, `shadcn_field_widgets = {"rating": "rating"}` can select a custom frontend renderer for a standard form field.

```tsx
import { registerFieldAdapter, Input } from "@django-shadcn/ui"
registerFieldAdapter("rating", ({field}) => (
  <Input type="number" min={1} max={5} id={field.id} name={field.name}
    defaultValue={String(field.value ?? "")} disabled={field.disabled} />
))
```

Adapters must preserve Django field names, disabled state, errors, and serialization. HTML descriptors are a trusted Django rendering boundary: never mark user-supplied content safe merely to display it.

Native descriptors contain the widget's rendered HTML and omit its unrendered initial value. This preserves the masking behavior of sensitive custom widgets. A Python adapter explicitly controls which values it makes available to its frontend renderer.

## Components outside admin

```tsx
import { Button, Card, CardContent, DirectionProvider } from "@django-shadcn/ui"
import "@django-shadcn/ui/styles.css"

<DirectionProvider direction="rtl">
  <Card><CardContent><Button>ذخیره</Button></CardContent></Card>
</DirectionProvider>
```

Compound components are exported under the original upstream names. `DatePicker`, `DataTable`, `DataTableColumn`, and `Typography` provide reusable compositions. `DataTable` uses TanStack Table v9's sorting/filtering/pagination features; admin lists use Django's server-side `ChangeList` instead. `Providers` supplies the full admin context for exported Django form adapters.

Django templates can mount JSON-compatible components:

```django
{% load shadcn %}
{% shadcn_assets %}
{% shadcn_mount "Badge" badge_props %}
```

Built-in mount names are `Button`, `Card`, `Alert`, `Badge`, and `Input`. Pass props such as `{"children": "Published", "variant": "secondary"}` from the view. Events/functions cannot be represented in JSON: implement interactive behavior in a registered React component.

Standalone React applications can import registration functions from the npm library. Extensions of the packaged admin use the page's shared `window.DjangoShadcn` runtime, so registration updates the admin's registry and shares its React instance. Include the extension through `EXTENSIONS`; modules execute after the main module. Adapter registration updates already-mounted fields. Mount helpers run at DOM readiness, or can be called explicitly after adding new mount nodes.

```javascript
// myapp/admin-extension.js — no second copy of React is needed.
const {React, registerFieldAdapter, ui} = window.DjangoShadcn
registerFieldAdapter("rating", ({field}) => React.createElement(ui.Input, {
  id: field.id, name: field.name, type: "number", min: 1, max: 5,
  defaultValue: String(field.value ?? ""), disabled: field.disabled,
}))
```

The shared runtime also exposes `registerComponent`, `mountComponents`, `useApp`, `useStrings`, and a small `ui` map (`Button`, `Card`, `Alert`, `Badge`, `Input`). Unknown mount names produce a clear console error and are never evaluated as JavaScript.

The library adds no database tables. Theme and calendar preferences use local storage; language uses Django's language cookie. Production security, session settings and uploaded-media storage belong to the consuming project.
