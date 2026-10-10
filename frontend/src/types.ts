export type Direction = "ltr" | "rtl";
export interface FieldDescriptor {
  name: string;
  id: string;
  label: string;
  help?: string;
  errors: string[];
  required?: boolean;
  disabled?: boolean;
  widget: string;
  value?: unknown;
  html?: string;
  attrs?: Record<string, string | number>;
  multiple?: boolean;
  choices?: {
    label: string;
    options: { value: string; label: string; selected: boolean }[];
  }[];
}
export interface FieldsetDescriptor {
  name: string;
  description: string;
  collapsed: boolean;
  lines: FieldDescriptor[][];
}
export interface InlineRow {
  label: string;
  fields: FieldsetDescriptor[];
  hidden: string[];
}
export interface InlineDescriptor {
  name: string;
  prefix: string;
  management: string;
  rows: InlineRow[];
  empty: InlineRow;
  can_add: boolean;
  max: number;
  errors: string[];
}
export interface FormPage {
  kind: "form" | "login";
  fieldsets: FieldsetDescriptor[];
  inlines: InlineDescriptor[];
  hidden: string[];
  errors: string[];
  has_errors: boolean;
  buttons: Record<string, boolean>;
  multipart: boolean;
  delete_url: string | null;
  history_url: string | null;
  cancel_url: string;
  prepopulated: { target: string; sources: string[] }[];
  next?: string;
  relations_url?: string | null;
  object_key?: string | null;
}
export interface WorkspaceRecord {
  key: string;
  label: string;
  url: string;
  group: string;
  date: string | null;
  can_move: boolean;
}
export interface WorkspaceDescriptor {
  group_field: string | null;
  date_field: string | null;
  groups: { value: string; label: string }[];
  records: WorkspaceRecord[];
  compare_url: string;
  preview_url: string;
  move_url: string;
}
export interface ListPage {
  kind: "list";
  workspace?: WorkspaceDescriptor | null;
  headers: {
    label: string;
    sortable: boolean;
    url: string | null;
    sorted: boolean;
    checkbox: boolean;
  }[];
  rows: {
    key: string;
    cells: { html: string; field: FieldDescriptor | null }[];
    hidden: string[];
  }[];
  count: number;
  page: number;
  pages: { label: string; current: boolean; url: string | null }[];
  search: string;
  search_enabled: boolean;
  search_hidden: { name: string; value: string }[];
  filters: {
    title: string;
    choices: { label: string; selected: boolean; url: string }[];
  }[];
  clear_url: string;
  actions: { value: string; label: string }[];
  management: string;
  errors: string[];
  editable: boolean;
  add_url: string | null;
}
export interface DashboardWidget {
  kind: "metric" | "chart";
  title: string;
  value?: string | number;
  description?: string;
  points?: { label: string; value: number }[];
  url?: string;
}
export interface DashboardPage {
  kind: "dashboard";
  recent: { label: string; message: string; time: string; url: string }[];
  widgets: DashboardWidget[];
}
export interface DeletePage {
  kind: "delete";
  objects_html: string;
  blocked: boolean;
  protected: string[];
  selected: string[];
  action: string;
  select_across: string;
  cancel_url: string;
}
export interface HistoryPage {
  kind: "history";
  rows: { date: string; user: string; message: string }[];
}
export interface ComponentInventory {
  name: string;
  slug: string;
  upstream: string;
  examples: string[];
}
export interface CatalogPage {
  kind: "catalog";
  inventory: ComponentInventory[];
}
export interface PageDescriptor {
  jsi18n_url: string;
  version: 1;
  title: string;
  language: string;
  direction: Direction;
  strings: Record<string, string>;
  brand: string;
  description: string;
  theme: "light" | "dark" | "system";
  calendar: "gregorian" | "jalali";
  languages: [string, string][];
  navigation: {
    name: string;
    models: {
      name: string;
      url: string;
      add_url: string | null;
      label: string;
    }[];
  }[];
  custom_navigation: { name: string; url: string }[];
  csrf: string;
  path: string;
  index_url: string;
  logout_url: string;
  password_url: string;
  site_url: string | null;
  catalog_url: string;
  language_url: string;
  user: { id?: string; name: string } | null;
  messages: { level: string; text: string }[];
  page:
    | FormPage
    | ListPage
    | DashboardPage
    | DeletePage
    | HistoryPage
    | CatalogPage;
}
