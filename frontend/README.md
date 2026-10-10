# @django-shadcn/ui

The reusable React component layer of Django Shadcn. Install the generated tarball with npm, import components from `@django-shadcn/ui`, and import `@django-shadcn/ui/styles.css` once. React and React DOM are peer dependencies.

```tsx
import { Button, Card, CardContent, DirectionProvider } from "@django-shadcn/ui"
import "@django-shadcn/ui/styles.css"

export function Example() {
  return <DirectionProvider direction="rtl"><Card><CardContent><Button>ذخیره</Button></CardContent></Card></DirectionProvider>
}
```

The package exports every imported upstream compound component, plus DatePicker, DataTable, Typography, mount helpers and Django field adapters. Component APIs follow shadcn's Base UI documentation. The code inventory and examples ship with the parent project.

MIT licensed. See THIRD_PARTY_NOTICES.md. The compiled Django admin application belongs to the Python distribution; this package serves independently built React applications.
