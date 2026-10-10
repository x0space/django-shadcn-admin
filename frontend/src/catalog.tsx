import { useState } from "react";
import { ArrowUpRightIcon, SearchIcon } from "lucide-react";
import type { ComponentInventory } from "./types";
import { useStrings } from "./context";
import { ComponentPreview } from "./previews";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { ScrollArea } from "./components/ui/scroll-area";

export function ComponentCatalog({
  inventory,
}: {
  inventory: ComponentInventory[];
}) {
  const initial =
    new URLSearchParams(window.location.search).get("component") || "button";
  const [active, setActive] = useState(
    inventory.find((i) => i.slug === initial) || inventory[0],
  );
  const [search, setSearch] = useState("");
  const t = useStrings();
  if (!active) return null;
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_1fr]">
      <Card className="h-fit shadow-none">
        <CardHeader>
          <CardTitle>{t.components}</CardTitle>
          <CardDescription>{inventory.length} · Base UI · RTL</CardDescription>
          <div className="relative">
            <SearchIcon className="absolute start-3 top-2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.search}
              aria-label={t.search}
              className="ps-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-60 lg:h-[65vh]">
            <div className="space-y-1">
              {inventory
                .filter((item) =>
                  item.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((item) => (
                  <Button
                    key={item.slug}
                    variant={item.slug === active.slug ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActive(item);
                      const url = new URL(window.location.href);
                      url.searchParams.set("component", item.slug);
                      history.replaceState(null, "", url);
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{active.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upstream components. Two practical compositions.
            </p>
          </div>
          <a
            href={active.upstream}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
          >
            shadcn/ui <ArrowUpRightIcon className="size-3" />
          </a>
        </div>
        {(["operations", "onboarding"] as const).map((context) => (
          <Card
            key={`${active.slug}-${context}`}
            className="min-w-0 shadow-none"
            data-component-example={`${active.slug}:${context}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {context === "operations" ? t.models : t.welcome}
                </CardTitle>
                <Badge variant="outline">{context}</Badge>
              </div>
            </CardHeader>
            <CardContent className="min-w-0">
              <ComponentPreview slug={active.slug} context={context} />
            </CardContent>
          </Card>
        ))}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">React import</CardTitle>
          </CardHeader>
          <CardContent>
            <pre
              className="overflow-x-auto rounded-lg bg-muted p-4 text-xs"
              dir="ltr"
            >{`import { ${active.name.replaceAll(" ", "")} } from "@django-shadcn/ui"`}</pre>
            <p className="mt-3 text-xs text-muted-foreground">
              Full compound exports and props follow the linked upstream API.
              Date Picker, Data Table and Typography are compositions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
