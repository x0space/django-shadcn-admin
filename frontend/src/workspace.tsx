import { useId, useState, useEffect, type ReactNode } from "react";
import {
  BookmarkIcon,
  Columns3Icon,
  GitCompareIcon,
  NetworkIcon,
  TableIcon,
  CalendarIcon,
  LayoutDashboardIcon,
} from "lucide-react";
import { enUS, faIR, ar } from "date-fns/locale";
import { enUS as enJalali, faIR as faJalali } from "@daypicker/persian";
import type { ListPage, WorkspaceDescriptor, WorkspaceRecord } from "./types";
import { useApp, useStrings } from "./context";
import { canonicalDate, parseDate } from "./adapters/fields";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Checkbox } from "./components/ui/checkbox";
import { Badge } from "./components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./components/ui/select";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Calendar } from "./components/ui/calendar";
import { PersianCalendar } from "./components/persian-calendar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./components/ui/table";

export async function workspaceRequest<T>(
  url: string,
  body?: FormData,
): Promise<T> {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    body,
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error("Session expired. Refresh and sign in again.");
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || `Request failed (${response.status}).`);
  return result as T;
}

export function ReviewDialog({
  title,
  description,
  open,
  onClose,
  children,
  onConfirm,
  busy = false,
}: {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  onConfirm?: () => void;
  busy?: boolean;
}) {
  const t = useStrings();
  const { data } = useApp();
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose();
      }}
    >
      <DialogContent
        dir={data.direction}
        className="sm:max-w-3xl max-h-[85dvh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            {t.cancel}
          </Button>
          {onConfirm && (
            <Button type="button" disabled={busy} onClick={onConfirm}>
              {t.confirm_changes}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ViewKind = "table" | "kanban" | "calendar";
interface SavedView {
  id: string;
  name: string;
  query: string;
  view: ViewKind;
  columns: number[];
}
function supportedView(view: ViewKind, page: ListPage): ViewKind {
  return (view === "kanban" && !page.workspace?.group_field) ||
    (view === "calendar" && !page.workspace?.date_field)
    ? "table"
    : view;
}
export function readSavedViews(key: string, columnCount: number): SavedView[] {
  try {
    const entries: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(entries)) return [];
    return entries
      .filter((item): item is SavedView =>
        Boolean(
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.query === "string" &&
          ["table", "kanban", "calendar"].includes(item.view) &&
          Array.isArray(item.columns) &&
          item.columns.every(
            (index: unknown) =>
              Number.isInteger(index) &&
              Number(index) >= 0 &&
              Number(index) < columnCount,
          ),
        ),
      )
      .slice(0, 30);
  } catch {
    return [];
  }
}
export function useWorkspaceViews(page: ListPage) {
  const { data } = useApp();
  const key = `django-shadcn:views:${data.user?.id || data.user?.name}:${data.index_url}:${window.location.pathname}`;
  const [saved, setSaved] = useState(() =>
    readSavedViews(key, page.headers.length),
  );
  const requested = new URLSearchParams(window.location.hash.slice(1)).get(
    "workspace",
  );
  const active = saved.find((item) => item.id === requested);
  const layout = readSavedViews(`${key}:layout`, page.headers.length)[0];
  const [view, setView] = useState<ViewKind>(
    supportedView(active?.view || layout?.view || "table", page),
  );
  const [columns, setColumns] = useState(
    active?.columns || layout?.columns || page.headers.map((_, i) => i),
  );
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(
        `${key}:layout`,
        JSON.stringify([
          { id: "layout", name: "layout", query: "", view, columns },
        ]),
      );
    } catch {
      setStorageError(true);
    }
  }, [key, view, columns]);
  const write = (next: SavedView[]) => {
    setSaved(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };
  return {
    saved,
    view,
    setView: (value: ViewKind) => {
      setView(value);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    },
    columns,
    setColumns: (value: number[]) => {
      setColumns(value);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    },
    storageError,
    save: (name: string) => {
      if (name.trim())
        write([
          ...saved.slice(-29),
          {
            id: crypto.randomUUID(),
            name: name.trim().slice(0, 80),
            query: window.location.search,
            view,
            columns,
          },
        ]);
    },
    remove: (id: string) => write(saved.filter((item) => item.id !== id)),
    restore: (id: string) => {
      const item = saved.find((entry) => entry.id === id);
      if (item) {
        const target = `${window.location.pathname}${item.query.startsWith("?") ? item.query : ""}#workspace=${encodeURIComponent(id)}`;
        if (item.query === window.location.search) {
          setView(supportedView(item.view, page));
          setColumns(item.columns);
          window.history.replaceState(null, "", target);
        } else window.location.assign(target);
      }
    },
  };
}

