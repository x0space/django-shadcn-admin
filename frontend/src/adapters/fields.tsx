import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { format } from "date-fns";
import { ar, enUS, faIR } from "date-fns/locale";
import { faIR as faJalali, enUS as enJalali } from "@daypicker/persian";
import { CalendarIcon } from "lucide-react";
import { useApp } from "../context";
import type { FieldDescriptor } from "../types";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useDirection } from "../components/ui/direction";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "../components/ui/field";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Button } from "../components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { PersianCalendar } from "../components/persian-calendar";
import { ShadcnHtml } from "./html-controls";
import { StructuredField } from "./structured-field";
import { FileField } from "./file-field";
import { MultiChoice } from "./multi-choice";
import { StructuredDisplay } from "./structured-display";

type Adapter = (props: { field: FieldDescriptor }) => ReactNode;
const adapters = new Map<string, Adapter>();
const adapterListeners = new Set<() => void>();
let adapterVersion = 0;
export function registerFieldAdapter(name: string, adapter: Adapter) {
  adapters.set(name, adapter);
  adapterVersion += 1;
  adapterListeners.forEach((listener) => listener());
}
function subscribeAdapters(listener: () => void) {
  adapterListeners.add(listener);
  return () => {
    adapterListeners.delete(listener);
  };
}
export function NativeHtml({
  html = "",
  className = "",
  label = "",
}: {
  html?: string;
  className?: string;
  label?: string;
}) {
  // Only HTML produced by Django's trusted widget/template renderer reaches this boundary.
  return <ShadcnHtml html={html} className={className} label={label} />;
}
export function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (character) =>
    String(character.charCodeAt(0) - (character <= "٩" ? 0x660 : 0x6f0)),
  );
}
export function canonicalDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}
export function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return canonicalDate(d) === value ? d : undefined;
}

