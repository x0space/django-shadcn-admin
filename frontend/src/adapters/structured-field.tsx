import { useEffect, useRef, useState } from "react";
import {
  BracesIcon,
  ListIcon,
  PlusIcon,
  XIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ImageIcon,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { useDirection } from "../components/ui/direction";
import { useFieldText } from "./field-text";
import type { FieldDescriptor } from "../types";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
const defaults: Record<string, Json> = {
  string: "",
  number: 0,
  boolean: false,
  null: null,
  array: [],
  object: {},
};
const kind = (value: Json) =>
  value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
export function imageUrl(value: string) {
  // Do not turn arbitrary JSON strings into executable/data URLs.
  return /^(https?:\/\/|\/(?!\/))/.test(value) ? value : undefined;
}
function NodeEditor({
  value,
  onChange,
  label,
  disabled,
  gallery = false,
  depth = 0,
}: {
  value: Json;
  onChange: (value: Json) => void;
  label: string;
  disabled?: boolean;
  gallery?: boolean;
  depth?: number;
}) {
  const t = useFieldText();
  const direction = useDirection();
  const type = kind(value);
  const [property, setProperty] = useState("");
  const isArray = Array.isArray(value);
  const container = type === "array" || type === "object";
  const entries: [string, Json][] = isArray
    ? value.map((item, index) => [String(index), item])
    : type === "object"
      ? Object.entries(value!)
      : [];
  const update = (key: string, next: Json) =>
    onChange(
      isArray
        ? value.map((item, index) => (String(index) === key ? next : item))
        : Object.fromEntries(
            entries.map(([name, item]) => [name, name === key ? next : item]),
          ),
    );
  const remove = (key: string) =>
    onChange(
      isArray
        ? value.filter((_, index) => String(index) !== key)
        : Object.fromEntries(entries.filter(([name]) => name !== key)),
    );
  const move = (index: number, step: number) => {
    if (!isArray) return;
    const next = [...value];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    onChange(next);
  };
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={type}
          disabled={disabled}
          items={Object.keys(defaults).map((value) => ({
            value,
            label: t[value as keyof typeof t],
          }))}
          onValueChange={(next) => {
            if (next) onChange(defaults[next]);
          }}
        >
          <SelectTrigger
            aria-label={`${label} — ${t.type}`}
            className="w-32 shrink-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir={direction} alignItemWithTrigger={false}>
            {Object.keys(defaults).map((item) => (
              <SelectItem key={item} value={item}>
                {t[item as keyof typeof t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {container && (
          <Badge variant="secondary">
            {entries.length} {t.items}
          </Badge>
        )}
        {type === "string" && (
          <Input
            aria-label={label}
            disabled={disabled}
            value={String(value)}
            dir={gallery ? "ltr" : "auto"}
            placeholder={gallery ? t.image : t.value}
            className="min-w-24 flex-1"
            onChange={(event) => onChange(event.target.value)}
          />
        )}
        {type === "number" && (
          <NumberValue
            label={label}
            disabled={disabled}
            value={Number(value)}
            onChange={onChange}
          />
        )}
        {type === "boolean" && (
          <label className="flex items-center gap-2">
            <Checkbox
              aria-label={label}
              disabled={disabled}
              checked={Boolean(value)}
              onCheckedChange={(next) => onChange(next === true)}
            />
            <span dir="ltr">{String(value)}</span>
          </label>
        )}
      </div>
      {gallery && typeof value === "string" && imageUrl(value) && (
        <img
          src={imageUrl(value)}
          alt=""
          loading="lazy"
          className="size-20 rounded-lg border object-cover"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
      {container && (
        <div className="space-y-3 border-s-2 border-border ps-3 sm:ps-4">
          {!entries.length && (
            <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
              {t.empty}
            </p>
          )}
          {entries.map(([key, item], index) => (
            <div
              key={key}
              className="space-y-2 rounded-lg border bg-background/60 p-3"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {isArray ? (
                  <Badge variant="outline">{index + 1}</Badge>
                ) : (
                  <Input
                    aria-label={`${label} — ${t.key} ${key}`}
                    disabled={disabled}
                    defaultValue={key}
                    className="min-w-24 flex-1 font-mono"
                    dir="ltr"
                    onBlur={(event) => {
                      const name = event.target.value;
                      if (name === key || entries.some(([k]) => k === name)) {
                        event.target.value = key;
                        return;
                      }
                      onChange(
                        Object.fromEntries(
                          entries.map(([k, v]) => [k === key ? name : k, v]),
                        ),
                      );
                    }}
                  />
                )}
                <div className="ms-auto flex gap-1">
                  {isArray && (
                    <>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`${t.up} ${index + 1}`}
                        disabled={disabled || index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`${t.down} ${index + 1}`}
                        disabled={disabled || index === entries.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDownIcon />
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`${t.remove} ${isArray ? index + 1 : key}`}
                    disabled={disabled}
                    onClick={() => remove(key)}
                  >
                    <XIcon />
                  </Button>
                </div>
              </div>
              {depth < 12 ? (
                <NodeEditor
                  value={item}
                  label={`${label} ${isArray ? index + 1 : key}`}
                  disabled={disabled}
                  gallery={gallery}
                  depth={depth + 1}
                  onChange={(next) => update(key, next)}
                />
              ) : (
                <pre className="overflow-auto text-xs" dir="ltr">
                  {JSON.stringify(item, null, 2)}
                </pre>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {!isArray && (
              <Input
                value={property}
                disabled={disabled}
                aria-label={`${label} — ${t.key}`}
                placeholder={t.key}
                className="min-w-24 flex-1"
                onChange={(event) => setProperty(event.target.value)}
              />
            )}
            <Button
              type="button"
              variant="outline"
              disabled={
                disabled ||
                (!isArray &&
                  (!property || entries.some(([key]) => key === property)))
              }
              onClick={() => {
                onChange(
                  isArray
                    ? [...value, ""]
                    : Object.fromEntries([...entries, [property, ""]]),
                );
                setProperty("");
              }}
            >
              <PlusIcon />
              {isArray ? t.add : t.property}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
function NumberValue({
  value,
  onChange,
  label,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <Input
      aria-label={label}
      disabled={disabled}
      type="number"
      step="any"
      dir="ltr"
      className="min-w-24 flex-1"
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        if (event.target.value && Number.isFinite(event.target.valueAsNumber))
          onChange(event.target.valueAsNumber);
      }}
      onBlur={() => setDraft(String(value))}
    />
  );
}
export function StructuredField({ field }: { field: FieldDescriptor }) {
  const t = useFieldText();
  const arrayField = field.widget === "array";
  const [raw, setRaw] = useState(
    field.raw ?? JSON.stringify(field.value ?? null, null, 2),
  );
  const [value, setValue] = useState<Json>(() =>
    arrayField
      ? ((field.value || []) as Json)
      : ((field.value as Json) ?? null),
  );
  const [mode, setMode] = useState<"editor" | "code">(() => {
    try {
      JSON.parse(raw);
      return "editor";
    } catch {
      return "code";
    }
  });
  const input = useRef<HTMLTextAreaElement>(null);
  let valid = true;
  if (!arrayField) {
    try {
      JSON.parse(raw);
    } catch {
      valid = false;
    }
  }
  const serialized = arrayField
    ? (value as Json[]).map(String).join(field.delimiter || ",")
    : raw;
  useEffect(() => {
    input.current?.setCustomValidity(valid ? "" : t.invalid);
  }, [valid, t.invalid]);
  const change = (next: Json) => {
    setValue(next);
    setRaw(JSON.stringify(next, null, 2));
  };
  const gallery = /images?|photos?|gallery/i.test(field.name);
  return (
    <section
      className="json-editor rounded-xl border bg-muted/20 p-3 sm:p-4"
      aria-label={field.label}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {gallery ? (
          <ImageIcon className="size-4 text-muted-foreground" />
        ) : Array.isArray(value) ? (
          <ListIcon className="size-4 text-muted-foreground" />
        ) : (
          <BracesIcon className="size-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{field.label}</span>
        {!arrayField && (
          <div className="ms-auto flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={mode === "editor" ? "secondary" : "ghost"}
              disabled={!valid}
              onClick={() => {
                setValue(JSON.parse(raw));
                setMode("editor");
              }}
            >
              {t.structured}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "code" ? "secondary" : "ghost"}
              onClick={() => setMode("code")}
            >
              {t.code}
            </Button>
          </div>
        )}
      </div>
      <Textarea
        ref={input}
        id={field.id}
        name={field.name}
        value={serialized}
        disabled={field.disabled}
        aria-label={`${field.label} JSON`}
        aria-invalid={!valid || field.errors.length > 0}
        dir="ltr"
        rows={8}
        className={mode === "code" ? "font-mono text-sm" : "sr-only"}
        onChange={(event) => setRaw(event.target.value)}
        onInvalid={() => setMode("code")}
      />
      {mode === "editor" &&
        (arrayField ? (
          <ArrayEditor
            value={value as Json[]}
            disabled={field.disabled}
            label={field.label}
            onChange={change}
          />
        ) : (
          <NodeEditor
            value={value}
            onChange={change}
            label={field.label}
            disabled={field.disabled}
            gallery={gallery}
          />
        ))}
      {!valid && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {t.invalid}
        </p>
      )}
    </section>
  );
}
function ArrayEditor({
  value,
  onChange,
  label,
  disabled,
}: {
  value: Json[];
  onChange: (next: Json[]) => void;
  label: string;
  disabled?: boolean;
}) {
  const t = useFieldText();
  return (
    <div className="space-y-3">
      {value.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            aria-label={`${label} ${index + 1}`}
            value={String(item)}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                value.map((v, i) => (i === index ? event.target.value : v)),
              )
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={`${t.remove} ${index + 1}`}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      {!value.length && (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => onChange([...value, ""])}
      >
        <PlusIcon />
        {t.add}
      </Button>
    </div>
  );
}