export function WorkspaceToolbar({
  page,
  views,
  selected,
}: {
  page: ListPage;
  views: ReturnType<typeof useWorkspaceViews>;
  selected: Set<string>;
}) {
  const t = useStrings();
  const id = useId();
  const [saveOpen, setSaveOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={views.view}
          onValueChange={(value) => views.setView(value as ViewKind)}
        >
          <TabsList aria-label={t.view}>
            <TabsTrigger value="table">
              <TableIcon />
              {t.table_view}
            </TabsTrigger>
            {page.workspace?.group_field && (
              <TabsTrigger value="kanban">
                <LayoutDashboardIcon />
                {t.kanban_view}
              </TabsTrigger>
            )}
            {page.workspace?.date_field && (
              <TabsTrigger value="calendar">
                <CalendarIcon />
                {t.calendar_view}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="table" className="sr-only">
            {t.table_view}
          </TabsContent>
          <TabsContent value="kanban" className="sr-only">
            {t.kanban_view}
          </TabsContent>
          <TabsContent value="calendar" className="sr-only">
            {t.calendar_view}
          </TabsContent>
        </Tabs>
        <Button variant="outline" onClick={() => setSaveOpen(true)}>
          <BookmarkIcon />
          {t.save_view}
        </Button>
        <Button variant="outline" onClick={() => setColumnsOpen(true)}>
          <Columns3Icon />
          {t.columns}
        </Button>
        {page.workspace && (
          <CompareRecords
            url={page.workspace.compare_url}
            selected={selected}
          />
        )}
      </div>
      {views.saved.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label={t.saved_views}>
          {views.saved.map((item) => (
            <div className="inline-flex rounded-lg border" key={item.id}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => views.restore(item.id)}
              >
                {item.name}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`${t.remove} ${item.name}`}
                onClick={() => views.remove(item.id)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      {views.storageError && (
        <Alert>
          <AlertDescription>{t.storage_unavailable}</AlertDescription>
        </Alert>
      )}
      <ReviewDialog
        title={t.save_view}
        description={t.save_view_description}
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            views.save(name);
            setName("");
            setSaveOpen(false);
          }}
          className="space-y-3"
        >
          <label htmlFor={id}>{t.view_name}</label>
          <Input
            id={id}
            value={name}
            maxLength={80}
            required
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" disabled={!name.trim()}>
            {t.save_view}
          </Button>
        </form>
      </ReviewDialog>
      <ReviewDialog
        title={t.columns}
        description={t.columns_description}
        open={columnsOpen}
        onClose={() => setColumnsOpen(false)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {page.headers.map(
            (header, i) =>
              !header.checkbox && (
                <label key={i} className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      views.columns.includes(i) ||
                      page.rows.some((row) => row.cells[i]?.field)
                    }
                    disabled={
                      page.rows.some((row) => row.cells[i]?.field) ||
                      (views.columns.filter(
                        (index) => !page.headers[index].checkbox,
                      ).length === 1 &&
                        views.columns.includes(i))
                    }
                    onCheckedChange={(checked) =>
                      views.setColumns(
                        checked
                          ? [...views.columns, i]
                          : views.columns.filter((index) => index !== i),
                      )
                    }
                  />
                  {header.label}
                </label>
              ),
          )}
        </div>
      </ReviewDialog>
      {views.view !== "table" && (
        <p className="text-xs text-muted-foreground">{t.page_scope}</p>
      )}
    </div>
  );
}

export function RecordCard({
  record,
  selected,
  onSelect,
  children,
}: {
  record: WorkspaceRecord;
  selected: boolean;
  onSelect: (key: string, checked: boolean) => void;
  children?: ReactNode;
}) {
  const t = useStrings();
  return (
    <Card className="gap-3 py-4 shadow-none">
      <CardContent className="space-y-3 px-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            aria-label={`${t.select_record} ${record.label}`}
            onCheckedChange={(checked) =>
              onSelect(record.key, Boolean(checked))
            }
          />
          <a
            href={record.url}
            className="min-w-0 break-words text-sm font-medium hover:underline"
          >
            <bdi>{record.label}</bdi>
          </a>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function KanbanView({
  workspace,
  selected,
  onSelect,
}: {
  workspace: WorkspaceDescriptor;
  selected: Set<string>;
  onSelect: (key: string, checked: boolean) => void;
}) {
  const { data } = useApp();
  const t = useStrings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const move = async (record: WorkspaceRecord, value: string) => {
    if (busy || value === record.group || !record.can_move) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("csrfmiddlewaretoken", data.csrf);
    body.set("pk", record.key);
    body.set("value", value);
    body.set("expected", record.group);
    try {
      await workspaceRequest(workspace.move_url, body);
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  const known = new Set(workspace.groups.map((g) => g.value));
  const groups = [
    ...workspace.groups,
    ...(workspace.records.some((r) => !known.has(r.group))
      ? [{ value: "__unassigned", label: t.unassigned }]
      : []),
  ];
  return (
    <div className="space-y-3" aria-busy={busy}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map((group) => {
          const records = workspace.records.filter((r) =>
            group.value === "__unassigned"
              ? !known.has(r.group)
              : r.group === group.value,
          );
          return (
            <section
              key={group.value}
              aria-label={group.label}
              className="min-w-0 rounded-xl border bg-muted/30 p-3 space-y-3"
              onDragOver={(e) => {
                if (!busy && group.value !== "__unassigned") e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const record = workspace.records.find(
                  (r) => r.key === e.dataTransfer.getData("text/plain"),
                );
                if (record) void move(record, group.value);
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{group.label}</h2>
                <Badge variant="secondary">{records.length}</Badge>
              </div>
              {records.map((record) => (
                <div
                  key={record.key}
                  draggable={record.can_move && !busy}
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", record.key)
                  }
                >
                  <RecordCard
                    record={record}
                    selected={selected.has(record.key)}
                    onSelect={onSelect}
                  >
                    {record.can_move && (
                      <Select
                        value={record.group}
                        items={workspace.groups}
                        disabled={busy}
                        onValueChange={(value) => {
                          if (value !== null) void move(record, value);
                        }}
                      >
                        <SelectTrigger
                          aria-label={`${t.move_record} ${record.label}`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                          dir={data.direction}
                          alignItemWithTrigger={false}
                        >
                          {workspace.groups.map((g) => (
                            <SelectItem key={g.value} value={g.value}>
                              {g.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </RecordCard>
                </div>
              ))}
              {!records.length && (
                <p className="p-4 text-xs text-muted-foreground">
                  {t.no_results}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarView({
  workspace,
  selected,
  onSelect,
}: {
  workspace: WorkspaceDescriptor;
  selected: Set<string>;
  onSelect: (key: string, checked: boolean) => void;
}) {
  const { data, calendar } = useApp();
  const t = useStrings();
  const dated = workspace.records.filter((r) => r.date && parseDate(r.date));
  const [day, setDay] = useState<Date | undefined>(() =>
    dated[0]?.date ? parseDate(dated[0].date) : new Date(),
  );
  const [month, setMonth] = useState<Date | undefined>(day);
  const [undated, setUndated] = useState(false);
  const Pick = calendar === "jalali" ? PersianCalendar : Calendar;
  const locale =
    calendar === "jalali"
      ? data.language.startsWith("fa")
        ? faJalali
        : enJalali
      : data.language.startsWith("fa")
        ? faIR
        : data.language.startsWith("ar")
          ? ar
          : enUS;
  const dateLabel = day?.toLocaleDateString(
    `${data.language}-u-ca-${calendar === "jalali" ? "persian" : "gregory"}`,
    { dateStyle: "full" },
  );
  const records = workspace.records.filter((r) =>
    undated ? !r.date : r.date === (day ? canonicalDate(day) : ""),
  );
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[auto_1fr]">
      <Card className="shadow-none">
        <CardContent>
          <Pick
            mode="single"
            selected={undated ? undefined : day}
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              setDay(date);
              setUndated(false);
            }}
            locale={locale}
            dir={data.direction}
            modifiers={{ events: dated.map((r) => parseDate(r.date!)!) }}
            modifiersClassNames={{
              events:
                "font-bold underline decoration-primary decoration-2 underline-offset-4",
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => setUndated(true)}
          >
            {t.undated} ({workspace.records.filter((r) => !r.date).length})
          </Button>
        </CardContent>
      </Card>
      <section className="space-y-3">
        <h2 className="font-semibold">{undated ? t.undated : dateLabel}</h2>
        {records.map((record) => (
          <RecordCard
            key={record.key}
            record={record}
            selected={selected.has(record.key)}
            onSelect={onSelect}
          />
        ))}
        {!records.length && (
          <p className="rounded-xl border p-8 text-sm text-muted-foreground">
            {t.no_results}
          </p>
        )}
      </section>
    </div>
  );
}

interface Comparison {
  records: {
    key: string;
    label: string;
    fields: { name: string; label: string; value: string }[];
  }[];
}
export function CompareRecords({
  url,
  selected,
}: {
  url: string;
  selected: Set<string>;
}) {
  const t = useStrings();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<Comparison>();
  const [error, setError] = useState("");
  const [onlyDifferent, setOnlyDifferent] = useState(false);
  const compare = async () => {
    setOpen(true);
    setResult(undefined);
    setError("");
    const endpoint = new URL(url, window.location.origin);
    selected.forEach((key) => endpoint.searchParams.append("pk", key));
    try {
      setResult(await workspaceRequest<Comparison>(endpoint.href));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <>
      <Button
        variant="outline"
        disabled={selected.size !== 2}
        onClick={() => void compare()}
      >
        <GitCompareIcon />
        {t.compare}
      </Button>
      <ReviewDialog
        title={t.compare}
        description={t.compare_description}
        open={open}
        onClose={() => setOpen(false)}
      >
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!result && !error && <p role="status">{t.loading}</p>}
        {result && (
          <>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={onlyDifferent}
                onCheckedChange={(v) => setOnlyDifferent(Boolean(v))}
              />
              {t.only_differences}
            </label>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.field}</TableHead>
                    {result.records.map((r) => (
                      <TableHead key={r.key}>{r.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.records[0].fields.map((field) => {
                    const other = result.records[1].fields.find(
                      (f) => f.name === field.name,
                    );
                    const different = field.value !== other?.value;
                    return (
                      (!onlyDifferent || different) && (
                        <TableRow
                          key={field.name}
                          className={different ? "bg-accent/60" : ""}
                        >
                          <TableHead>
                            {field.label}
                            {different && (
                              <Badge variant="outline" className="ms-2">
                                {t.changed}
                              </Badge>
                            )}
                          </TableHead>
                          <TableCell className="max-w-64 whitespace-normal break-words">
                            {field.value || "—"}
                          </TableCell>
                          <TableCell className="max-w-64 whitespace-normal break-words">
                            {other?.value || "—"}
                          </TableCell>
                        </TableRow>
                      )
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </ReviewDialog>
    </>
  );
}

interface RelationResult {
  record: { key: string; label: string; url: string };
  groups: {
    name: string;
    label: string;
    truncated: boolean;
    records: {
      key: string;
      label: string;
      url: string;
      explore_url: string | null;
    }[];
  }[];
}
export function RelationshipExplorer({
  url,
  objectKey,
}: {
  url: string;
  objectKey: string;
}) {
  const t = useStrings();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<RelationResult>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [trail, setTrail] = useState<
    { url: string; key: string; label: string }[]
  >([]);
  const load = async (endpoint: string, key: string, history: typeof trail) => {
    setOpen(true);
    setBusy(true);
    setError("");
    const target = new URL(endpoint, window.location.origin);
    target.searchParams.set("pk", key);
    try {
      const next = await workspaceRequest<RelationResult>(target.href);
      setResult(next);
      setTrail([...history, { url: endpoint, key, label: next.record.label }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => void load(url, objectKey, [])}
      >
        <NetworkIcon />
        {t.relationships}
      </Button>
      <ReviewDialog
        title={t.relationships}
        description={t.relationships_description}
        open={open}
        onClose={() => setOpen(false)}
      >
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {busy && <p role="status">{t.loading}</p>}
        <nav aria-label={t.relationships} className="flex flex-wrap gap-1">
          {trail.map((node, i) => (
            <Button
              disabled={busy}
              type="button"
              variant="ghost"
              size="sm"
              key={i}
              onClick={() => void load(node.url, node.key, trail.slice(0, i))}
            >
              {node.label}
            </Button>
          ))}
        </nav>
        {result && (
          <div className="space-y-5">
            <div className="rounded-xl border-2 border-primary/30 bg-accent p-4 text-center font-semibold">
              <a href={result.record.url} className="hover:underline">
                {result.record.label}
              </a>
            </div>
            <div className="mx-auto h-5 w-px bg-border" />
            <div className="grid gap-4 sm:grid-cols-2">
              {result.groups.map((group) => (
                <Card key={group.name} className="shadow-none">
                  <CardHeader>
                    <CardTitle>{group.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.records.map((record) => (
                      <div
                        key={record.key}
                        className="flex items-center justify-between gap-2 rounded-lg border p-2"
                      >
                        <a
                          href={record.url}
                          className="min-w-0 break-words text-sm hover:underline"
                        >
                          {record.label}
                        </a>
                        {record.explore_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy}
                            aria-label={`${t.explore} ${record.label}`}
                            onClick={() =>
                              void load(record.explore_url!, record.key, trail)
                            }
                          >
                            <NetworkIcon />
                          </Button>
                        )}
                      </div>
                    ))}
                    {!group.records.length && (
                      <p className="text-xs text-muted-foreground">
                        {t.no_results}
                      </p>
                    )}
                    {group.truncated && (
                      <p className="text-xs text-muted-foreground">
                        {t.relations_limit}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {!result.groups.length && (
              <p className="text-sm text-muted-foreground">{t.no_results}</p>
            )}
          </div>
        )}
      </ReviewDialog>
    </>
  );
}

export interface ActionPreview {
  label: string;
  count: number;
  exact_changes: boolean;
  token: string;
  records: {
    key: string;
    label: string;
    changes: { label: string; before: string; after: string }[];
  }[];
}
export function ActionReview({
  preview,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  preview: ActionPreview | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useStrings();
  return (
    <ReviewDialog
      title={t.review_action}
      description={
        preview ? `${preview.label} · ${preview.count} ${t.records}` : t.loading
      }
      open={Boolean(preview || busy || error)}
      onClose={onClose}
      onConfirm={preview && !busy ? onConfirm : undefined}
      busy={busy}
    >
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {preview && (
        <>
          {!preview.exact_changes && (
            <Alert>
              <AlertDescription>{t.action_preview_notice}</AlertDescription>
            </Alert>
          )}
          <div className="max-h-80 overflow-auto space-y-2">
            {preview.records.map((record) => (
              <div className="rounded-lg border p-3" key={record.key}>
                <p className="font-medium">{record.label}</p>
                {record.changes.map((change, i) => (
                  <p key={i} className="mt-1 text-sm text-muted-foreground">
                    {change.label}: <bdi>{change.before}</bdi> →{" "}
                    <bdi>{change.after}</bdi>
                  </p>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </ReviewDialog>
  );
}
