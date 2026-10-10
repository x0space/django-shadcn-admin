import {
  BoxIcon,
  UsersIcon,
  ReceiptIcon,
  FileTextIcon,
  FolderIcon,
  TagIcon,
  MessageSquareIcon,
  CalendarDaysIcon,
  ImageIcon,
  ShieldIcon,
  Settings2Icon,
  DatabaseIcon,
  MailIcon,
  GlobeIcon,
  ChartColumnIcon,
  KeyRoundIcon,
} from "lucide-react";
const icons = {
  box: BoxIcon,
  users: UsersIcon,
  receipt: ReceiptIcon,
  "file-text": FileTextIcon,
  folder: FolderIcon,
  tag: TagIcon,
  message: MessageSquareIcon,
  calendar: CalendarDaysIcon,
  image: ImageIcon,
  shield: ShieldIcon,
  settings: Settings2Icon,
  database: DatabaseIcon,
  mail: MailIcon,
  globe: GlobeIcon,
  chart: ChartColumnIcon,
  key: KeyRoundIcon,
};
export function ModelIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const Icon = icons[name as keyof typeof icons] || DatabaseIcon;
  return <Icon className={className} aria-hidden="true" />;
}
