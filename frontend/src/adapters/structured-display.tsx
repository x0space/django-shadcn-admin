import { Badge } from "../components/ui/badge";
export function StructuredDisplay({ value }: { value: unknown }) {
  if (
    Array.isArray(value) &&
    value.every((item) => typeof item !== "object" || item === null)
  )
    return (
      <div className="flex max-w-md flex-wrap gap-1.5" dir="auto">
        {value.length ? (
          value.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="h-auto max-w-full whitespace-normal break-all"
            >
              <bdi>{String(item)}</bdi>
            </Badge>
          ))
        ) : (
          <Badge variant="outline">0</Badge>
        )}
      </div>
    );
  return (
    <pre
      dir="ltr"
      className="max-h-56 max-w-full overflow-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed"
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
