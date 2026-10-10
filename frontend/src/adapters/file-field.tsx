import { useEffect, useRef, useState } from "react";
import { FileIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { useFieldText } from "./field-text";
import type { FieldDescriptor } from "../types";

export function FileField({ field }: { field: FieldDescriptor }) {
  const t = useFieldText();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [clear, setClear] = useState(false);
  useEffect(() => {
    if (!file?.type.startsWith("image/")) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="space-y-3">
      <div
        className="relative rounded-xl border border-dashed bg-muted/20 p-4"
        onDragOver={(event) => {
          if (!field.disabled) event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (field.disabled || !input.current) return;
          const dropped = event.dataTransfer.files[0];
          if (!dropped) return;
          const transfer = new DataTransfer();
          transfer.items.add(dropped);
          input.current.files = transfer.files;
          input.current.dispatchEvent(new Event("change", { bubbles: true }));
          setFile(dropped);
          setClear(false);
        }}
      >
        <input
          ref={input}
          className="sr-only"
          type="file"
          id={field.id}
          name={field.name}
          aria-label={field.label}
          disabled={field.disabled}
          required={field.required && !field.file}
          accept={field.accept}
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
            setClear(false);
          }}
        />
        <div className="flex min-w-0 items-center gap-3">
          <UploadIcon className="size-5 shrink-0 text-muted-foreground" />
          <Button
            type="button"
            variant="outline"
            className="h-auto min-w-0 flex-1 whitespace-normal py-2 text-start"
            disabled={field.disabled}
            onClick={() => input.current?.click()}
          >
            {file ? <bdi>{file.name}</bdi> : t.upload}
          </Button>
          {file && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t.remove}
              disabled={field.disabled}
              onClick={() => {
                if (input.current) input.current.value = "";
                setFile(null);
              }}
            >
              <XIcon />
            </Button>
          )}
        </div>
        {(preview || (field.image && field.file && !clear)) && (
          <img
            src={preview || field.file?.url}
            alt={file?.name || field.file?.name || ""}
            className="mt-3 max-h-40 max-w-full rounded-lg object-contain"
          />
        )}
      </div>
      {field.file && (
        <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm">
          <FileIcon className="size-4 shrink-0" />
          <a
            href={field.file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 break-all text-primary underline"
          >
            <bdi>{field.file.name}</bdi>
          </a>
          {field.can_clear && (
            <label className="flex items-center gap-2">
              <Checkbox
                name={`${field.name}-clear`}
                checked={clear}
                disabled={field.disabled || Boolean(file)}
                onCheckedChange={(next) => setClear(next === true)}
              />
              {t.clear}
            </label>
          )}
        </div>
      )}
    </div>
  );
}
