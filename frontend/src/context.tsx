import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { PageDescriptor } from "./types";
import { DirectionProvider } from "./components/ui/direction";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toast";

interface AppContext {
  data: PageDescriptor;
  calendar: "gregorian" | "jalali";
  setCalendar: (value: "gregorian" | "jalali") => void;
  theme: string;
  setTheme: (value: string) => void;
}
const Context = createContext<AppContext | null>(null);
export function readPreference(key: string, fallback: string) {
  try {
    return localStorage.getItem(`django-shadcn:${key}`) || fallback;
  } catch {
    return fallback;
  }
}
function writePreference(key: string, value: string) {
  try {
    localStorage.setItem(`django-shadcn:${key}`, value);
  } catch {
    /* Storage can be disabled. */
  }
}
export function Providers({
  data,
  children,
}: {
  data: PageDescriptor;
  children: ReactNode;
}) {
  const [theme, updateTheme] = useState(readPreference("theme", data.theme));
  const [calendar, updateCalendar] = useState<"gregorian" | "jalali">(
    readPreference("calendar", data.calendar) === "jalali"
      ? "jalali"
      : "gregorian",
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark" || (theme === "system" && media.matches),
      );
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return (
    <Context.Provider
      value={{
        data,
        calendar,
        setCalendar: (value) => {
          updateCalendar(value);
          writePreference("calendar", value);
        },
        theme,
        setTheme: (value) => {
          updateTheme(value);
          writePreference("theme", value);
        },
      }}
    >
      <DirectionProvider direction={data.direction}>
        <TooltipProvider>
          <Toaster>{children}</Toaster>
        </TooltipProvider>
      </DirectionProvider>
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("This component needs Django Shadcn Providers.");
  return value;
}
export function useStrings() {
  return useApp().data.strings;
}
