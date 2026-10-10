import { describe, expect, it } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import {
  canonicalDate,
  normalizeDigits,
  parseDate,
  FormField,
  registerFieldAdapter,
} from "./fields";
import { DataTable, Typography } from "../compositions";
import { getDateLib } from "@daypicker/persian";
import type { FieldDescriptor } from "../types";
import { DirectionProvider } from "../components/ui/direction";

const selectField: FieldDescriptor = {
  widget: "select",
  name: "form-0-status",
  id: "id_form-0-status",
  label: "Status",
  value: "processing",
  required: true,
  errors: [],
  choices: [
    {
      label: "",
      options: [{ value: "", label: "---------", selected: false }],
    },
    {
      label: "Order status",
      options: [
        { value: "new", label: "New", selected: false },
        { value: "processing", label: "Processing", selected: true },
        { value: "shipped", label: "Shipped", selected: false },
      ],
    },
  ],
};

function clickOption(option: HTMLElement) {
  // Base UI requires a pointer press on the item before committing a mouse click.
  fireEvent.pointerDown(option, { pointerType: "mouse", button: 0 });
  fireEvent.click(option);
}

describe("Django form contracts", () => {
  it("updates fields when an extension registers after bootstrap", () => {
    render(
      <FormField
        field={{
          widget: "extension-test",
          name: "score",
          id: "score",
          label: "Score",
          errors: [],
        }}
      />,
    );
    act(() =>
      registerFieldAdapter("extension-test", ({ field }) => (
        <input
          name={field.name}
          id={field.id}
          aria-label="Live adapter"
          defaultValue="ready"
        />
      )),
    );
    expect(screen.getByLabelText("Live adapter")).toHaveValue("ready");
  });
  it("keeps named numeric inputs and values", () => {
    render(
      <FormField
        field={{
          widget: "number",
          name: "form-0-price",
          id: "id_price",
          value: "25.50",
          label: "Price",
          required: true,
          errors: [],
        }}
      />,
    );
    expect(screen.getByLabelText(/Price/)).toHaveAttribute(
      "name",
      "form-0-price",
    );
    expect(screen.getByLabelText(/Price/)).toHaveAttribute("required");
  });
  it("announces errors and preserves invalid values", () => {
    render(
      <FormField
        field={{
          widget: "text",
          name: "name",
          id: "name",
          value: "invalid",
          label: "Name",
          errors: ["Fix this value"],
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Fix this value");
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
  it("normalizes Persian and Arabic digits", () => {
    expect(normalizeDigits("۱۲۳.٤٥")).toBe("123.45");
  });
  it("round trips date-only values without UTC conversion", () => {
    expect(canonicalDate(parseDate("2026-10-09")!)).toBe("2026-10-09");
    expect(parseDate("2026-02-30")).toBeUndefined();
  });
  it("converts a Jalali leap date to a standard Django date", () => {
    const library = getDateLib();
    const date = library.newDate(1399, 11, 30);
    expect(canonicalDate(date)).toBe("2021-03-20");
    expect(library.format(date, "yyyy-MM-dd")).toBe("1399-12-30");
  });
  it("keeps unknown native widgets intact", () => {
    render(
      <FormField
        field={{
          widget: "native",
          name: "custom",
          id: "custom",
          label: "Custom",
          errors: [],
          html: '<input id="custom" name="custom" value="retained">',
        }}
      />,
    );
    expect(screen.getByLabelText("Custom")).toHaveValue("retained");
  });
  it("submits shadcn selections, grouped choices and blank values to Django", async () => {
    const { container } = render(
      <form>
        <FormField field={selectField} />
      </form>,
    );
    const form = container.querySelector("form")!;
    const trigger = screen.getByRole("combobox", { name: /Status/ });
    expect(trigger).toHaveTextContent("Processing");
    expect(new FormData(form).get(selectField.name)).toBe("processing");
    fireEvent.click(trigger);
    expect(await screen.findByText("Order status")).toBeVisible();
    clickOption(screen.getByRole("option", { name: "Shipped" }));
    expect(trigger).toHaveTextContent("Shipped");
    expect(new FormData(form).get(selectField.name)).toBe("shipped");
    fireEvent.click(trigger);
    clickOption(await screen.findByRole("option", { name: "---------" }));
    expect(new FormData(form).get(selectField.name)).toBe("");
    expect(form.checkValidity()).toBe(false);
  });
  it("submits repeated Django values for multiple selections", async () => {
    const { container } = render(
      <form>
        <FormField field={{ ...selectField, multiple: true, value: ["new"] }} />
      </form>,
    );
    const form = container.querySelector("form")!;
    fireEvent.click(screen.getByRole("combobox", { name: /Status/ }));
    clickOption(await screen.findByRole("option", { name: "Shipped" }));
    expect(new FormData(form).getAll(selectField.name)).toEqual([
      "new",
      "shipped",
    ]);
    clickOption(screen.getByRole("option", { name: "New" }));
    expect(new FormData(form).getAll(selectField.name)).toEqual(["shipped"]);
    clickOption(screen.getByRole("option", { name: "Shipped" }));
    expect(new FormData(form).getAll(selectField.name)).toEqual([]);
    expect(form.checkValidity()).toBe(false);
  });
  it("excludes disabled choices from Django submission", () => {
    const { container } = render(
      <form>
        <FormField field={{ ...selectField, disabled: true }} />
      </form>,
    );
    expect(screen.getByRole("combobox", { name: /Status/ })).toBeDisabled();
    expect(
      new FormData(container.querySelector("form")!).has(selectField.name),
    ).toBe(false);
  });
  it("keeps error associations and RTL direction on select portals", async () => {
    const { container } = render(
      <DirectionProvider direction="rtl">
        <FormField
          field={{ ...selectField, errors: ["Choose another status"] }}
        />
      </DirectionProvider>,
    );
    const trigger = screen.getByRole("combobox", { name: /Status/ });
    expect(trigger).toHaveAttribute("id", selectField.id);
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAttribute(
      "aria-describedby",
      `${selectField.id}-help ${selectField.id}-error`,
    );
    fireEvent.click(trigger);
    await screen.findByRole("option", { name: "Shipped" });
    expect(
      document.querySelector('[data-slot="select-content"]'),
    ).toHaveAttribute("dir", "rtl");
    expect(container.querySelector('[role="alert"]')).toHaveTextContent(
      "Choose another status",
    );
  });
});
describe("public compositions", () => {
  it("renders a sortable data table", () => {
    render(
      <DataTable
        columns={[{ accessorKey: "name", header: "Name" }]}
        data={[{ name: "Sina" }]}
      />,
    );
    expect(screen.getByRole("table")).toHaveTextContent("Sina");
  });
  it("uses semantic typography", () => {
    render(<Typography as="h2">Details</Typography>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Details",
    );
  });
});
