# Admin workspaces

Lists support saved views and column visibility. Saved views remember the current
Django filters, search, sorting, page, columns, and Table/Kanban/Calendar layout.
Storage is local to this browser and scoped to the signed-in user, admin site,
and collection. The current layout survives navigation and pagination.
No database migrations or external services are required.

Use `ShadcnModelAdmin` to enable record comparison, bulk-action review, configured
Kanban/calendar views, and relationship exploration:

```python
from django_shadcn.admin import ShadcnModelAdmin

class OrderAdmin(ShadcnModelAdmin):
    list_display = ["__str__", "customer", "status", "placed"]
    list_filter = ["status"]
    shadcn_workspace = {"group_field": "status", "date_field": "placed"}
    shadcn_relations = ["customer", "orderline"]
    shadcn_action_previews = {"mark_shipped": {"status": "shipped"}}
    actions = ["mark_shipped"]
```

`group_field` must be an editable choice field in the admin form. Kanban cards
can be dragged between columns or moved using their keyboard-accessible select.
Moves validate a Django ModelForm, run `save_form`, `save_model`, `save_related`,
and create an admin change log. A stale original status produces a conflict
instead of overwriting another user's move. Moves edit just the configured field;
use the ordinary change form when a transition needs additional user input.

`date_field` accepts an exposed date/datetime field, including readonly model
fields. Calendar dates use the project's timezone and the existing Gregorian or
Jalali preference. Days containing records are marked; select a day to see its
records. Undated records have their own view. Both alternate layouts display the
current ChangeList page and use Django search, filters, and pagination.

`shadcn_relations` lists model field/query names (`order` for a reverse relation,
not the `order_set` accessor). Each related model must be registered with this
admin site. The explorer uses its admin queryset and model/object permissions,
shows up to 50 records per relation, and can follow connections recursively when
the related admin also subclasses `ShadcnModelAdmin`.

Select exactly two records to compare the fields exposed by their admin forms.
Differences are highlighted and can be isolated. Exclusions, object-specific
forms, password/hidden widgets, and unknown custom widget masking are respected.
Related field labels are shown only when the related object is visible.

All bulk actions on `ShadcnModelAdmin` lists first review their affected records.
`shadcn_action_previews` maps an action name to its deterministic field assignments.
Keep these values consistent with the action implementation. Previewing never
executes an action. Arbitrary actions without a mapping show the affected records
and an explicit notice that field changes are unavailable; Django's own
confirmations still run. The demo's shipping action previews each order's old
and new status.

Reviews accept up to 1,000 records, expire after five minutes, and are bound to the
user, site, model, action, filters, selection, and current model state. Confirming
rechecks the reviewed rows before invoking the original admin action, using row
locks on databases that support them.
Changed records or selections require another review. Native callers that don't
submit a review token retain normal Django admin behavior. Custom actions that
return their own confirmation view remain responsible for that view's submission.

Ordinary admin forms and list-editable saves show a Before/After review before
submitting changed fields. Cancel keeps the draft. Confirm preserves Save,
Save and continue, and Save and add another. Password and native/custom widget
contents are represented by a change marker instead of displaying sensitive
values. Inline additions and deletion controls are included.

Dashboard providers may add a `url` to a metric or chart descriptor:

```python
{"kind": "metric", "title": "Orders needing attention", "value": count,
 "url": "/admin/shop/order/?status__in=new,processing"}
```

The title and metric value link directly to that filtered collection. Providers
must apply their existing authorization and queryset scoping requirements.

The interface includes English, Persian, and Arabic strings, RTL dialogs and
controls, responsive layouts, and the latest official shadcn Base Nova primitives
fetched with shadcn CLI 4.21.4 on October 10, 2026.
