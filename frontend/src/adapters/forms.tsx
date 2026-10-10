import { useEffect, useRef, useState, useId } from "react";
import { PlusIcon, SaveIcon, Trash2Icon, EllipsisIcon } from "lucide-react";
import { useApp, useStrings } from "../context";
import type {
  FormPage,
  FieldsetDescriptor,
  InlineDescriptor,
  InlineRow,
} from "../types";
import { FormField, NativeHtml } from "./fields";
import { RelationshipExplorer } from "../workspace";
import { useFormReview } from "../review";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button, buttonVariants } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";

export function Csrf() {
  return (
    <input
      type="hidden"
      name="csrfmiddlewaretoken"
      value={useApp().data.csrf}
    />
  );
}
export function Fieldsets({ groups }: { groups: FieldsetDescriptor[] }) {
  const t = useStrings();
  return groups.map((group, index) => {
    const content = (
      <CardContent className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {group.description && (
          <NativeHtml
            html={group.description}
            className="text-sm text-muted-foreground sm:col-span-2"
          />
        )}
        {group.lines.map((line, i) => (
          <div
            key={i}
            className={
              line.length > 1
                ? "grid gap-5 sm:col-span-2 sm:grid-cols-2"
                : line.some((field) =>
                      ["textarea", "native", "readonly"].includes(field.widget),
                    )
                  ? "grid min-w-0 gap-5 sm:col-span-2"
                  : "grid min-w-0 gap-5"
            }
          >
            {line.map((field) => (
              <FormField key={field.name} field={field} />
            ))}
          </div>
        ))}
      </CardContent>
    );
    return (
      <Card key={index} className="shadow-none admin-form-card">
        {group.collapsed ? (
          <Collapsible>
            <CardHeader>
              <CollapsibleTrigger className="text-start font-medium">
                {group.name || t.details}
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>{content}</CollapsibleContent>
          </Collapsible>
        ) : (
          <>
            <CardHeader>
              <CardTitle>{group.name || t.details}</CardTitle>
            </CardHeader>
            {content}
          </>
        )}
      </Card>
    );
  });
}
function InlineFormset({ inline }: { inline: InlineDescriptor }) {
  const [rows, setRows] = useState(inline.rows);
  const container = useRef<HTMLDivElement>(null);
  const t = useStrings();
  useEffect(() => {
    const total = container.current?.querySelector<HTMLInputElement>(
      `input[name="${inline.prefix}-TOTAL_FORMS"]`,
    );
    if (total) total.value = String(rows.length);
  }, [rows, inline.prefix]);
  const add = () => {
    const row = JSON.parse(
      JSON.stringify(inline.empty).replaceAll(
        "__prefix__",
        String(rows.length),
      ),
    ) as InlineRow;
    setRows([...rows, row]);
  };
  return (
    <section ref={container} className="space-y-4" aria-label={inline.name}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{inline.name}</h2>
        {inline.can_add && rows.length < inline.max && (
          <Button type="button" variant="outline" onClick={add}>
            <PlusIcon />
            {t.add_row}
          </Button>
        )}
      </div>
      <NativeHtml html={inline.management} />
      {inline.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>{inline.errors.join(" ")}</AlertDescription>
        </Alert>
      )}
      {rows.map((row, i) => (
        <div key={i} className="space-y-3 rounded-xl border bg-muted/30 p-4">
          {row.label && (
            <h3 className="text-sm font-medium">
              <bdi>{row.label}</bdi>
            </h3>
          )}
          {row.hidden.map((html, k) => (
            <NativeHtml key={k} html={html} />
          ))}
          <Fieldsets groups={row.fields} />
        </div>
      ))}
    </section>
  );
}
export function AdminForm({ page }: { page: FormPage }) {
  const t = useStrings();
  const { data } = useApp();
  const formId = useId();
  const form = useRef<HTMLFormElement>(null);
  const dirty = useRef(new Set<string>());
  const reviewFields = [
    ...page.fieldsets.flatMap((group) => group.lines.flat()),
    ...page.inlines.flatMap((inline) => [
      ...inline.rows.flatMap((row, index) =>
        row.fields.flatMap((group) =>
          group.lines
            .flat()
            .map((field) => ({
              ...field,
              label: `${inline.name} ${index + 1} · ${field.label}`,
            })),
        ),
      ),
      ...inline.empty.fields.flatMap((group) =>
        group.lines
          .flat()
          .map((field) => ({
            ...field,
            label: `${inline.name} · ${field.label}`,
          })),
      ),
    ]),
  ];
  const review = useFormReview(form, reviewFields);
  useEffect(() => {
    if (page.has_errors)
      form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [page.has_errors]);
  return (
    <form
      ref={form}
      id={formId}
      method="post"
      encType={page.multipart ? "multipart/form-data" : undefined}
      className="space-y-6"
      onSubmit={review.intercept}
      onInput={(event) => {
        const target = event.target as HTMLInputElement;
        dirty.current.add(target.name);
        for (const entry of page.prepopulated) {
          if (
            entry.sources.includes(target.name) &&
            !dirty.current.has(entry.target)
          ) {
            const input = form.current?.elements.namedItem(
              entry.target,
            ) as HTMLInputElement | null;
            if (input)
              input.value = entry.sources
                .map(
                  (name) =>
                    (
                      form.current?.elements.namedItem(
                        name,
                      ) as HTMLInputElement | null
                    )?.value || "",
                )
                .join(" ")
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9\s_-]/g, "")
                .trim()
                .replace(/[\s-]+/g, "-")
                .toLowerCase();
          }
        }
      }}
    >
      <Csrf />
      {review.dialog}
      {page.relations_url && page.object_key && (
        <RelationshipExplorer
          url={page.relations_url}
          objectKey={page.object_key}
        />
      )}
      {page.hidden.map((html, i) => (
        <NativeHtml key={i} html={html} />
      ))}
      {page.has_errors && (
        <Alert variant="destructive">
          <AlertTitle>{t.errors}</AlertTitle>
          <AlertDescription>{page.errors.join(" ")}</AlertDescription>
        </Alert>
      )}
      <Fieldsets groups={page.fieldsets} />
      {page.inlines.map((inline) => (
        <InlineFormset key={inline.prefix} inline={inline} />
      ))}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-card/95 p-4 shadow-sm backdrop-blur-sm">
        {page.buttons.show_save && (
          <Button type="submit" name="_save" value="1">
            <SaveIcon />
            {t.save}
          </Button>
        )}
        {page.buttons.show_save_and_continue && (
          <Button
            className="hidden sm:inline-flex"
            type="submit"
            variant="outline"
            name="_continue"
            value="1"
          >
            {t.save_continue}
          </Button>
        )}
        {page.buttons.show_save_and_add_another && (
          <Button
            className="hidden sm:inline-flex"
            type="submit"
            variant="outline"
            name="_addanother"
            value="1"
          >
            {t.save_add}
          </Button>
        )}
        <a
          className={buttonVariants({ variant: "ghost" })}
          href={page.cancel_url}
        >
          {t.cancel}
        </a>
        {(page.buttons.show_save_and_continue ||
          page.buttons.show_save_and_add_another ||
          page.delete_url) && (
          <div className="ms-auto sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t.actions}
                  />
                }
              >
                <EllipsisIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent dir={data.direction} align="end">
                <DropdownMenuGroup>
                  {page.buttons.show_save_and_continue && (
                    <DropdownMenuItem
                      render={
                        <Button
                          type="submit"
                          variant="ghost"
                          form={formId}
                          name="_continue"
                          value="1"
                        />
                      }
                    >
                      {t.save_continue}
                    </DropdownMenuItem>
                  )}
                  {page.buttons.show_save_and_add_another && (
                    <DropdownMenuItem
                      render={
                        <Button
                          type="submit"
                          variant="ghost"
                          form={formId}
                          name="_addanother"
                          value="1"
                        />
                      }
                    >
                      {t.save_add}
                    </DropdownMenuItem>
                  )}
                  {page.delete_url && (
                    <DropdownMenuItem
                      variant="destructive"
                      render={<a href={page.delete_url} />}
                    >
                      {t.delete}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {page.delete_url && (
          <a
            className={buttonVariants({
              variant: "destructive",
              className: "ms-auto hidden sm:inline-flex",
            })}
            href={page.delete_url}
          >
            <Trash2Icon />
            {t.delete}
          </a>
        )}
      </div>
    </form>
  );
}
