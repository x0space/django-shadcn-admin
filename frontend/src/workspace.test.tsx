import { describe, expect, it, beforeEach } from "vitest";
import { formSnapshot, formDifferences } from "./review";
import { readSavedViews } from "./workspace";
import type { FieldDescriptor } from "./types";

const field = (name: string, widget = "text"): FieldDescriptor => ({
  name,
  id: name,
  label: name,
  widget,
  errors: [],
});
const createForm = (html: string) => {
  const form = document.createElement("form");
  form.innerHTML = html;
  return form;
};
describe("reviewing actual Django form values", () => {
  it("detects changes to checkbox, repeated values and choice labels", () => {
    const form = createForm(
      '<input name="active" type="checkbox" checked><input name="status" value="new"><input name="tags" value="a"><input name="tags" value="b">',
    );
    const fields = [
      field("active", "checkbox"),
      {
        ...field("status", "select"),
        choices: [
          {
            label: "",
            options: [
              { value: "new", label: "New", selected: true },
              { value: "shipped", label: "Shipped", selected: false },
            ],
          },
        ],
      },
      field("tags"),
    ];
    const baseline = formSnapshot(form, fields, "Changed");
    form.querySelector<HTMLInputElement>('[name="active"]')!.checked = false;
    form.querySelector<HTMLInputElement>('[name="status"]')!.value = "shipped";
    const changes = formDifferences(
      baseline,
      formSnapshot(form, fields, "Changed"),
    );
    expect(changes).toHaveLength(2);
    expect(changes[1]).toMatchObject({ before: "New", after: "Shipped" });
    expect(baseline.get("tags")!.display).toBe("a, b");
  });
  it("never displays password or native widget secrets", () => {
    const form = createForm(
      '<input name="password" value="old-secret"><input name="native" value="old-sensitive">',
    );
    const fields = [field("password", "password"), field("native", "native")];
    const baseline = formSnapshot(form, fields, "Changed");
    form.querySelector<HTMLInputElement>('[name="password"]')!.value =
      "new-secret";
    form.querySelector<HTMLInputElement>('[name="native"]')!.value =
      "new-sensitive";
    const changes = formDifferences(
      baseline,
      formSnapshot(form, fields, "Changed"),
    );
    expect(changes).toHaveLength(2);
    expect(JSON.stringify(changes)).not.toMatch(/secret|sensitive/);
  });
  it("detects split native controls and existing-file clearing", () => {
    const form = createForm(
      '<input name="date_0" value="2026-10-09"><input name="date_1" value="10:00"><input name="image-clear" type="checkbox">',
    );
    const fields = [field("date", "native"), field("image", "native")];
    const baseline = formSnapshot(form, fields, "Changed");
    form.querySelector<HTMLInputElement>('[name="date_1"]')!.value = "11:00";
    form.querySelector<HTMLInputElement>('[name="image-clear"]')!.checked =
      true;
    expect(
      formDifferences(baseline, formSnapshot(form, fields, "Changed")),
    ).toHaveLength(2);
  });
  it("detects newly added inline rows and labels their row number", () => {
    const form = createForm("");
    const fields = [field("lines-__prefix__-quantity")];
    const baseline = formSnapshot(form, fields, "Changed");
    form.innerHTML = '<input name="lines-0-quantity" value="2">';
    expect(
      formDifferences(baseline, formSnapshot(form, fields, "Changed")),
    ).toEqual([
      { label: "lines-__prefix__-quantity (1)", before: "—", after: "2" },
    ]);
  });
  it("omits technical, readonly and disabled fields", () => {
    const form = createForm(
      '<input name="csrf" value="secret"><input name="readonly" value="initial"><input name="disabled" value="initial" disabled>',
    );
    expect(
      formSnapshot(
        form,
        [
          field("csrf", "hidden"),
          field("readonly", "readonly"),
          { ...field("disabled"), disabled: true },
        ],
        "Changed",
      ).size,
    ).toBe(0);
  });
});

describe("saved view storage", () => {
  beforeEach(() => localStorage.clear());
  it("reads valid scoped views", () => {
    const view = {
      id: "one",
      name: "Pending",
      query: "?status__exact=new",
      view: "kanban",
      columns: [0, 1],
    };
    localStorage.setItem("owner", JSON.stringify([view]));
    expect(readSavedViews("owner", 3)).toEqual([view]);
    expect(readSavedViews("other-owner", 3)).toEqual([]);
  });
  it("ignores malformed JSON and invalid or obsolete columns", () => {
    localStorage.setItem("views", "invalid JSON");
    expect(readSavedViews("views", 3)).toEqual([]);
    localStorage.setItem(
      "views",
      JSON.stringify([
        null,
        {},
        { id: "bad", name: "Bad", query: "", view: "kanban", columns: [99] },
      ]),
    );
    expect(readSavedViews("views", 3)).toEqual([]);
  });
});
