import { useEffect, useRef, useState, type RefObject, type FormEvent } from "react";
import type { FieldDescriptor } from "./types";
import { useStrings } from "./context";
import { ReviewDialog } from "./workspace";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./components/ui/table";

interface SnapshotValue {label: string; raw: string; display: string}
export function formSnapshot(form: HTMLFormElement, fields: FieldDescriptor[], changedLabel: string) {
  const values = new FormData(form);
  const snapshot = new Map<string, SnapshotValue>();
  for (const field of fields) {
    if (field.disabled || ["hidden", "readonly"].includes(field.widget)) continue;
    // Expand the template descriptor for newly added inline rows.
    const names = field.name.includes("__prefix__")
      ? Array.from(form.elements).map((e) => (e as HTMLInputElement).name).filter((name) => name?.startsWith(field.name.split("__prefix__")[0]) && name.endsWith(field.name.split("__prefix__")[1]))
      : [field.name];
    for (const name of new Set(names)) {
      const entries = values.getAll(name);
      const strings = entries.map((value) => typeof value === "string" ? value : value.size ? value.name : "");
      const sensitive = field.widget === "password" || /password|secret|token/i.test(name);
      // Native/custom adapters may encapsulate secrets; show a change marker only.
      const concealed = sensitive || field.widget === "native";
      const choices = field.choices?.flatMap((group) => group.options);
      const display = concealed ? changedLabel : strings.map((value) => choices?.find((option) => option.value === value)?.label || value).join(", ");
      const prefix = /^(.*)-(\d+)-/.exec(name);
      snapshot.set(name, {label: `${prefix ? `${prefix[1]} ${Number(prefix[2]) + 1} · ` : ""}${field.label}`, raw: JSON.stringify(strings), display});
    }
  }
  return snapshot;
}
export interface FormDifference {label: string; before: string; after: string}
export function formDifferences(before: Map<string, SnapshotValue>, after: Map<string, SnapshotValue>) {
  const result: FormDifference[] = [];
  for (const name of new Set([...before.keys(), ...after.keys()])) {
    const previous = before.get(name), current = after.get(name);
    if (previous?.raw !== current?.raw) result.push({label: current?.label || previous!.label, before: previous?.display || "—", after: current?.display || "—"});
  }
  return result;
}

export function useFormReview(form: RefObject<HTMLFormElement | null>, fields: FieldDescriptor[]) {
  const t = useStrings(); const baseline = useRef<Map<string, SnapshotValue>>(new Map());
  const reviewed = useRef(false); const submitter = useRef<{name: string; value: string}>({name: "", value: ""});
  const [differences, setDifferences] = useState<FormDifference[] | null>(null);
  useEffect(() => {
    if (form.current) baseline.current = formSnapshot(form.current, fields, t.changed);
    // Native adapters finish mounting in child effects before this snapshot.
  }, []);
  const intercept = (event: FormEvent<HTMLFormElement>) => {
    if (reviewed.current) {reviewed.current = false; return false;}
    const changes = formDifferences(baseline.current, formSnapshot(event.currentTarget, fields, t.changed));
    if (!changes.length) return false;
    event.preventDefault();
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    submitter.current = {name: button?.name || "", value: button?.value || ""};
    setDifferences(changes); return true;
  };
  const confirm = () => {
    if (!form.current) return;
    // Recompute if a programmatic widget changed while the dialog was open.
    const current = formDifferences(baseline.current, formSnapshot(form.current, fields, t.changed));
    if (JSON.stringify(current) !== JSON.stringify(differences)) {setDifferences(current); return;}
    reviewed.current = true; setDifferences(null);
    const control = document.createElement("input"); control.type = "hidden";
    control.name = submitter.current.name; control.value = submitter.current.value;
    form.current.append(control); form.current.requestSubmit(); control.remove();
  };
  const dialog = <ReviewDialog title={t.review_changes} description={t.review_changes_description} open={differences !== null} onClose={() => setDifferences(null)} onConfirm={confirm}>
    <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t.field}</TableHead><TableHead>{t.before}</TableHead><TableHead>{t.after}</TableHead></TableRow></TableHeader>
      <TableBody>{differences?.map((change, i) => <TableRow key={i}><TableHead className="whitespace-normal">{change.label}</TableHead><TableCell className="max-w-64 whitespace-normal break-words">{change.before}</TableCell><TableCell className="max-w-64 whitespace-normal break-words">{change.after}</TableCell></TableRow>)}</TableBody>
    </Table></div>
  </ReviewDialog>;
  return {intercept, dialog};
}
