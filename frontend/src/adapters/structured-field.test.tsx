import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StructuredField } from "./structured-field";
import { FormField } from "./fields";
import { ShadcnHtml } from "./html-controls";
import type { FieldDescriptor } from "../types";

const field = (
  value: unknown,
  raw = JSON.stringify(value),
): FieldDescriptor => ({
  name: "data",
  id: "id_data",
  label: "Data",
  widget: "json",
  value,
  raw,
  errors: [],
});
const clickOption = (option: HTMLElement) => {
  fireEvent.pointerDown(option, { pointerType: "mouse", button: 0 });
  fireEvent.click(option);
};
describe("Structured field round trips", () => {
  it("edits an empty array, preserves order and submits one JSON value", () => {
    const { container } = render(
      <form>
        <StructuredField field={field([])} />
      </form>,
    );
    expect(screen.getByText(/No items yet/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Data 1" }), {
      target: { value: "فارسی" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Data 2" }), {
      target: { value: "second" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Move up 2" }));
    expect(
      JSON.parse(
        String(new FormData(container.querySelector("form")!).get("data")),
      ),
    ).toEqual(["second", "فارسی"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove 1" }));
    expect(
      JSON.parse(
        String(new FormData(container.querySelector("form")!).get("data")),
      ),
    ).toEqual(["فارسی"]);
  });
  it("preserves nested objects, booleans, null and numbers without stringifying them", () => {
    const value = { features: [true, null, { price: 2.5 }], enabled: false };
    const { container } = render(
      <form>
        <StructuredField field={field(value)} />
      </form>,
    );
    expect(
      JSON.parse(
        String(new FormData(container.querySelector("form")!).get("data")),
      ),
    ).toEqual(value);
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Data JSON" }), {
      target: { value: '{"scalar": 0, "items": [false, null]}' },
    });
    fireEvent.click(screen.getByRole("button", { name: "Editor" }));
    expect(
      JSON.parse(
        String(new FormData(container.querySelector("form")!).get("data")),
      ),
    ).toEqual({ scalar: 0, items: [false, null] });
  });
  it("retains invalid server input and blocks saving until corrected", () => {
    const { container } = render(
      <form>
        <StructuredField field={field(null, "[broken")} />
      </form>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("valid JSON");
    expect(container.querySelector("form")!.checkValidity()).toBe(false);
    fireEvent.change(screen.getByRole("textbox", { name: "Data JSON" }), {
      target: { value: '["fixed"]' },
    });
    expect(container.querySelector("form")!.checkValidity()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Editor" }));
    expect(screen.getByRole("textbox", { name: "Data 1" })).toHaveValue(
      "fixed",
    );
  });
  it("adds object properties safely and retains numeric values", () => {
    const { container } = render(
      <form>
        <StructuredField field={field({ value: 1 })} />
      </form>,
    );
    fireEvent.change(screen.getByRole("spinbutton", { name: "Data value" }), {
      target: { value: "3.25" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Data — Property name" }),
      { target: { value: "__proto__" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Add property" }));
    const data = JSON.parse(
      String(new FormData(container.querySelector("form")!).get("data")),
    );
    expect(data.value).toBe(3.25);
    expect(Object.hasOwn(data, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(data)).toBe(Object.prototype);
  });
  it("keeps delimiter-based ArrayField serialization", () => {
    const { container } = render(
      <form>
        <StructuredField
          field={{ ...field(["one", "two"]), widget: "array", delimiter: ";" }}
        />
      </form>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Data 2" }), {
      target: { value: "سه" },
    });
    expect(new FormData(container.querySelector("form")!).get("data")).toBe(
      "one;سه",
    );
  });
  it("submits repeated names for searchable many-to-many fields", async () => {
    const { container } = render(
      <form>
        <FormField
          field={{
            ...field(["a"]),
            widget: "select",
            multiple: true,
            choices: [
              {
                label: "",
                options: [
                  { value: "a", label: "Alpha", selected: true },
                  { value: "b", label: "Beta", selected: false },
                ],
              },
            ],
          }}
        />
      </form>,
    );
    fireEvent.input(screen.getByRole("combobox", { name: "Data" }), {
      target: { value: "Beta" },
    });
    clickOption(await screen.findByRole("option", { name: "Beta" }));
    expect(
      new FormData(container.querySelector("form")!).getAll("data"),
    ).toEqual(["a", "b"]);
  });
  it("updates the original Django select when the native bridge uses chips", async () => {
    const { container } = render(
      <form>
        <ShadcnHtml
          html={
            '<label for="categories">Categories</label><select multiple name="categories" id="categories"><option value="1" selected>First</option><option value="2">Second</option></select>'
          }
        />
      </form>,
    );
    fireEvent.input(screen.getByRole("combobox", { name: "Categories" }), {
      target: { value: "Second" },
    });
    clickOption(await screen.findByRole("option", { name: "Second" }));
    expect(
      new FormData(container.querySelector("form")!).getAll("categories"),
    ).toEqual(["1", "2"]);
  });
});
