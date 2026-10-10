import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Button } from "../components/ui/button";
import { useDirection } from "../components/ui/direction";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxChips,
  ComboboxChip,
  ComboboxValue,
  ComboboxChipsInput,
} from "../components/ui/combobox";

type Control =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLButtonElement
  | HTMLAnchorElement;
type Bridge = {
  control: Control;
  host: HTMLSpanElement;
  required: boolean;
  label: string;
};
type Choice = {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
};
type JQuery = {
  on(events: string, callback: () => void): void;
  off(events: string, callback: () => void): void;
};
type DjangoWindow = Window & {
  django?: { jQuery?: (control: Element) => JQuery };
};

function notify(control: Control) {
  control.dispatchEvent(new Event("input", { bubbles: true }));
  control.dispatchEvent(new Event("change", { bubbles: true }));
}

function readChoices(select: HTMLSelectElement): Choice[] {
  return Array.from(select.options, (option) => ({
    value: option.value,
    label: option.label,
    disabled:
      option.disabled ||
      (option.parentElement instanceof HTMLOptGroupElement &&
        option.parentElement.disabled),
    group:
      option.parentElement instanceof HTMLOptGroupElement
        ? option.parentElement.label
        : "",
  }));
}

function readValue(control: Control): string | string[] {
  if (control instanceof HTMLSelectElement && control.multiple)
    return Array.from(control.selectedOptions, (option) => option.value);
  if (control instanceof HTMLAnchorElement)
    return control.textContent || control.title;
  return control.value;
}

