import { useId, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  FileIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";
import { Area, AreaChart, XAxis } from "recharts";
import { useApp, useStrings } from "./context";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./components/ui/accordion";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./components/ui/alert-dialog";
import { AspectRatio } from "./components/ui/aspect-ratio";
import {
  Attachment,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "./components/ui/attachment";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./components/ui/breadcrumb";
import { Bubble, BubbleContent } from "./components/ui/bubble";
import { Button } from "./components/ui/button";
import { ButtonGroup } from "./components/ui/button-group";
import { Calendar } from "./components/ui/calendar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./components/ui/carousel";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./components/ui/chart";
import { Checkbox } from "./components/ui/checkbox";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./components/ui/collapsible";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "./components/ui/combobox";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from "./components/ui/command";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "./components/ui/context-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
import { DirectionProvider } from "./components/ui/direction";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "./components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./components/ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "./components/ui/empty";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "./components/ui/field";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "./components/ui/hover-card";
import { Input } from "./components/ui/input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "./components/ui/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./components/ui/input-otp";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "./components/ui/item";
import { Kbd, KbdGroup } from "./components/ui/kbd";
import { Label } from "./components/ui/label";
import { Marker, MarkerContent, MarkerIcon } from "./components/ui/marker";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "./components/ui/menubar";
import {
  Message,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from "./components/ui/message";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "./components/ui/message-scroller";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "./components/ui/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./components/ui/pagination";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./components/ui/popover";
import { Progress } from "./components/ui/progress";
import {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireTitle,
  QuestionnaireDescription,
  QuestionnaireChoices,
  QuestionnaireChoice,
  QuestionnaireProgress,
  QuestionnaireActions,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSubmit,
} from "./components/ui/questionnaire";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./components/ui/resizable";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./components/ui/sheet";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./components/ui/sidebar";
import { Skeleton } from "./components/ui/skeleton";
import { Slider } from "./components/ui/slider";
import { Spinner } from "./components/ui/spinner";
import { Switch } from "./components/ui/switch";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "./components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Textarea } from "./components/ui/textarea";
import { toast } from "./components/ui/toast";
import { Toggle } from "./components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./components/ui/tooltip";
import { DateControl } from "./adapters/fields";
import { DataTable } from "./compositions";

export function ComponentPreview({
  slug,
  context,
}: {
  slug: string;
  context: "operations" | "onboarding";
}) {
  const id = useId();
  const t = useStrings();
  const { data } = useApp();
  const [count, setCount] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 9));
  const [search, setSearch] = useState("");
  const a = context === "operations" ? t.models : t.welcome;
  const b = context === "operations" ? t.recent : t.details;
  const list = [a, b, t.history];
  const action = (
    <Button
      onClick={() => {
        setCount(count + 1);
        toast.add({
          title: t.save,
          description: `${count + 1}`,
          type: "success",
        });
      }}
    >
      {t.save}
    </Button>
  );
  switch (slug) {
    case "accordion":
      return (
        <Accordion defaultValue={["details"]}>
          <AccordionItem value="details">
            <AccordionTrigger>{a}</AccordionTrigger>
            <AccordionContent>{b}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="activity">
            <AccordionTrigger>{t.recent}</AccordionTrigger>
            <AccordionContent>{t.activity_empty}</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    case "alert":
      return (
        <Alert>
          <CheckIcon />
          <AlertTitle>{a}</AlertTitle>
          <AlertDescription>{t.activity_empty}</AlertDescription>
        </Alert>
      );
    case "alert-dialog":
      return (
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            {t.delete}
          </AlertDialogTrigger>
          <AlertDialogContent dir={data.direction}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.confirm_delete}</AlertDialogTitle>
              <AlertDialogDescription>{a}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={() => setCount(count + 1)}>
                {t.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    case "aspect-ratio":
      return (
        <AspectRatio
          ratio={16 / 9}
          className="flex items-center justify-center rounded-xl bg-gradient-to-br from-muted to-accent"
        >
          <div className="text-center">
            <span className="text-3xl font-semibold tracking-tight">{a}</span>
            <p className="text-xs text-muted-foreground">16 : 9</p>
          </div>
        </AspectRatio>
      );
    case "attachment":
      return (
        <Attachment>
          <FileIcon className="size-8" />
          <AttachmentContent>
            <AttachmentTitle>
              {context === "operations" ? "invoice.pdf" : "welcome.pdf"}
            </AttachmentTitle>
            <AttachmentDescription>128 KB · PDF</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              onClick={() => toast.add({ title: a })}
              aria-label={t.details}
            >
              <ArrowRightIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      );
    case "avatar":
      return (
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback>
              {context === "operations" ? "SA" : "LH"}
            </AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>EP</AvatarFallback>
          </Avatar>
        </div>
      );
    case "badge":
      return (
        <div className="flex flex-wrap gap-2">
          <Badge>{a}</Badge>
          <Badge variant="secondary">{b}</Badge>
          <Badge variant="outline">{t.history}</Badge>
        </div>
      );
    case "breadcrumb":
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={data.index_url}>{a}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="rtl:rotate-180" />
            <BreadcrumbItem>
              <BreadcrumbPage>{b}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    case "bubble":
      return (
        <div className="space-y-3">
          <Bubble variant="secondary">
            <BubbleContent>{a}</BubbleContent>
          </Bubble>
          <Bubble align="end">
            <BubbleContent>{b}</BubbleContent>
          </Bubble>
        </div>
      );
    case "button":
      return (
        <div className="flex flex-wrap items-center gap-2">
          {action}
          <Button variant="outline" onClick={() => setCount(count + 1)}>
            {a}
          </Button>
          <Badge variant="secondary">{count}</Badge>
        </div>
      );
    case "button-group":
      return (
        <ButtonGroup>
          <Button variant="outline" onClick={() => setCount(count - 1)}>
            {t.previous}
          </Button>
          <Button variant="outline">{count}</Button>
          <Button variant="outline" onClick={() => setCount(count + 1)}>
            {t.next}
          </Button>
        </ButtonGroup>
      );
    case "calendar":
      return (
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          dir={data.direction}
        />
      );
    case "card":
      return (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{a}</CardTitle>
            <CardDescription>{b}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t.activity_empty}</p>
          </CardContent>
          <CardFooter>{action}</CardFooter>
        </Card>
      );
    case "carousel":
      return (
        <div className="px-10">
          <Carousel opts={{ direction: data.direction, loop: true }}>
            <CarouselContent>
              {list.map((item, i) => (
                <CarouselItem key={i}>
                  <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-xl font-medium">
                    {item}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious aria-label={t.previous} />
            <CarouselNext aria-label={t.next} />
          </Carousel>
        </div>
      );
    case "chart":
      return (
        <ChartContainer
          config={{ value: { label: a, color: "var(--chart-1)" } }}
          className="h-48 w-full"
        >
          <AreaChart
            data={[
              { label: a, value: 12 },
              { label: b, value: 24 },
              { label: t.history, value: 18 },
            ]}
            accessibilityLayer
          >
            <XAxis dataKey="label" reversed={data.direction === "rtl"} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="value"
              stroke="var(--chart-1)"
              fill="var(--chart-1)"
              fillOpacity={0.15}
            />
          </AreaChart>
        </ChartContainer>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2">
          <Checkbox defaultChecked={context === "operations"} />
          {a}
        </label>
      );
    case "collapsible":
      return (
        <Collapsible>
          <CollapsibleTrigger render={<Button variant="outline" />}>
            {a}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 rounded-md bg-muted p-3 text-sm">
            {b}
          </CollapsibleContent>
        </Collapsible>
      );
    case "combobox":
      return (
        <Combobox items={list}>
          <ComboboxInput aria-label={a} placeholder={a} />
          <ComboboxContent dir={data.direction}>
            <ComboboxEmpty>{t.no_results}</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      );
    case "command":
      return (
        <Command className="rounded-lg border">
          <CommandInput placeholder={t.search} />
          <CommandList>
            <CommandEmpty>{t.no_results}</CommandEmpty>
            <CommandGroup heading={a}>
              {list.map((item) => (
                <CommandItem
                  key={item}
                  onSelect={() => toast.add({ title: item })}
                >
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      );
    case "context-menu":
      return (
        <ContextMenu>
          <ContextMenuTrigger className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm">
            {a}
          </ContextMenuTrigger>
          <ContextMenuContent dir={data.direction}>
            <ContextMenuItem onClick={() => toast.add({ title: b })}>
              {b}
            </ContextMenuItem>
            <ContextMenuItem>{t.history}</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    case "data-table":
      return (
        <DataTable
          columns={[
            { accessorKey: "name", header: a },
            { accessorKey: "value", header: b },
          ]}
          data={list.map((name, i) => ({ name, value: i + 1 }))}
          searchLabel={t.search}
          emptyLabel={t.no_results}
          previousLabel={t.previous}
          nextLabel={t.next}
          pageSize={2}
        />
      );
    case "date-picker":
      return (
        <DateControl
          field={{
            name: id,
            id,
            label: a,
            errors: [],
            widget: "date",
            value: "2026-10-09",
          }}
        />
      );
    case "dialog":
      return (
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            {a}
          </DialogTrigger>
          <DialogContent dir={data.direction}>
            <DialogHeader>
              <DialogTitle>{a}</DialogTitle>
              <DialogDescription>{b}</DialogDescription>
            </DialogHeader>
            <Label htmlFor={id}>{t.details}</Label>
            <Input id={id} />
            <Button onClick={() => toast.add({ title: t.save })}>
              {t.save}
            </Button>
          </DialogContent>
        </Dialog>
      );
    case "direction":
      return (
        <DirectionProvider direction={data.direction}>
          <div
            dir={data.direction}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <span>{a}</span>
            <ArrowRightIcon className="size-4 rtl:rotate-180" />
            <bdi>hello@example.com</bdi>
          </div>
        </DirectionProvider>
      );
    case "drawer":
      return (
        <Drawer>
          <DrawerTrigger render={<Button variant="outline" />}>
            {a}
          </DrawerTrigger>
          <DrawerContent dir={data.direction}>
            <DrawerHeader>
              <DrawerTitle>{a}</DrawerTitle>
              <DrawerDescription>{b}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose render={<Button variant="outline" />}>
                {t.cancel}
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    case "dropdown-menu":
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            {t.actions}
          </DropdownMenuTrigger>
          <DropdownMenuContent dir={data.direction}>
            {list.map((item) => (
              <DropdownMenuItem
                key={item}
                onClick={() => toast.add({ title: item })}
              >
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case "empty":
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PlusIcon />
            </EmptyMedia>
            <EmptyTitle>{t.empty}</EmptyTitle>
            <EmptyDescription>{t.empty_description}</EmptyDescription>
          </EmptyHeader>
          {action}
        </Empty>
      );
    case "field":
      return (
        <Field>
          <FieldLabel htmlFor={id}>{a}</FieldLabel>
          <Input id={id} />
          <FieldDescription>{b}</FieldDescription>
          <FieldError />
        </Field>
      );
    case "hover-card":
      return (
        <HoverCard>
          <HoverCardTrigger render={<Button variant="link" />}>
            {a}
          </HoverCardTrigger>
          <HoverCardContent dir={data.direction}>
            <p className="text-sm font-medium">{a}</p>
            <p className="mt-2 text-xs text-muted-foreground">{b}</p>
          </HoverCardContent>
        </HoverCard>
      );
    case "input":
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>{a}</Label>
          <Input
            id={id}
            placeholder={
              context === "operations" ? "ORD-1024" : "hello@example.com"
            }
          />
        </div>
      );
    case "input-group":
      return (
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput aria-label={t.search} placeholder={t.search} />
        </InputGroup>
      );
    case "input-otp":
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>{a}</Label>
          <InputOTP id={id} maxLength={4} aria-label={a}>
            <InputOTPGroup>
              {[0, 1, 2, 3].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      );
    case "item":
      return (
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>{a}</ItemTitle>
            <ItemDescription>{b}</ItemDescription>
          </ItemContent>
          <ItemActions>{action}</ItemActions>
        </Item>
      );
    case "kbd":
      return (
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>{context === "operations" ? "K" : "B"}</Kbd>
          <span className="ms-2 text-sm">{a}</span>
        </KbdGroup>
      );
    case "label":
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>{a}</Label>
          <Input id={id} placeholder={b} />
        </div>
      );
    case "marker":
      return (
        <Marker variant="border">
          <MarkerIcon>
            <CheckIcon />
          </MarkerIcon>
          <MarkerContent>{a}</MarkerContent>
        </Marker>
      );
    case "menubar":
      return (
        <Menubar>
          {list.map((item) => (
            <MenubarMenu key={item}>
              <MenubarTrigger>{item}</MenubarTrigger>
              <MenubarContent dir={data.direction}>
                <MenubarItem onClick={() => toast.add({ title: t.save })}>
                  {t.save}
                </MenubarItem>
                <MenubarItem>{t.history}</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          ))}
        </Menubar>
      );
    case "message":
      return (
        <Message>
          <MessageHeader>{a}</MessageHeader>
          <MessageContent>
            <Bubble variant="secondary">
              <BubbleContent>{b}</BubbleContent>
            </Bubble>
          </MessageContent>
          <MessageFooter>09:41</MessageFooter>
        </Message>
      );
    case "message-scroller":
      return (
        <MessageScrollerProvider>
          <MessageScroller className="h-48">
            <MessageScrollerViewport>
              <MessageScrollerContent>
                {Array.from({ length: 8 }, (_, i) => (
                  <MessageScrollerItem key={i} id={`${id}-${i}`}>
                    <Bubble variant="secondary">
                      <BubbleContent>{i % 2 ? a : b}</BubbleContent>
                    </Bubble>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton aria-label={t.next} />
          </MessageScroller>
        </MessageScrollerProvider>
      );
    case "navigation-menu":
      return (
        <NavigationMenu>
          <NavigationMenuList>
            {list.map((item) => (
              <NavigationMenuItem key={item}>
                <NavigationMenuLink href="#main-content">
                  {item}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      );
    case "pagination":
      return (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#main-content"
                aria-label={t.previous}
              />
            </PaginationItem>
            {[1, 2, 3].map((i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#main-content"
                  isActive={i === (context === "operations" ? 1 : 2)}
                >
                  {i}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#main-content" aria-label={t.next} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
    case "popover":
      return (
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            {a}
          </PopoverTrigger>
          <PopoverContent dir={data.direction}>
            <Label htmlFor={id}>{b}</Label>
            <Input id={id} className="mt-2" />
          </PopoverContent>
        </Popover>
      );
    case "progress":
      return (
        <div className="space-y-3">
          <Progress value={context === "operations" ? 65 : 25} aria-label={a} />
          <p className="text-sm text-muted-foreground">{a}</p>
        </div>
      );
    case "questionnaire":
      return (
        <Questionnaire
          onSubmit={(event) => {
            event.preventDefault();
            toast.add({ title: t.save });
          }}
        >
          <QuestionnaireProgress />
          <QuestionnaireItem name="workspace" required>
            <QuestionnaireTitle>{a}</QuestionnaireTitle>
            <QuestionnaireDescription>{b}</QuestionnaireDescription>
            <QuestionnaireChoices>
              {list.map((item) => (
                <QuestionnaireChoice key={item} value={item}>
                  {item}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
          </QuestionnaireItem>
          <QuestionnaireItem name="appearance">
            <QuestionnaireTitle>{t.theme}</QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="light">{t.light}</QuestionnaireChoice>
              <QuestionnaireChoice value="dark">{t.dark}</QuestionnaireChoice>
            </QuestionnaireChoices>
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnairePrevious>{t.previous}</QuestionnairePrevious>
            <QuestionnaireNext>{t.next}</QuestionnaireNext>
            <QuestionnaireSubmit>{t.save}</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
      );
    case "radio-group":
      return (
        <RadioGroup defaultValue={a} aria-label={a}>
          {list.map((item, i) => (
            <label key={item} className="flex items-center gap-2">
              <RadioGroupItem id={`${id}-${i}`} value={item} />
              {item}
            </label>
          ))}
        </RadioGroup>
      );
    case "resizable":
      return (
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-40 rounded-lg border"
        >
          <ResizablePanel defaultSize="40%">
            <div className="p-4 text-sm">{a}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>
            <div className="p-4 text-sm">{b}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    case "scroll-area":
      return (
        <ScrollArea className="h-40 rounded-lg border p-4">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="border-b py-3 text-sm">
              {i % 2 ? a : b}
            </div>
          ))}
        </ScrollArea>
      );
    case "native-select":
    case "select":
      return (
        <Select defaultValue={a}>
          <SelectTrigger aria-label={a}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir={data.direction}>
            {list.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "separator":
      return (
        <div className="space-y-4">
          <p className="text-sm">{a}</p>
          <Separator />
          <p className="text-sm text-muted-foreground">{b}</p>
        </div>
      );
    case "sheet":
      return (
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>{a}</SheetTrigger>
          <SheetContent
            dir={data.direction}
            side={data.direction === "rtl" ? "right" : "left"}
          >
            <SheetHeader>
              <SheetTitle>{a}</SheetTitle>
              <SheetDescription>{b}</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );
    case "sidebar":
      return (
        <SidebarProvider className="min-h-0">
          <Sidebar collapsible="none" className="w-full rounded-lg border">
            <SidebarContent>
              <SidebarGroup>
                <SidebarMenu>
                  {list.map((item) => (
                    <SidebarMenuItem key={item}>
                      <SidebarMenuButton
                        onClick={() => toast.add({ title: item })}
                      >
                        <SettingsIcon />
                        <span>{item}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
    case "skeleton":
      return (
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      );
    case "slider":
      return (
        <div className="space-y-4">
          <Label>{a}</Label>
          <Slider
            defaultValue={[context === "operations" ? 65 : 25]}
            max={100}
            aria-label={a}
          />
        </div>
      );
    case "spinner":
      return (
        <Button disabled>
          <Spinner />
          {a}
        </Button>
      );
    case "switch":
      return (
        <label className="flex items-center gap-3">
          <Switch defaultChecked={context === "operations"} />
          {a}
        </label>
      );
    case "table":
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{a}</TableHead>
              <TableHead>{b}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((item, i) => (
              <TableRow key={item}>
                <TableCell>{item}</TableCell>
                <TableCell>{i + 1}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    case "tabs":
      return (
        <Tabs defaultValue="first">
          <TabsList>
            <TabsTrigger value="first">{a}</TabsTrigger>
            <TabsTrigger value="second">{b}</TabsTrigger>
          </TabsList>
          <TabsContent value="first" className="p-3 text-sm">
            {t.activity_empty}
          </TabsContent>
          <TabsContent value="second" className="p-3 text-sm">
            {t.empty_description}
          </TabsContent>
        </Tabs>
      );
    case "textarea":
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>{a}</Label>
          <Textarea id={id} placeholder={b} />
        </div>
      );
    case "toast":
      return action;
    case "toggle":
      return <Toggle aria-label={a}>{a}</Toggle>;
    case "toggle-group":
      return (
        <ToggleGroup defaultValue={[a]}>
          {list.map((item) => (
            <ToggleGroupItem key={item} value={item} aria-label={item}>
              {item}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      );
    case "tooltip":
      return (
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>
            {a}
          </TooltipTrigger>
          <TooltipContent dir={data.direction}>{b}</TooltipContent>
        </Tooltip>
      );
    case "typography":
      return (
        <article className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">{a}</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            {t.activity_empty}
          </p>
          <blockquote className="border-s-2 ps-4 text-sm italic">
            {b}
          </blockquote>
          <code className="rounded bg-muted px-2 py-1 text-xs" dir="ltr">
            django_shadcn
          </code>
        </article>
      );
    default:
      throw new Error(`Missing preview for official component ${slug}`);
  }
}
