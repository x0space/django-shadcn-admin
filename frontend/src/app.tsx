import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { flushSync } from "react-dom";
import {
  ArrowUpRightIcon,
  BoxesIcon,
  CommandIcon,
  GlobeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MoonIcon,
  Settings2Icon,
  SunIcon,
} from "lucide-react";
import { Providers, useApp, useStrings } from "./context";
import { ModelIcon } from "./model-icon";
import type { PageDescriptor, FormPage } from "./types";
import { AdminForm, Csrf } from "./adapters/forms";
import { FormField } from "./adapters/fields";
import { Dashboard, ModelList, DeleteConfirmation, History } from "./pages";
const ComponentCatalog = lazy(() =>
  import("./catalog").then((module) => ({ default: module.ComponentCatalog })),
);
import { Button, buttonVariants } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Separator } from "./components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./components/ui/command";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "./components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./components/ui/breadcrumb";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "./components/ui/sidebar";

function Preferences() {
  const { data, theme, setTheme, calendar, setCalendar } = useApp();
  const t = useStrings();
  const [language, setLanguage] = useState(data.language.split("-")[0]);
  const languageInput = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="icon" variant="ghost" aria-label={t.theme} />}
        >
          {theme === "dark" ? <MoonIcon /> : <SunIcon />}
        </DropdownMenuTrigger>
        <DropdownMenuContent dir={data.direction} align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t.theme}</DropdownMenuLabel>
            {["light", "dark", "system"].map((value) => (
              <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
                {t[value]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t.calendar}</DropdownMenuLabel>
            {(["gregorian", "jalali"] as const).map((value) => (
              <DropdownMenuItem key={value} onClick={() => setCalendar(value)}>
                {t[value]}
                {value === calendar && " ✓"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <form
        action={data.language_url}
        method="post"
        className="flex items-center gap-1"
      >
        <Csrf />
        <input type="hidden" name="next" value={data.path} />
        <GlobeIcon className="hidden size-4 text-muted-foreground sm:block" />
        <Select
          name="language"
          inputRef={languageInput}
          value={language}
          items={data.languages.map(([value, label]) => ({ value, label }))}
          onValueChange={(value) => {
            if (!value || value === language) return;
            // Commit the named input before Django receives the language POST.
            flushSync(() => setLanguage(value));
            languageInput.current?.form?.requestSubmit();
          }}
        >
          <SelectTrigger
            aria-label={t.language}
            className="w-24 border-none bg-transparent"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir={data.direction} alignItemWithTrigger={false}>
            {data.languages.map(([code, label]) => (
              <SelectItem key={code} value={code}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </form>
    </div>
  );
}
function Login({ page }: { page: FormPage }) {
  const { data } = useApp();
  const t = useStrings();
  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <a
          className="flex items-center gap-2 text-sm font-semibold"
          href={data.index_url}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BoxesIcon className="size-4" />
          </span>
          {data.brand}
        </a>
        <Preferences />
      </header>
      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm space-y-7">
          <div className="space-y-2 text-center">
            <Badge variant="outline">Django Shadcn</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t.welcome}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.login_description}
            </p>
          </div>
          <Card className="shadow-none">
            <CardHeader className="sr-only">
              <CardTitle>{t.signin}</CardTitle>
              <CardDescription>{t.login_description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form method="post" className="space-y-5">
                <Csrf />
                <input type="hidden" name="next" value={page.next} />
                {page.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>{page.errors.join(" ")}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-5">
                  {page.fieldsets
                    .flatMap((group) => group.lines.flat())
                    .map((field) => (
                      <FormField key={field.name} field={field} />
                    ))}
                </div>
                <Button type="submit" className="w-full">
                  {t.signin}
                  <ArrowUpRightIcon className="rtl:-rotate-90" />
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground">{t.help}</p>
        </div>
      </div>
    </main>
  );
}
function Shell() {
  const { data } = useApp();
  const t = useStrings();
  const [commandOpen, setCommandOpen] = useState(false);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  if (data.page.kind === "login") return <Login page={data.page} />;
  if (data.popup)
    return (
      <main
        id="main-content"
        className="popup-shell space-y-5"
        dir={data.direction}
      >
        <h1 className="text-xl font-semibold">{data.title}</h1>
        {data.page.kind === "form" && <AdminForm page={data.page} />}
        {data.page.kind === "delete" && <DeleteConfirmation page={data.page} />}
        {data.page.kind === "list" && <ModelList page={data.page} />}
      </main>
    );
  const models = data.navigation.flatMap((app) => app.models);
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3"
      >
        {t.details}
      </a>
      <Sidebar
        dir={data.direction}
        side={data.direction === "rtl" ? "right" : "left"}
        collapsible="icon"
      >
        <SidebarHeader className="p-5">
          <a href={data.index_url} className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BoxesIcon className="size-5" />
            </span>
            <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
              {data.brand}
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Django Shadcn
              </span>
            </span>
          </a>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<a href={data.index_url} />}
                  isActive={data.page.kind === "dashboard"}
                >
                  <LayoutDashboardIcon />
                  <span>{t.overview}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setCommandOpen(true)}>
                  <CommandIcon />
                  <span>{t.command}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <Separator />
          {data.navigation.map((app) => (
            <SidebarGroup key={app.name}>
              <SidebarGroupLabel>{app.name}</SidebarGroupLabel>
              <SidebarMenu>
                {app.models.map((model) => (
                  <SidebarMenuItem key={model.url}>
                    <SidebarMenuButton
                      render={<a href={model.url} />}
                      isActive={data.path.startsWith(model.url)}
                      tooltip={model.name}
                    >
                      <ModelIcon name={model.icon} />
                      <span>{model.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
          <SidebarGroup>
            <SidebarGroupLabel>{t.components}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<a href={data.catalog_url} />}
                  isActive={data.page.kind === "catalog"}
                >
                  <BoxesIcon />
                  <span>{t.components}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {data.custom_navigation.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton render={<a href={item.url} />}>
                    <ArrowUpRightIcon />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start gap-3 p-2"
                />
              }
            >
              <Avatar className="size-8">
                <AvatarFallback>
                  {data.user?.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">
                <bdi>{data.user?.name}</bdi>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent dir={data.direction} side="top" align="start">
              <DropdownMenuItem render={<a href={data.password_url} />}>
                <Settings2Icon />
                {t.password}
              </DropdownMenuItem>
              {data.site_url && (
                <DropdownMenuItem render={<a href={data.site_url} />}>
                  <ArrowUpRightIcon />
                  {t.view_site}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <form action={data.logout_url} method="post">
                <Csrf />
                <DropdownMenuItem
                  render={
                    <Button type="submit" variant="ghost" className="w-full" />
                  }
                >
                  <LogOutIcon />
                  {t.logout}
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger aria-label={t.navigation} />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink href={data.index_url}>
                    {data.brand}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block rtl:rotate-180" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-48 truncate">
                    {data.page.kind === "dashboard" ? t.overview : data.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Preferences />
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1500px] min-w-0 space-y-7 p-4 sm:p-8 xl:p-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {data.brand}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {data.page.kind === "dashboard" ? t.overview : data.title}
              </h1>
              {data.page.kind === "dashboard" && (
                <p className="text-sm text-muted-foreground">
                  {data.description}
                </p>
              )}
            </div>
            {data.page.kind === "form" && data.page.history_url && (
              <a
                href={data.page.history_url}
                className={buttonVariants({ variant: "outline" })}
              >
                {t.history}
              </a>
            )}
          </div>
          {data.messages.map((message, index) => (
            <Alert
              key={index}
              variant={
                message.level.includes("error") ? "destructive" : "default"
              }
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          ))}
          {data.page.kind === "dashboard" && <Dashboard page={data.page} />}
          {data.page.kind === "list" && <ModelList page={data.page} />}
          {data.page.kind === "form" && <AdminForm page={data.page} />}
          {data.page.kind === "delete" && (
            <DeleteConfirmation page={data.page} />
          )}
          {data.page.kind === "history" && <History page={data.page} />}
          {data.page.kind === "catalog" && (
            <Suspense fallback={<p>{t.components}…</p>}>
              <ComponentCatalog inventory={data.page.inventory} />
            </Suspense>
          )}
        </main>
        <footer className="mt-auto px-8 py-6 text-xs text-muted-foreground">
          {t.help}
        </footer>
      </SidebarInset>
      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        title={t.command}
        description={t.navigation}
      >
        <Command dir={data.direction}>
          <CommandInput placeholder={t.command} />
          <CommandList>
            <CommandEmpty>{t.no_results}</CommandEmpty>
            <CommandGroup heading={t.models}>
              {models.map((model) => (
                <CommandItem
                  key={model.url}
                  onSelect={() => {
                    window.location.href = model.url;
                  }}
                >
                  <ModelIcon name={model.icon} />
                  {model.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </SidebarProvider>
  );
}
export function AdminApp({ data }: { data: PageDescriptor }) {
  return (
    <Providers data={data}>
      <Shell />
    </Providers>
  );
}