export function DateControl({
  field,
  submitValue = true,
  onValueChange,
}: {
  field: FieldDescriptor;
  submitValue?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const { calendar, data } = useApp();
  const [value, setValue] = useState(String(field.value || ""));
  const [open, setOpen] = useState(false);
  useEffect(() => setValue(String(field.value || "")), [field.value]);
  const changeValue = (next: string) => {
    setValue(next);
    onValueChange?.(next);
  };
  const selected = parseDate(value);
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
  const Pick = calendar === "jalali" ? PersianCalendar : Calendar;
  return (
    <div className="flex items-center gap-2">
      <Input
        id={field.id}
        aria-label={field.label}
        name={submitValue ? field.name : undefined}
        value={value}
        onChange={(event) => changeValue(normalizeDigits(event.target.value))}
        placeholder="YYYY-MM-DD"
        dir="ltr"
        required={field.required}
        disabled={field.disabled}
        aria-invalid={field.errors.length > 0}
        aria-describedby={`${field.id}-help ${field.id}-error`}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label={`${field.label} — ${data.strings.calendar}`}
              disabled={field.disabled}
            />
          }
        >
          <CalendarIcon />
        </PopoverTrigger>
        <PopoverContent
          dir={data.direction}
          className="w-auto p-0"
          align="start"
        >
          <Pick
            mode="single"
            selected={selected}
            defaultMonth={selected}
            dir={data.direction}
            locale={locale}
            captionLayout="dropdown"
            onSelect={(date) => {
              changeValue(date ? canonicalDate(date) : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SelectControl({ field }: { field: FieldDescriptor }) {
  const direction = useDirection();
  const options = field.choices?.flatMap((group) => group.options) || [];
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(field.value) ? field.value.map(String) : [],
  );
  if (field.multiple)
    return (
      <MultiChoice
        choices={options}
        value={selected}
        onChange={setSelected}
        name={field.name}
        id={field.id}
        label={field.label}
        required={field.required}
        disabled={field.disabled}
        invalid={field.errors.length > 0}
      />
    );
  const initial =
    field.value == null ? (options[0]?.value ?? "") : String(field.value);
  return (
    <Select
      id={field.id}
      name={field.name}
      disabled={field.disabled}
      required={field.required}
      defaultValue={initial}
      items={options}
    >
      <SelectTrigger
        className="w-full min-w-0"
        aria-invalid={field.errors.length > 0}
        aria-describedby={`${field.id}-help ${field.id}-error`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent dir={direction} align="start" alignItemWithTrigger={false}>
        {field.choices?.map((group, index) => (
          <SelectGroup key={index}>
            {group.label && <SelectLabel>{group.label}</SelectLabel>}
            {group.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FormField({ field }: { field: FieldDescriptor }) {
  useSyncExternalStore(
    subscribeAdapters,
    () => adapterVersion,
    () => 0,
  );
  const common = {
    id: field.id,
    name: field.name,
    disabled: field.disabled,
    required: field.required,
    "aria-invalid": field.errors.length > 0,
    "aria-describedby": `${field.id}-help ${field.id}-error`,
  };
  const initial = field.value == null ? "" : String(field.value);
  const Custom = adapters.get(field.widget);
  if (field.widget === "hidden") return <NativeHtml html={field.html} />;
  let control: ReactNode;
  if (Custom) control = <Custom field={field} />;
  else if (field.widget === "readonly" && field.display)
    control = <StructuredDisplay value={field.display.value} />;
  else if (field.widget === "readonly")
    control = (
      <NativeHtml
        html={field.html}
        className="rounded-md bg-muted/50 px-3 py-2 text-sm"
      />
    );
  else if (field.widget === "native")
    control = (
      <NativeHtml
        html={field.html}
        label={field.label}
        className="native-widget min-w-0"
      />
    );
  else if (["json", "array"].includes(field.widget))
    control = <StructuredField field={field} />;
  else if (field.widget === "file") control = <FileField field={field} />;
  else if (field.widget === "datetime")
    control = (
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        {field.parts?.map((part) =>
          part.widget === "date" ? (
            <DateControl key={part.name} field={part} />
          ) : (
            <Input
              key={part.name}
              id={part.id}
              name={part.name}
              aria-label={`${field.label} — ${part.label}`}
              disabled={part.disabled}
              required={part.required}
              type="time"
              step="any"
              dir="ltr"
              defaultValue={String(part.value || "")}
            />
          ),
        )}
      </div>
    );
  else if (field.widget === "date") control = <DateControl field={field} />;
  else if (field.widget === "checkbox")
    control = <Checkbox {...common} defaultChecked={Boolean(field.value)} />;
  else if (field.widget === "textarea")
    control = (
      <Textarea {...common} {...field.attrs} defaultValue={initial} rows={5} />
    );
  else if (field.widget === "select") control = <SelectControl field={field} />;
  else if (field.widget === "radio")
    control = (
      <RadioGroup
        id={field.id}
        aria-labelledby={`${field.id}-label`}
        name={field.name}
        defaultValue={initial}
        disabled={field.disabled}
      >
        {field.choices
          ?.flatMap((g) => g.options)
          .map((option, index) => (
            <label key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={`${field.id}-${index}`}
              />
              {option.label}
            </label>
          ))}
      </RadioGroup>
    );
  else
    control = (
      <Input
        {...common}
        {...field.attrs}
        type={field.widget}
        step={field.widget === "time" ? "any" : undefined}
        defaultValue={field.widget === "file" ? undefined : initial}
        dir={
          field.direction ||
          (["email", "url", "number", "time", "datetime-local", "tel"].includes(
            field.widget,
          )
            ? "ltr"
            : undefined)
        }
      />
    );
  return (
    <Field
      data-invalid={field.errors.length > 0}
      orientation={field.widget === "checkbox" ? "horizontal" : "vertical"}
    >
      {field.widget === "checkbox" && control}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <FieldLabel
          id={`${field.id}-label`}
          htmlFor={
            field.widget === "readonly"
              ? undefined
              : field.widget === "native"
                ? `${field.id}-shadcn`
                : field.id
          }
        >
          {field.label}
          {field.required && (
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          )}
        </FieldLabel>
        {field.widget !== "checkbox" && control}
        {field.help && (
          <FieldDescription id={`${field.id}-help`}>
            <span dangerouslySetInnerHTML={{ __html: field.help || "" }} />
          </FieldDescription>
        )}
        <FieldError id={`${field.id}-error`}>
          {field.errors.join(" ")}
        </FieldError>
      </div>
    </Field>
  );
}
