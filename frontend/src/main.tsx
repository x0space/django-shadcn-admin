import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import * as React from "react";
import { AdminApp } from "./app";
import { mountComponents, registerComponent } from "./mount";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Alert } from "./components/ui/alert";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { registerFieldAdapter } from "./adapters/fields";
import { useApp, useStrings } from "./context";
import type { PageDescriptor } from "./types";
import "./styles.css";

registerComponent("Button", Button);
registerComponent("Card", Card);
registerComponent("Alert", Alert);
registerComponent("Badge", Badge);
registerComponent("Input", Input);
const data = document.getElementById("django-shadcn-data");
const root = document.getElementById("django-shadcn-root");
if (root && data) {
  const descriptor = JSON.parse(data.textContent || "{}") as PageDescriptor;
  if (descriptor.version !== 1)
    throw new Error("Unsupported Django Shadcn descriptor version");
  document.documentElement.classList.toggle(
    "dark",
    (() => {
      try {
        return localStorage.getItem("django-shadcn:theme") || descriptor.theme;
      } catch {
        return descriptor.theme;
      }
    })() === "dark",
  );
  flushSync(() => createRoot(root).render(<AdminApp data={descriptor} />));
}
Object.assign(window, {
  DjangoShadcn: {
    React,
    registerComponent,
    mountComponents,
    registerFieldAdapter,
    useApp,
    useStrings,
    ui: { Button, Card, Alert, Badge, Input },
  },
});
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", () => mountComponents(), {
    once: true,
  });
else mountComponents();
