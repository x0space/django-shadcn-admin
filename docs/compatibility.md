# Admin compatibility

The supported Django series are 5.2 LTS, 6.0, and 6.1. The library does not require Django REST Framework. It depends on Django's admin context and helper functions; the compatibility matrix exercises these boundaries separately for each series.

| Feature | Rendering and behavior |
| --- | --- |
| Standard lists | shadcn table, native Django filtering/search/sorting/pagination |
| `list_editable` | named shadcn field controls, original Django formset POST |
| Actions and selected results | original actions, including across-page selection and intermediate responses |
| Forms and validation | original bound ModelForm, fieldsets, readonly values, errors and save buttons |
| Inline forms | Django prefixes, IDs and management forms, client-added empty forms, DELETE fields |
| Dates | shadcn calendar / optional Jalali, canonical Gregorian POST |
| Relationships / autocomplete / raw IDs | Django native relationship widgets and media inside the shadcn form |
| New file upload | shadcn input, Django multipart parsing |
| Existing file / clear checkbox | original native widget, preserving current-file and clear semantics |
| Datetime / MultiWidget / custom widget | original native renderer and media |
| Standard authentication | Django auth forms rendered with shadcn controls |
| Custom template / custom view | original native response, themed when it extends admin base |
| Popup add/change | original Django popup protocol and opener callbacks |
| Permissions / hooks / transactions / logs | original Django views and registered ModelAdmin |

The initial release deliberately uses native Django relationship widgets. These retain related-object controls and the existing restricted autocomplete endpoint. They are styled to fit the form but retain their native interaction API. Register adapters when a project requires a different interaction. Never replace a scoped relation queryset with an unrestricted frontend query.

The middleware checks the actual selected template's origin. An app/model/project override wins and remains native, even when the filename matches a built-in admin template. Unknown responses, redirects, downloads and intermediate action templates remain unchanged. Native pages retain widget `Media`, JavaScript, and the original URL namespace. Both built-in and custom widget HTML must follow Django's normal escaping rules.

Third-party admin extensions may depend on DOM selectors or their own AdminSite subclass. They require integration testing; the library does not claim universal automatic compatibility. Use a custom template to select the native path, or register a targeted adapter. Admin widgets that rely on exact Django row wrappers may also need a native template. This is documented compatibility rather than silent loss of behavior.

The library translates its own controls; host projects translate model metadata. Custom field errors, widget media, queryset restrictions and custom server actions remain the host application's responsibility. The component catalog demonstrates UI primitives; it does not imply that questionnaire or messaging previews implement an external AI service.
