import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ShadcnHtml } from "./html-controls";

afterEach(() => vi.unstubAllGlobals());
function clickOption(option: HTMLElement) {
  fireEvent.pointerDown(option, { pointerType: "mouse", button: 0 });
  fireEvent.click(option);
}

describe("Django widget bridges", () => {
  it("renders shadcn controls while retaining Django names, constraints and events", async () => {
    const { container } = render(
      <form>
        <ShadcnHtml
          html={
            '<label for="title">Title</label><input id="title" name="title" value="Before" required><label for="notes">Notes</label><textarea id="notes" name="notes">Old notes</textarea><label for="clear">Clear file</label><input id="clear" name="attachment-clear" type="checkbox"><label for="priority">Priority</label><select id="priority" name="priority" required><option value="">---------</option><option value="normal" selected>Normal</option><option value="urgent">Urgent</option></select><input name="locked" disabled value="ignored">'
          }
        />
      </form>,
    );
    const form = container.querySelector("form")!;
    const original = container.querySelector<HTMLInputElement>(
      'input[name="title"]',
    )!;
    const change = vi.fn();
    original.addEventListener("change", change);
    expect(original).not.toBeVisible();
    expect(screen.getByLabelText("Title")).toHaveAttribute(
      "data-slot",
      "input",
    );
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "After" },
    });
    fireEvent.change(screen.getByLabelText("Notes"), {
      target: { value: "New notes" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Clear file" }));
    fireEvent.click(screen.getByRole("combobox", { name: "Priority" }));
    clickOption(await screen.findByRole("option", { name: "Urgent" }));
    const data = new FormData(form);
    expect(data.get("title")).toBe("After");
    expect(data.get("notes")).toBe("New notes");
    expect(data.get("attachment-clear")).toBe("on");
    expect(data.get("priority")).toBe("urgent");
    expect(data.has("locked")).toBe(false);
    expect(change).toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "" } });
    expect(form.checkValidity()).toBe(false);
  });

  it("reflects Django popup option changes and form resets", async () => {
    const { container } = render(
      <form>
        <ShadcnHtml
          html={
            '<label for="product">Product</label><select id="product" name="product"><option value="1" selected>Notebook</option></select>'
          }
        />
      </form>,
    );
    const select = container.querySelector<HTMLSelectElement>(
      'select[name="product"]',
    )!;
    act(() => {
      select.add(new Option("Desk light", "2", true, true));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(screen.getByRole("combobox", { name: "Product" })).toHaveTextContent(
      "Desk light",
    );
    act(() => {
      select.selectedOptions[0].textContent = "Updated light";
    });
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Product" }),
      ).toHaveTextContent("Updated light"),
    );
    act(() => {
      select.options[1].defaultSelected = false;
      container.querySelector("form")!.reset();
    });
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Product" }),
      ).toHaveTextContent("Notebook"),
    );
  });

  it("uses Django's scoped autocomplete endpoint and submits the chosen ID", async () => {
    const fetchOptions = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ id: "42", text: "Emma Laurent" }],
        pagination: { more: false },
      }),
    });
    vi.stubGlobal("fetch", fetchOptions);
    const { container } = render(
      <form>
        <ShadcnHtml
          html={
            '<label for="customer">Customer</label><select id="customer" name="customer" class="admin-autocomplete" data-ajax--url="/admin/autocomplete/" data-app-label="workspace" data-model-name="order" data-field-name="customer"></select>'
          }
        />
      </form>,
    );
    fireEvent.input(screen.getByRole("combobox", { name: "Customer" }), {
      inputType: "insertText",
      target: { value: "Emma" },
    });
    const option = await screen.findByRole("option", { name: "Emma Laurent" });
    const request = new URL(fetchOptions.mock.calls.at(-1)![0]);
    expect(request.pathname).toBe("/admin/autocomplete/");
    expect(Object.fromEntries(request.searchParams)).toEqual({
      term: "Emma",
      page: "1",
      app_label: "workspace",
      model_name: "order",
      field_name: "customer",
    });
    clickOption(option);
    expect(new FormData(container.querySelector("form")!).get("customer")).toBe(
      "42",
    );
    expect(container.querySelector(".admin-autocomplete")).toBeNull();
  });
});
