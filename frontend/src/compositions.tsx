import { createElement, useId, useState, type ComponentProps } from "react";
import {
  flexRender,
  tableFeatures,
  useTable,
  globalFilteringFeature,
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createSortedRowModel,
  createPaginatedRowModel,
  sortFn_text,
  sortFn_basic,
  filterFn_includesString,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Calendar } from "./components/ui/calendar";
import { PersianCalendar } from "./components/persian-calendar";
import { faIR, enUS } from "@daypicker/persian";
import { Input } from "./components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./components/ui/popover";
import { Button } from "./components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "./components/ui/table";
import { canonicalDate } from "./adapters/fields";

export function DatePicker({
  value,
  onChange,
  name,
  label = "Choose a date",
  locale = "en",
  calendar = "gregorian",
  dir = "ltr",
  disabled = false,
}: {
  value?: Date;
  onChange: (value: Date | undefined) => void;
  name?: string;
  label?: string;
  locale?: string;
  calendar?: "gregorian" | "jalali";
  dir?: "ltr" | "rtl";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pickerProps = {
    mode: "single" as const,
    selected: value,
    defaultMonth: value,
    dir,
    onSelect: (date: Date | undefined) => {
      onChange(date);
      setOpen(false);
    },
  };
  return (
    <div dir={dir}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ? canonicalDate(value) : ""}
        />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" disabled={disabled} aria-label={label} />
          }
        >
          <CalendarIcon />
          {value
            ? new Intl.DateTimeFormat(locale, {
                calendar: calendar === "jalali" ? "persian" : "gregory",
                dateStyle: "medium",
              }).format(value)
            : label}
        </PopoverTrigger>
        <PopoverContent dir={dir} className="w-auto p-0">
          {calendar === "jalali" ? (
            <PersianCalendar
              {...pickerProps}
              locale={locale.startsWith("fa") ? faIR : enUS}
              numerals={locale.startsWith("fa") ? "arabext" : "latn"}
            />
          ) : (
            <Calendar {...pickerProps} />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

const dataTableFeatures = tableFeatures({
  globalFilteringFeature,
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { text: sortFn_text, basic: sortFn_basic },
  filterFns: { includesString: filterFn_includesString },
});
export type DataTableColumn<T extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  T
>;
export function DataTable<T extends RowData>({
  columns,
  data,
  searchLabel = "Search",
  emptyLabel = "No results",
  previousLabel = "Previous",
  nextLabel = "Next",
  pageSize = 10,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  searchLabel?: string;
  emptyLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  pageSize?: number;
}) {
  const [filter, setFilter] = useState("");
  const id = useId();
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    initialState: { pagination: { pageSize, pageIndex: 0 } },
  });
  return (
    <div className="space-y-4">
      <Input
        id={id}
        aria-label={searchLabel}
        placeholder={searchLabel}
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          table.setGlobalFilter(event.target.value);
        }}
      />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.column.getCanSort() ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto gap-1 p-0 font-medium"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "desc" ? (
                          <ChevronDownIcon className="size-3" />
                        ) : (
                          <ChevronUpIcon className="size-3" />
                        )}
                      </Button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>{emptyLabel}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {previousLabel}
        </Button>
        <Button
          variant="outline"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

export function Typography({
  as = "p",
  className = "",
  ...props
}: ComponentProps<"p"> & {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "blockquote" | "code";
}) {
  const styles = {
    h1: "text-4xl font-semibold tracking-tight",
    h2: "text-3xl font-semibold tracking-tight",
    h3: "text-2xl font-semibold",
    h4: "text-xl font-semibold",
    p: "leading-7",
    blockquote: "border-s-2 ps-6 italic",
    code: "rounded bg-muted px-1.5 py-1 font-mono text-sm",
  };
  return createElement(as, {
    ...props,
    className: `${styles[as]} ${className}`,
  });
}
