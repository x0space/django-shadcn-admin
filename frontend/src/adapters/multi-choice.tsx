import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxValue,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  useComboboxAnchor,
} from "../components/ui/combobox";
import { useState } from "react";
import { useDirection } from "../components/ui/direction";
import { useFieldText } from "./field-text";

export function MultiChoice({
  choices,
  value,
  onChange,
  id,
  name,
  label,
  disabled,
  required,
  invalid,
}: {
  choices: {
    value: string;
    label: string;
    disabled?: boolean;
    group?: string;
  }[];
  value: string[];
  onChange: (value: string[]) => void;
  id?: string;
  name?: string;
  label: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
}) {
  const t = useFieldText();
  const direction = useDirection();
  const anchor = useComboboxAnchor();
  const [open, setOpen] = useState(false);
  return (
    <Combobox
      open={open}
      onOpenChange={setOpen}
      onInputValueChange={() => {
        if (!disabled) setOpen(true);
      }}
      items={choices.filter((c) => c.value).map((c) => c.value)}
      value={value}
      multiple
      name={name}
      required={required}
      disabled={disabled}
      onValueChange={onChange}
      itemToStringLabel={(item) =>
        choices.find((c) => c.value === item)?.label || item
      }
    >
      <ComboboxChips ref={anchor} className="w-full min-w-0">
        <ComboboxValue>
          {(items: string[]) =>
            items.map((item) => (
              <ComboboxChip key={item} className="max-w-full">
                <bdi className="min-w-0 whitespace-normal">
                  {choices.find((c) => c.value === item)?.label || item}
                </bdi>
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput
          id={id}
          aria-label={label}
          aria-invalid={invalid}
          placeholder={t.search}
          className="min-w-32"
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor} dir={direction}>
        <ComboboxEmpty>{t.noResults}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem
              key={item}
              value={item}
              disabled={choices.find((c) => c.value === item)?.disabled}
            >
              <span className="min-w-0 whitespace-normal">
                {choices.find((c) => c.value === item)?.label || item}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
