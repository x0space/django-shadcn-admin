import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type { ComponentType } from "react";
import { DirectionProvider } from "./components/ui/direction";
import { TooltipProvider } from "./components/ui/tooltip";

const mounts = new Map<string, ComponentType<Record<string, unknown>>>();
export function registerComponent(
  name: string,
  component: ComponentType<Record<string, unknown>>,
) {
  if (!/^[A-Za-z][A-Za-z0-9_.-]*$/.test(name))
    throw new Error("Invalid component name");
  mounts.set(name, component);
}
export function mountComponents(root: ParentNode = document) {
  root
    .querySelectorAll<HTMLElement>("[data-shadcn-component]")
    .forEach((element) => {
      if (element.dataset.shadcnMounted) return;
      const name = element.dataset.shadcnComponent || "";
      const Component = mounts.get(name);
      if (!Component) {
        console.error(`Unknown Django Shadcn component: ${name}`);
        return;
      }
      const payload = document.getElementById(
        element.dataset.shadcnProps || "",
      );
      const props = JSON.parse(payload?.textContent || "{}") as Record<
        string,
        unknown
      >;
      const direction =
        element.closest("[dir]")?.getAttribute("dir") === "rtl" ? "rtl" : "ltr";
      flushSync(() =>
        createRoot(element).render(
          <DirectionProvider direction={direction}>
            <TooltipProvider>
              <Component {...props} />
            </TooltipProvider>
          </DirectionProvider>,
        ),
      );
      element.dataset.shadcnMounted = "true";
    });
}
