import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Bot, FileText, Mail, Newspaper } from "lucide-react";
import { cn } from "@framework/ui/lib/utils";
import type { InboxItem, InboxItemKind } from "./data";

export const INBOX_KIND_META: Record<
  InboxItemKind,
  { label: string; icon: LucideIcon }
> = {
  email: { label: "Email", icon: Mail },
  approval: { label: "Approvals", icon: BadgeCheck },
  file: { label: "Files", icon: FileText },
  agent: { label: "Agents", icon: Bot },
  digest: { label: "Digests", icon: Newspaper },
};

export function inboxItemIcon(item: InboxItem): LucideIcon {
  return INBOX_KIND_META[item.kind].icon;
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Emails get a person-style initials circle; everything else a kind glyph. */
export function InboxAvatar({
  item,
  className,
  iconClassName,
  initialsClassName,
}: {
  item: InboxItem;
  className?: string;
  iconClassName?: string;
  initialsClassName?: string;
}) {
  if (item.kind === "email") {
    return (
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300",
          className
        )}
      >
        <span className={cn("text-[10px] font-medium", initialsClassName)}>
          {initials(item.from)}
        </span>
      </span>
    );
  }
  const Icon = INBOX_KIND_META[item.kind].icon;
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
        className
      )}
    >
      <Icon className={cn("size-3.5", iconClassName)} strokeWidth={1.75} />
    </span>
  );
}
