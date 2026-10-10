import type { ChangeEvent } from "react";
import type { DropdownProps } from "react-day-picker";
import { useDirection } from "./ui/direction";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function CalendarDropdown({
  options = [],
  value,
  onChange,
  disabled,
  id,
  name,
  "aria-label": label,
}: DropdownProps) {
  const direction = useDirection();
  return (
    <Select
      value={Number(value)}
      items={options}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== null)
          onChange?.({
            target: { value: String(next) },
          } as ChangeEvent<HTMLSelectElement>);
      }}
    >
      <SelectTrigger
        id={id}
        aria-label={label}
        name={name}
        size="sm"
        className="border-none px-1 font-medium shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent dir={direction} alignItemWithTrigger={false}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
