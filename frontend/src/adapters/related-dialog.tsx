import { useEffect, useRef, useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  EyeIcon,
  SearchIcon,
  LoaderCircleIcon,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { useDirection } from "../components/ui/direction";

export interface RelatedResult {
  action?: "change" | "delete" | "lookup" | "cancel";
  value?: string;
  obj?: string;
  new_value?: string;
  optgroup?: string;
}
type RelatedWindow = Window & {
  dismissAddRelatedObjectPopup?: (
    win: Window,
    value: string,
    obj: string,
    optgroup?: string,
  ) => void;
  dismissChangeRelatedObjectPopup?: (
    win: Window,
    value: string,
    obj: string,
    next: string,
  ) => void;
  dismissDeleteRelatedObjectPopup?: (win: Window, value: string) => void;
  dismissRelatedLookupPopup?: (win: Window, value: string) => void;
};
export function completeRelated(result: RelatedResult) {
  if (window.parent !== window)
    window.parent.postMessage(
      { type: "django-shadcn:related-result", result },
      window.location.origin,
    );
  else if (window.opener)
    applyRelated(window.opener as RelatedWindow, window, result);
}
function applyRelated(
  parent: RelatedWindow,
  child: Window,
  result: RelatedResult,
) {
  if (result.action === "cancel") {
    child.close();
    return;
  }
  if (result.action === "lookup")
    parent.dismissRelatedLookupPopup?.(child, String(result.value));
  else if (result.action === "change")
    parent.dismissChangeRelatedObjectPopup?.(
      child,
      String(result.value),
      result.obj || "",
      String(result.new_value),
    );
  else if (result.action === "delete")
    parent.dismissDeleteRelatedObjectPopup?.(child, String(result.value));
  else
    parent.dismissAddRelatedObjectPopup?.(
      child,
      String(result.value),
      result.obj || "",
      result.optgroup,
    );
}
export function PopupInputs({
  popup,
  toField,
}: {
  popup?: boolean;
  toField?: string | null;
}) {
  return (
    <>
      {popup && <input type="hidden" name="_popup" value="1" />}
      {toField && <input type="hidden" name="_to_field" value={toField} />}
    </>
  );
}
export function RelatedDialog({
  control,
  label,
  disabled,
}: {
  control: HTMLAnchorElement;
  label: string;
  disabled?: boolean;
}) {
  const direction = useDirection();
  const [url, setUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const parentIndex = Number(/__(\d+)$/.exec(window.name)?.[1] || 0);
  const name = `${control.id.replace(/^(add|change|delete|view|lookup)_/, "")}__${parentIndex + 1}`;
  const Icon = control.classList.contains("add-related")
    ? PlusIcon
    : control.classList.contains("change-related")
      ? PencilIcon
      : control.classList.contains("delete-related")
        ? Trash2Icon
        : control.classList.contains("related-lookup")
          ? SearchIcon
          : EyeIcon;
  useEffect(() => {
    if (!url) return;
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.type !== "django-shadcn:related-result"
      )
        return;
      const result = event.data.result as RelatedResult;
      if (
        !result ||
        ![undefined, "change", "delete", "lookup", "cancel"].includes(
          result.action,
        ) ||
        (result.action !== "cancel" && typeof result.value !== "string")
      )
        return;
      const child = {
        name,
        location: new URL(url),
        close: () => setUrl(""),
      } as unknown as Window;
      applyRelated(window as RelatedWindow, child, result);
      // Notify native bridges as well as Django's jQuery listeners.
      const source = document.getElementById(
        control.id.replace(/^(add|change|delete|view|lookup)_/, ""),
      );
      source?.dispatchEvent(new Event("input", { bubbles: true }));
      source?.dispatchEvent(new Event("change", { bubbles: true }));
      setUrl("");
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [url, name, control]);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={label}
        title={label}
        disabled={disabled || !control.getAttribute("href")}
        onClick={() => {
          const next = new URL(control.href, window.location.href);
          if (next.origin !== window.location.origin) return;
          next.searchParams.set("_popup", "1");
          setLoaded(false);
          setUrl(next.href);
        }}
      >
        <Icon />
      </Button>
      <Dialog
        open={Boolean(url)}
        onOpenChange={(open) => {
          if (!open) setUrl("");
        }}
      >
        <DialogContent
          dir={direction}
          className="related-object-dialog w-[min(64rem,calc(100vw-1.5rem))] sm:max-w-none"
        >
          <DialogHeader className="pe-8">
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription className="sr-only">{label}</DialogDescription>
          </DialogHeader>
          {!loaded && (
            <LoaderCircleIcon
              role="status"
              aria-label={label}
              className="absolute start-1/2 top-1/2 size-6 animate-spin text-muted-foreground"
            />
          )}
          {url && (
            <iframe
              ref={frame}
              src={url}
              name={name}
              title={label}
              className="related-dialog-frame rounded-lg bg-background"
              onLoad={() => setLoaded(true)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