function HtmlControl({ bridge }: { bridge: Bridge }) {
  const { control, required, label } = bridge;
  const direction = useDirection();
  const [revision, refresh] = useState(0);
  const [value, setValue] = useState(() => readValue(control));
  const [checked, setChecked] = useState(
    () => control instanceof HTMLInputElement && control.checked,
  );
  useLayoutEffect(() => {
    const sync = () => {
      setValue(readValue(control));
      setChecked(control instanceof HTMLInputElement && control.checked);
      refresh((version) => version + 1);
    };
    control.addEventListener("input", sync);
    control.addEventListener("change", sync);
    // Django popup callbacks use jQuery events, which do not dispatch DOM events.
    const jquery = (window as DjangoWindow).django?.jQuery?.(control);
    jquery?.on("change.shadcn input.shadcn", sync);
    const observer = new MutationObserver(sync);
    observer.observe(control, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
    const form = "form" in control ? control.form : null;
    const reset = () => queueMicrotask(sync);
    form?.addEventListener("reset", reset);
    return () => {
      control.removeEventListener("input", sync);
      control.removeEventListener("change", sync);
      jquery?.off("change.shadcn input.shadcn", sync);
      observer.disconnect();
      form?.removeEventListener("reset", reset);
    };
  }, [control]);
  const id = control.id ? `${control.id}-shadcn` : undefined;
  const common = {
    id,
    "aria-label": label || undefined,
    "aria-describedby": control.getAttribute("aria-describedby") || undefined,
    "aria-invalid": control.getAttribute("aria-invalid") === "true",
    disabled:
      "disabled" in control
        ? control.disabled
        : control.getAttribute("aria-disabled") === "true",
  };
  const update = (next: string | string[] | null) => {
    if (control instanceof HTMLSelectElement) {
      const values = Array.isArray(next) ? next : [next ?? ""];
      Array.from(control.options).forEach((option) => {
        option.selected = values.includes(option.value);
      });
    } else if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement
    ) {
      control.value = String(next ?? "");
    }
    setValue(readValue(control));
    notify(control);
  };
  if (control instanceof HTMLSelectElement) {
    if (control.getAttribute("data-ajax--url"))
      return (
        <AutocompleteControl
          select={control}
          revision={revision}
          value={value}
          common={common}
          required={required}
          update={update}
        />
      );
    const choices = readChoices(control);
    const groups = [...new Set(choices.map((choice) => choice.group))];
    return (
      <Select
        value={value}
        multiple={control.multiple}
        items={choices}
        required={required}
        disabled={common.disabled}
        onValueChange={update}
      >
        <SelectTrigger {...common} className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent dir={direction} alignItemWithTrigger={false}>
          {groups.map((group) => (
            <SelectGroup key={group || ""}>
              {group && <SelectLabel>{group}</SelectLabel>}
              {choices
                .filter((choice) => choice.group === group)
                .map((choice) => (
                  <SelectItem
                    key={choice.value}
                    value={choice.value}
                    disabled={choice.disabled}
                  >
                    {choice.label}
                  </SelectItem>
                ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (control instanceof HTMLTextAreaElement)
    return (
      <Textarea
        {...common}
        required={required}
        readOnly={control.readOnly}
        rows={control.rows}
        value={String(value)}
        onChange={(event) => update(event.target.value)}
      />
    );
  if (
    control instanceof HTMLAnchorElement ||
    control instanceof HTMLButtonElement ||
    (control instanceof HTMLInputElement &&
      ["submit", "button", "reset", "image"].includes(control.type))
  ) {
    return (
      <Button
        {...common}
        type="button"
        variant="outline"
        size={control instanceof HTMLAnchorElement ? "icon" : "default"}
        onClick={() => control.click()}
      >
        {control instanceof HTMLAnchorElement ? (
          <span dangerouslySetInnerHTML={{ __html: control.innerHTML }} />
        ) : (
          control.textContent || String(value)
        )}
      </Button>
    );
  }
  if (control instanceof HTMLInputElement) {
    if (control.type === "checkbox")
      return (
        <Checkbox
          {...common}
          checked={checked}
          required={required}
          onCheckedChange={(next) => {
            control.checked = next === true;
            setChecked(control.checked);
            notify(control);
          }}
        />
      );
    if (control.type === "radio")
      return (
        <RadioGroup
          value={checked ? control.value : ""}
          onValueChange={() => {
            control.checked = true;
            control.form
              ?.querySelectorAll<HTMLInputElement>('input[type="radio"]')
              .forEach((radio) => {
                if (radio.name === control.name) notify(radio);
              });
          }}
        >
          <RadioGroupItem {...common} value={control.value} />
        </RadioGroup>
      );
    if (control.type === "file")
      return (
        <Button
          {...common}
          type="button"
          variant="outline"
          className="max-w-full justify-start"
          onClick={() => control.click()}
        >
          <span className="truncate">
            {Array.from(control.files || [], (file) => file.name).join(", ") ||
              label}
          </span>
        </Button>
      );
    return (
      <Input
        {...common}
        type={
          ["date", "datetime-local", "time"].includes(control.type)
            ? "text"
            : control.type
        }
        required={required}
        readOnly={control.readOnly}
        value={String(value)}
        placeholder={control.placeholder}
        maxLength={control.maxLength < 0 ? undefined : control.maxLength}
        min={control.min}
        max={control.max}
        step={control.step}
        autoComplete={control.autocomplete}
        onChange={(event) => update(event.target.value)}
      />
    );
  }
  return null;
}

function AutocompleteControl({
  select,
  revision,
  value,
  common,
  required,
  update,
}: {
  select: HTMLSelectElement;
  revision: number;
  value: string | string[];
  common: {
    id?: string;
    "aria-label"?: string;
    "aria-describedby"?: string;
    "aria-invalid": boolean;
    disabled: boolean;
  };
  required: boolean;
  update: (next: string | string[] | null) => void;
}) {
  const direction = useDirection();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Choice[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useLayoutEffect(() => {
    setPage(1);
  }, [query]);
  useLayoutEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const url = new URL(
          select.getAttribute("data-ajax--url")!,
          window.location.href,
        );
        url.search = new URLSearchParams({
          term: query,
          page: String(page),
          app_label: select.dataset.appLabel || "",
          model_name: select.dataset.modelName || "",
          field_name: select.dataset.fieldName || "",
        }).toString();
        const response = await fetch(url, {
          signal: abort.signal,
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as {
          results: { id: string; text: string }[];
          pagination: { more: boolean };
        };
        const next = data.results.map((item) => ({
          value: String(item.id),
          label: item.text,
        }));
        setResults((previous) => (page === 1 ? next : [...previous, ...next]));
        setMore(data.pagination.more);
      } catch {
        if (!abort.signal.aborted) setError(true);
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      abort.abort();
    };
  }, [select, open, query, page]);
  // Include selected options even when they are outside the current search page.
  const choices = Array.from(
    new Map(
      [...readChoices(select), ...results]
        .filter((choice) => choice.value)
        .map((choice) => [choice.value, choice]),
    ).values(),
  );
  const choose = (next: string | string[] | null) => {
    for (const selected of Array.isArray(next) ? next : [next]) {
      if (
        selected &&
        !Array.from(select.options).some((option) => option.value === selected)
      )
        select.add(
          new Option(
            choices.find((choice) => choice.value === selected)?.label ||
              selected,
            selected,
          ),
        );
    }
    update(next);
  };
  void revision;
  return (
    <Combobox
      items={choices.map((choice) => choice.value)}
      value={value || null}
      multiple={select.multiple}
      required={required}
      disabled={common.disabled}
      filter={null}
      itemToStringLabel={(item) =>
        choices.find((choice) => choice.value === item)?.label || item
      }
      onValueChange={choose}
      onInputValueChange={setQuery}
      open={open}
      onOpenChange={setOpen}
    >
      {select.multiple ? (
        <ComboboxChips className="w-full">
          <ComboboxValue>
            {(values: string[]) =>
              values.map((item) => (
                <ComboboxChip key={item}>
                  {choices.find((choice) => choice.value === item)?.label ||
                    item}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput {...common} />
        </ComboboxChips>
      ) : (
        <ComboboxInput {...common} className="w-full" showClear={!required} />
      )}
      <ComboboxContent dir={direction}>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {choices.find((choice) => choice.value === item)?.label || item}
            </ComboboxItem>
          )}
        </ComboboxList>
        {loading && (
          <p role="status" className="p-2 text-xs">
            …
          </p>
        )}
        {error && (
          <p role="alert" className="p-2 text-xs">
            {select.dataset.errorLoading || "Unable to load options."}
          </p>
        )}
        {more && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={loading}
            aria-label="Load more options"
            onClick={() => setPage((current) => current + 1)}
          >
            …
          </Button>
        )}
      </ComboboxContent>
    </Combobox>
  );
}

/** Keep Django's widget DOM and events as the form bridge, with shadcn controls in front. */
export function ShadcnHtml({
  html = "",
  className = "",
  label = "",
}: {
  html?: string;
  className?: string;
  label?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [bridges, setBridges] = useState<Bridge[]>([]);
  useLayoutEffect(() => {
    const element = root.current!;
    const next: Bridge[] = [];
    const cleanups: (() => void)[] = [];
    for (const control of element.querySelectorAll<Control>(
      'input:not([type="hidden"]), select, textarea, button, a.related-widget-wrapper-link, a.related-lookup',
    )) {
      const host = document.createElement("span");
      host.className =
        "shadcn-widget-control inline-flex min-w-0 max-w-full items-center";
      if (
        control instanceof HTMLSelectElement ||
        control instanceof HTMLTextAreaElement ||
        (control instanceof HTMLInputElement &&
          !["checkbox", "radio", "button", "submit", "reset"].includes(
            control.type,
          ))
      )
        host.classList.add("flex-1");
      control.before(host);
      const display = control.style.display;
      const ariaHidden = control.getAttribute("aria-hidden");
      const required = "required" in control && control.required;
      control.style.display = "none";
      control.setAttribute("aria-hidden", "true");
      control.setAttribute("data-shadcn-bridge", "");
      if ("required" in control) control.required = false;
      // Avoid a second visual control created by Django's Select2 and filter widgets.
      const classes = [
        "admin-autocomplete",
        "selectfilter",
        "selectfilterstacked",
      ].filter((name) => control.classList.contains(name));
      control.classList.remove(...classes);
      const labels =
        "labels" in control ? Array.from(control.labels || []) : [];
      labels.forEach((item) => {
        item.htmlFor = `${control.id}-shadcn`;
      });
      next.push({
        control,
        host,
        required,
        label:
          control.getAttribute("aria-label") ||
          labels
            .map((item) => item.textContent)
            .join(" ")
            .trim() ||
          control.title ||
          label ||
          control.getAttribute("name") ||
          "",
      });
      cleanups.push(() => {
        host.remove();
        control.style.display = display;
        if (ariaHidden === null) control.removeAttribute("aria-hidden");
        else control.setAttribute("aria-hidden", ariaHidden);
        control.removeAttribute("data-shadcn-bridge");
        if ("required" in control) control.required = required;
        control.classList.add(...classes);
        labels.forEach((item) => {
          item.htmlFor = control.id;
        });
      });
    }
    setBridges(next);
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [html, label]);
  return (
    <>
      <div
        ref={root}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {bridges.map((bridge, index) =>
        createPortal(
          <HtmlControl bridge={bridge} />,
          bridge.host,
          String(index),
        ),
      )}
    </>
  );
}
