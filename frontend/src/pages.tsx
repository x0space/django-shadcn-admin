import { useState, useRef, lazy, Suspense } from "react";
import { useFormReview } from "./review";
import { WorkspaceToolbar, useWorkspaceViews, KanbanView, CalendarView, ActionReview, workspaceRequest, type ActionPreview } from "./workspace";
import {
  ArrowUpDownIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  ClockIcon,
} from "lucide-react";

import type { DashboardPage, DeletePage, HistoryPage, ListPage } from "./types";
import { useApp, useStrings } from "./context";
import { Csrf } from "./adapters/forms";
import { FormField, NativeHtml } from "./adapters/fields";
import { Button, buttonVariants } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
import { Checkbox } from "./components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "./components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "./components/ui/empty";
const DashboardChart = lazy(() => import("./dashboard-chart"));
import { Separator } from "./components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "./components/ui/pagination";

export function NoRecords({ activity = false }: { activity?: boolean }) {
  const t = useStrings();
  return (
    <Empty className="border-0 py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {activity ? <ClockIcon /> : <LayersIcon />}
        </EmptyMedia>
        <EmptyTitle>{t.empty}</EmptyTitle>
        <EmptyDescription>
          {activity ? t.activity_empty : t.empty_description}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
export function Dashboard({ page }: { page: DashboardPage }) {
  const { data } = useApp();
  const t = useStrings();
  const models = data.navigation.flatMap((app) => app.models);
  const metrics = page.widgets.filter((w) => w.kind === "metric");
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.length ? (
          metrics.map((widget, i) => (
            <Card key={i} className="shadow-none">
              <CardHeader>
                <CardDescription>{widget.url ? <a href={widget.url} className="inline-flex items-center gap-2 hover:underline">{widget.title}<ArrowUpRightIcon className="size-3" /></a> : widget.title}</CardDescription>
                <CardTitle className="text-3xl tracking-tight">
                  {widget.url ? <a href={widget.url} aria-label={`${widget.title}: ${widget.value}`} className="hover:underline"><bdi>{widget.value}</bdi></a> : <bdi>{widget.value}</bdi>}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {widget.description}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="shadow-none">
            <CardHeader>
              <CardDescription>{t.models}</CardDescription>
              <CardTitle className="text-3xl">
                {models.length.toLocaleString(data.language)}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>
      {page.widgets
        .filter((w) => w.kind === "chart")
        .map((widget, index) => (
          <Card key={index} className="shadow-none">
            <CardHeader>
              <CardTitle>{widget.url ? <a href={widget.url} className="hover:underline">{widget.title}</a> : widget.title}</CardTitle>
              <CardDescription>{widget.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-64 animate-pulse rounded-lg bg-muted" />
                }
              >
                <DashboardChart widget={widget} direction={data.direction} />
              </Suspense>
            </CardContent>
          </Card>
        ))}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t.models}</CardTitle>
            <CardDescription>{data.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {models.map((model) => (
              <a
                key={model.url}
                href={model.url}
                className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="rounded-lg bg-muted p-2">
                  <LayersIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {model.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.manage}
                  </span>
                </span>
                <ArrowUpRightIcon className="size-4 text-muted-foreground rtl:-rotate-90" />
              </a>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t.recent}</CardTitle>
          </CardHeader>
          <CardContent>
            {page.recent.length ? (
              <div className="space-y-5">
                {page.recent.map((entry, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <CheckCircle2Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <a
                        href={entry.url}
                        className="text-sm font-medium hover:underline"
                      >
                        <bdi>{entry.label}</bdi>
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {entry.message}
                      </p>
                      <time className="mt-1 block text-xs text-muted-foreground">
                        {new Date(entry.time).toLocaleString(data.language)}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <NoRecords activity />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ModelList({ page }: { page: ListPage }) {
  const t = useStrings();
  const { data } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [all, setAll] = useState(false);
  const views = useWorkspaceViews(page);
  const actionForm = useRef<HTMLFormElement>(null);
  const actionConfirmed = useRef(false);
  const pendingAction = useRef<FormData | null>(null);
  const [preview, setPreview] = useState<ActionPreview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [reviewToken, setReviewToken] = useState("");
  const review = useFormReview(actionForm, page.rows.flatMap((row) => row.cells.flatMap((cell) => cell.field ? [cell.field] : [])));
  const selectRecord = (key: string, checked: boolean) => {
    setAll(false); setReviewToken(""); setSelected((previous) => {const next = new Set(previous); checked ? next.add(key) : next.delete(key); return next;});
  };
  const visibleColumn = (index: number) => page.headers[index]?.checkbox || page.editable && page.rows.some((row) => row.cells[index]?.field) || views.columns.includes(index);
  const confirmAction = () => {
    if (!preview || !actionForm.current || !pendingAction.current) return;
    // Selection/action cannot silently change between preview and confirmation.
    const current = new FormData(actionForm.current);
    if (["action", "select_across", "_selected_action"].some((name) => JSON.stringify(current.getAll(name)) !== JSON.stringify(pendingAction.current!.getAll(name)))) {
      setPreview(null); setPreviewError(t.selection_changed); return;
    }
    actionConfirmed.current = true;
    const token = actionForm.current.querySelector<HTMLInputElement>('input[name="_shadcn_review"]');
    if (token) token.value = preview.token;
    // React state is committed after the native submit event; set the token on the DOM first.
    actionForm.current.requestSubmit();
  };
  return (
    <div className="space-y-5">
      <WorkspaceToolbar page={page} views={views} selected={selected} />
      <div className="flex flex-wrap items-center gap-3">
        {page.search_enabled && (
          <form method="get" className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute start-3 top-2 size-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={page.search}
                placeholder={t.search}
                aria-label={t.search}
                className="ps-9"
              />
              {page.search_hidden.map((field, index) => (
                <input key={index} type="hidden" {...field} />
              ))}
            </div>
            <Button variant="outline" type="submit">
              {t.go}
            </Button>
          </form>
        )}
        {page.add_url && (
          <a
            className={buttonVariants({ className: "ms-auto" })}
            href={page.add_url}
          >
            <PlusIcon />
            {t.add}
          </a>
        )}
      </div>
      {page.filters.length > 0 && (
        <Card className="shadow-none">
          <CardContent className="flex flex-wrap items-start gap-5 py-4">
            {page.filters.map((filter, index) => (
              <div key={index} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {filter.title}
                </p>
                <Select
                  value={filter.choices.find((c) => c.selected)?.url ?? null}
                  items={filter.choices.map((choice) => ({
                    value: choice.url,
                    label: choice.label,
                  }))}
                  onValueChange={(value) => {
                    if (value !== null) window.location.href = value;
                  }}
                >
                  <SelectTrigger aria-label={filter.title}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    dir={data.direction}
                    alignItemWithTrigger={false}
                  >
                    {filter.choices.map((choice, i) => (
                      <SelectItem key={i} value={choice.url}>
                        {choice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <a
              href={page.clear_url}
              className="mt-6 text-xs text-muted-foreground hover:underline"
            >
              {t.clear}
            </a>
          </CardContent>
        </Card>
      )}
      <form ref={actionForm} method="post" encType="multipart/form-data" className="space-y-4"
        onSubmit={(event) => {
          if (actionConfirmed.current) {actionConfirmed.current = false; return;}
          const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          const body = new FormData(event.currentTarget);
          if (submitter?.name === "_save" || body.has("_save")) {review.intercept(event); return;}
          if (!page.workspace || !body.get("action")) return;
          event.preventDefault(); pendingAction.current = body; setPreview(null); setPreviewBusy(true); setPreviewError("");
          const endpoint = new URL(page.workspace.preview_url, window.location.origin); endpoint.search = window.location.search;
          void workspaceRequest<ActionPreview>(endpoint.href, body).then(setPreview).catch((e: Error) => setPreviewError(e.message)).finally(() => setPreviewBusy(false));
        }}>
        <Csrf />
        <input type="hidden" name="_shadcn_review" value={reviewToken} />
        <input type="hidden" name="index" value="0" />
        {Array.from(selected).map((key) => <input key={key} type="hidden" name="_selected_action" value={key} />)}
        {review.dialog}
        <ActionReview preview={preview} busy={previewBusy} error={previewError} onClose={() => {setPreview(null); setPreviewError("");}} onConfirm={confirmAction} />
        <NativeHtml html={page.management} />
        {page.actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Select
              name="action"
              defaultValue=""
              items={[{ value: "", label: t.actions }, ...page.actions]}
            >
              <SelectTrigger aria-label={t.actions}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={data.direction} alignItemWithTrigger={false}>
                <SelectItem value="">{t.actions}</SelectItem>
                {page.actions.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline" disabled={previewBusy || selected.size === 0}>
              {t.go}
            </Button>
            <input type="hidden" name="select_across" value={all ? "1" : "0"} />
            <Badge variant="secondary">
              {all ? page.count : selected.size} {t.selected}
            </Badge>
            {selected.size > 0 && page.count > page.rows.length && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAll(!all)}
              >
                {t.select_all}
              </Button>
            )}
          </div>
        )}
        {page.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>{page.errors.join(" ")}</AlertDescription>
          </Alert>
        )}
        <div className={`min-w-0 overflow-x-auto rounded-xl border bg-card ${views.view !== "table" ? "hidden" : ""}`}>
          <Table>
            <TableHeader>
              <TableRow>
                {page.workspace && !page.headers.some((header) => header.checkbox) && <TableHead><Checkbox aria-label={t.select_all} checked={selected.size === page.rows.length && page.rows.length > 0} onCheckedChange={(checked) => {setSelected(checked ? new Set(page.rows.map((row) => row.key)) : new Set()); setAll(false);}} /></TableHead>}
                {page.headers.map((header, index) => (
                  <TableHead key={index} className={visibleColumn(index) ? "" : "hidden"}>
                    {header.checkbox ? (
                      <Checkbox
                        aria-label={t.select_all}
                        checked={
                          selected.size === page.rows.length &&
                          page.rows.length > 0
                        }
                        onCheckedChange={(checked) => {
                          setSelected(
                            checked
                              ? new Set(page.rows.map((row) => row.key))
                              : new Set(),
                          );
                          setAll(false);
                        }}
                      />
                    ) : header.url ? (
                      <a
                        href={header.url}
                        className="inline-flex items-center gap-2"
                      >
                        {header.label}
                        <ArrowUpDownIcon className="size-3" />
                      </a>
                    ) : (
                      header.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.map((row) => (
                <TableRow key={row.key}>
                  {page.workspace && !page.headers.some((header) => header.checkbox) && <TableCell><Checkbox checked={selected.has(row.key)} aria-label={`${t.select_record} ${row.key}`} onCheckedChange={(checked) => selectRecord(row.key, Boolean(checked))} /></TableCell>}
                  {row.cells.map((cell, index) => (
                    <TableCell key={index} className={visibleColumn(index) ? "" : "hidden"}>
                      {page.headers[index]?.checkbox ? (
                        <Checkbox
                          value={row.key}
                          aria-label={`${t.actions} ${row.key}`}
                          checked={selected.has(row.key)}
                          onCheckedChange={(checked) => selectRecord(row.key, Boolean(checked))}
                        />
                      ) : cell.field ? (
                        <FormField field={cell.field} />
                      ) : (
                        <span
                          className="[&_a]:font-medium [&_a]:hover:underline"
                          dangerouslySetInnerHTML={{ __html: cell.html }}
                        />
                      )}
                      {index === 0 &&
                        row.hidden.map((html, i) => (
                          <NativeHtml key={i} html={html} />
                        ))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!page.rows.length && <NoRecords />}
        </div>
        {views.view === "kanban" && page.workspace && <KanbanView workspace={page.workspace} selected={selected} onSelect={selectRecord} />}
        {views.view === "calendar" && page.workspace && <CalendarView workspace={page.workspace} selected={selected} onSelect={selectRecord} />}
        {page.editable && views.view === "table" && (
          <Button type="submit" name="_save" value="1">
            {t.save}
          </Button>
        )}
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {page.count.toLocaleString(data.language)} {t.records}
        </p>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            {page.pages.map((page, index) => (
              <PaginationItem key={index}>
                {page.url ? (
                  <PaginationLink href={page.url} isActive={page.current}>
                    {page.label}
                  </PaginationLink>
                ) : (
                  <span>{page.label}</span>
                )}
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
export function DeleteConfirmation({ page }: { page: DeletePage }) {
  const t = useStrings();
  return (
    <Card className="max-w-3xl shadow-none">
      <CardHeader>
        <CardTitle>{t.confirm_delete}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/30 p-5 text-sm [&_ul]:list-inside [&_ul]:list-disc">
          <NativeHtml html={page.objects_html} />
        </div>
        {page.blocked ? (
          <Alert variant="destructive">
            <AlertTitle>{t.protected}</AlertTitle>
            <AlertDescription>{page.protected.join(", ")}</AlertDescription>
          </Alert>
        ) : (
          <form method="post" className="flex gap-2">
            <Csrf />
            <input type="hidden" name="post" value="yes" />
            {page.action && (
              <>
                <input type="hidden" name="action" value={page.action} />
                <input
                  type="hidden"
                  name="select_across"
                  value={page.select_across}
                />
                {page.selected.map((key) => (
                  <input
                    key={key}
                    type="hidden"
                    name="_selected_action"
                    value={key}
                  />
                ))}
              </>
            )}
            <Button variant="destructive" type="submit">
              <Trash2Icon />
              {t.delete}
            </Button>
            <a
              className={buttonVariants({ variant: "outline" })}
              href={page.cancel_url}
            >
              {t.cancel}
            </a>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
export function History({ page }: { page: HistoryPage }) {
  const { data } = useApp();
  return (
    <Card className="shadow-none">
      <CardContent className="pt-6">
        {page.rows.length ? (
          page.rows.map((row, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-start gap-4 py-5">
                <Badge variant="outline">
                  <bdi>{row.user}</bdi>
                </Badge>
                <p className="flex-1 text-sm">{row.message}</p>
                <time className="text-xs text-muted-foreground">
                  {new Date(row.date).toLocaleString(data.language)}
                </time>
              </div>
              <Separator />
            </div>
          ))
        ) : (
          <NoRecords activity />
        )}
      </CardContent>
    </Card>
  );
}
