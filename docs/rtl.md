# RTL, translations, and calendars

The active Django language determines `lang` and `dir` on the document. React's Base UI `DirectionProvider` receives the same direction. Persian and Arabic are RTL; English is LTR. Language changes submit to Django's standard `set_language` view and reload the current URL. Configure `LANGUAGES`, `LocaleMiddleware`, and translated application models in the host project.

The library owns complete Persian/Arabic/English translations for its admin controls. Django owns translations for its authentication, validation, model labels and form help text. The demo's model translations are in `demo/locale/translations.json`; run `python scripts/compile_translations.py` to generate its PO/MO files without installing gettext.

Spacing, alignment, borders, icons and animation use the upstream registry's logical RTL transformation. Sidebar placement changes with document direction; mobile sheets and portal popups receive explicit `dir` attributes. Identifiers and email/URL fields stay LTR. Mixed user names and identifiers use bidi isolation. Do not flip non-directional icons such as checkmarks or settings gears.

Noto Sans Arabic and Geist are bundled with their OFL licenses. The CSS uses the Arabic font first in RTL contexts and contains reduced-motion overrides. Applications may customize the CSS variables without replacing components. Themes follow system appearance by default and update when the OS preference changes. Theme and calendar selections persist locally without migrations.

## Jalali dates

Calendar preference is independent of language. Gregorian is the default for all languages; choose Jalali in appearance controls or configure `SHADCN["CALENDAR"] = "jalali"`. The picker displays Jalali months through DayPicker's current `@daypicker/persian` add-on. This replaces the older `react-day-picker/persian` import used by some shadcn documentation examples.

Dates submit as Gregorian `YYYY-MM-DD`. A date-only value uses local year/month/day components and never `toISOString()`, which could change the day across timezones. Datetimes retain Django's original native widgets, localization, and timezone conversion. Persian calendar selection does not change database types or stored values.

The text box beside an admin date picker shows the canonical Gregorian date explicitly. It normalizes Persian/Arabic digits. Invalid text remains visible and is validated by the original Django form. Reusable `DatePicker` displays a localized calendar date and submits an optional hidden canonical field. Leap-day conversion and round trips have automated tests.

The upstream components retain their original props. For third-party React components, propagate direction into their portal roots and check arrow-key behavior, focus restoration, logical alignment, date labels and accessible names in both directions.
