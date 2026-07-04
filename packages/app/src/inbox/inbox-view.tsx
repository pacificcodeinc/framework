import { useMemo, useState } from "react";
import {
  Archive,
  Check,
  CheckCheck,
  FileText,
  Inbox,
  Mail,
  MailOpen,
  Search,
  X,
} from "lucide-react";
import { cn } from "@framework/ui/lib/utils";
import { scrollHorizontallyOnWheel } from "../components/horizontal-wheel";
import {
  DAY_ORDER,
  unreadCount,
  type InboxItem,
  type InboxItemKind,
} from "./data";
import { INBOX_KIND_META, InboxAvatar } from "./kind";

type InboxFilter = "all" | "unread" | InboxItemKind;

const FILTERS: Array<{ id: InboxFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "email", label: INBOX_KIND_META.email.label },
  { id: "approval", label: INBOX_KIND_META.approval.label },
  { id: "agent", label: INBOX_KIND_META.agent.label },
  { id: "file", label: INBOX_KIND_META.file.label },
];

function ReadToggle({
  item,
  onSetRead,
}: {
  item: InboxItem;
  onSetRead: (id: string, unread: boolean) => void;
}) {
  const Icon = item.unread ? MailOpen : Mail;
  return (
    <button
      type="button"
      aria-label={item.unread ? "Mark as read" : "Mark as unread"}
      title={item.unread ? "Mark as read" : "Mark as unread"}
      onClick={() => onSetRead(item.id, !item.unread)}
      className="flex size-6 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-300"
    >
      <Icon className="size-3.5" strokeWidth={1.75} />
    </button>
  );
}

function ArchiveButton({
  item,
  onArchive,
}: {
  item: InboxItem;
  onArchive: (id: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Archive ${item.subject}`}
      title="Archive"
      onClick={() => onArchive(item.id)}
      className="flex size-6 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-300"
    >
      <Archive className="size-3.5" strokeWidth={1.75} />
    </button>
  );
}

function MessageRow({
  item,
  isSelected,
  selectionActive,
  onOpen,
  onToggleSelect,
  onSetRead,
  onArchive,
}: {
  item: InboxItem;
  isSelected: boolean;
  selectionActive: boolean;
  onOpen: () => void;
  onToggleSelect: () => void;
  onSetRead: (id: string, unread: boolean) => void;
  onArchive: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "group relative isolate flex gap-2.5 rounded-xl px-2 py-2 transition-colors",
        isSelected
          ? "bg-stone-100 hover:bg-stone-200/70 dark:bg-stone-800/70 dark:hover:bg-stone-800"
          : "hover:bg-stone-100 dark:hover:bg-stone-800/60"
      )}
    >
      {/* The avatar doubles as the selection checkbox, like most mail clients. */}
      <div className="relative mt-0.5 size-7 shrink-0">
        <InboxAvatar
          item={item}
          className={cn(
            "absolute inset-0 transition-opacity",
            isSelected || selectionActive
              ? "opacity-0"
              : "group-hover:opacity-0"
          )}
        />
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`Select ${item.subject}`}
          onClick={onToggleSelect}
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center transition-opacity",
            isSelected || selectionActive
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded border transition-colors",
              isSelected
                ? "border-sky-500 bg-sky-500 text-white"
                : "border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-900"
            )}
          >
            {isSelected && <Check className="size-3" strokeWidth={2.5} />}
          </span>
        </button>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:content-['']"
      >
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[12px]",
              item.unread
                ? "text-stone-900 dark:text-white"
                : "text-stone-500 dark:text-stone-500"
            )}
          >
            {item.from}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-stone-400 transition-opacity group-hover:opacity-0 dark:text-stone-500">
            {item.time}
          </span>
        </div>
        <div
          className={cn(
            "truncate text-[13px]",
            item.unread
              ? "text-stone-900 dark:text-white"
              : "text-stone-500 dark:text-stone-500"
          )}
        >
          {item.subject}
        </div>
        <div className="truncate text-[12px] text-stone-400 dark:text-stone-500">
          {item.preview}
        </div>
      </button>
      <div className="absolute top-1.5 right-1.5 z-10 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <ReadToggle item={item} onSetRead={onSetRead} />
        <ArchiveButton item={item} onArchive={onArchive} />
      </div>
    </div>
  );
}

/** A single message opened as its own panel tab. */
export function InboxMessageView({
  item,
  onSetRead,
  onArchive,
  onOpenFile,
}: {
  item: InboxItem;
  onSetRead: (id: string, unread: boolean) => void;
  onArchive: (id: string) => void;
  onOpenFile?: (fileId: string) => void;
}) {
  return (
    <div className="h-full min-h-0 overflow-y-auto px-4 py-3">
      <div className="flex items-start gap-2.5">
        <InboxAvatar
          item={item}
          className="size-9 rounded-xl"
          iconClassName="size-4"
          initialsClassName="text-[12px]"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-stone-800 dark:text-stone-100">
            {item.from}
          </div>
          <div className="truncate text-[11px] text-stone-400 dark:text-stone-500">
            {item.fromEmail ?? item.project ?? INBOX_KIND_META[item.kind].label}
            {" · "}
            {item.time}
          </div>
        </div>
        <div className="flex gap-0.5">
          <ReadToggle item={item} onSetRead={onSetRead} />
          <ArchiveButton item={item} onArchive={onArchive} />
        </div>
      </div>

      <h2 className="mt-3 text-[15px] leading-snug font-medium text-stone-800 dark:text-stone-100">
        {item.subject}
      </h2>

      <div className="mt-2 flex flex-col gap-2">
        {item.body.map((paragraph) => (
          <p
            key={paragraph}
            className="text-[13px] leading-relaxed text-stone-600 dark:text-stone-300"
            data-selectable="true"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {(item.kind === "approval" || (item.fileId && onOpenFile)) && (
        <div className="mt-4 flex items-center gap-1.5">
          {item.kind === "approval" && (
            <>
              {/* Approval wiring lands with the agent runtime; both just clear the item for now. */}
              <button
                type="button"
                onClick={() => onArchive(item.id)}
                className="rounded-full bg-stone-900 px-3 py-1 text-[12px] text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              >
                {item.approveLabel ?? "Approve"}
              </button>
              <button
                type="button"
                onClick={() => onArchive(item.id)}
                className="rounded-full border border-stone-200 px-3 py-1 text-[12px] text-stone-600 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Dismiss
              </button>
            </>
          )}
          {item.fileId && onOpenFile && (
            <button
              type="button"
              onClick={() => onOpenFile(item.fileId!)}
              className="flex items-center gap-1.5 rounded-full border border-stone-200 px-2.5 py-1 text-[12px] text-stone-600 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <FileText className="size-3" strokeWidth={2} />
              Open file
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function InboxView({
  items,
  onOpenItem,
  onSetRead,
  onArchive,
  onMarkAllRead,
}: {
  items: InboxItem[];
  onOpenItem: (item: InboxItem) => void;
  onSetRead: (id: string, unread: boolean) => void;
  onArchive: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set()
  );
  const [isListScrolled, setIsListScrolled] = useState(false);

  const unread = unreadCount(items);

  // Drop selections that no longer exist (archived from a message tab, etc.).
  const selected = useMemo(
    () =>
      new Set([...selectedIds].filter((id) => items.some((i) => i.id === id))),
    [selectedIds, items]
  );
  const selectionActive = selected.size > 0;

  const toggleSelect = (id: string) =>
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulkSetRead = (unreadValue: boolean) => {
    for (const id of selected) onSetRead(id, unreadValue);
  };

  const bulkArchive = () => {
    for (const id of selected) onArchive(id);
    setSelectedIds(new Set());
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (filter === "all" ||
          (filter === "unread" ? item.unread : item.kind === filter)) &&
        (!q ||
          [item.from, item.subject, item.preview, item.project ?? ""].some(
            (field) => field.toLowerCase().includes(q)
          ))
    );
  }, [items, filter, query]);

  const groups = useMemo(
    () =>
      DAY_ORDER.map(
        (day) => [day, visible.filter((item) => item.day === day)] as const
      ).filter(([, dayItems]) => dayItems.length > 0),
    [visible]
  );

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1.5 px-8 text-center">
        <Inbox
          className="mb-1 size-5 text-stone-300 dark:text-stone-600"
          strokeWidth={1.5}
        />
        <div className="text-[13px] text-stone-600 dark:text-stone-300">
          You're all caught up
        </div>
        <div className="text-[12px] text-stone-400 dark:text-stone-500">
          Email, approvals, and files that need review land here.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Search + filters; search swaps for bulk actions while selecting */}
      <div
        className={cn(
          "flex flex-col gap-2 border-b px-2 pt-1 pb-2 transition-colors",
          isListScrolled
            ? "border-stone-200/70 dark:border-stone-800"
            : "border-transparent"
        )}
      >
        {selectionActive ? (
          <div className="flex h-8 items-center gap-1 rounded-lg border border-transparent bg-accent px-1 text-accent-foreground">
            <button
              type="button"
              aria-label="Clear selection"
              onClick={() => setSelectedIds(new Set())}
              className="flex size-7 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-300"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
            <span className="text-[13px] tabular-nums text-stone-600 dark:text-stone-300">
              {selected.size} selected
            </span>
            <span className="flex-1" />
            <button
              type="button"
              aria-label="Mark selected as read"
              title="Mark as read"
              onClick={() => bulkSetRead(false)}
              className="flex size-7 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-300"
            >
              <MailOpen className="size-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Mark selected as unread"
              title="Mark as unread"
              onClick={() => bulkSetRead(true)}
              className="flex size-7 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-300"
            >
              <Mail className="size-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Archive selected"
              title="Archive"
              onClick={bulkArchive}
              className="flex size-7 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-300"
            >
              <Archive className="size-3.5" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <label className="flex h-8 items-center gap-2 rounded-lg border border-transparent bg-accent px-2.5 text-accent-foreground focus-within:border-ring/40">
            <Search className="size-3.5 shrink-0 opacity-55" strokeWidth={2} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inbox"
              className="w-full bg-transparent text-[13px] text-inherit outline-none placeholder:text-muted-foreground"
            />
          </label>
        )}
        <div className="flex items-center gap-2">
          <div
            onWheel={scrollHorizontallyOnWheel}
            className="flex min-w-0 flex-1 flex-nowrap gap-1 overflow-x-auto overscroll-x-contain pr-5 [mask-image:linear-gradient(to_right,black_0,black_calc(100%-24px),transparent_100%)] [scrollbar-width:none] [-webkit-mask-image:linear-gradient(to_right,black_0,black_calc(100%-24px),transparent_100%)] [&::-webkit-scrollbar]:hidden"
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-[12px] transition-colors",
                  filter === f.id
                    ? "text-stone-800 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800"
                    : "text-stone-400 hover:bg-stone-100 hover:text-stone-500 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-400"
                )}
              >
                {f.id === "unread" && unread > 0
                  ? `${f.label} · ${unread}`
                  : f.label}
              </button>
            ))}
          </div>
          {unread > 0 && (
            <button
              type="button"
              aria-label="Mark all as read"
              title="Mark all as read"
              onClick={onMarkAllRead}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-500 dark:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-400"
            >
              <CheckCheck className="size-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Messages grouped by day */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-4"
        onScroll={(event) =>
          setIsListScrolled(event.currentTarget.scrollTop > 0)
        }
      >
        {groups.length === 0 && (
          <div className="px-4 py-10 text-center text-[13px] text-stone-400 dark:text-stone-500">
            {query ? <>Nothing matches “{query}”.</> : "Nothing here."}
          </div>
        )}
        {groups.map(([day, dayItems]) => {
          const dayUnread = unreadCount(dayItems);
          return (
            <section key={day} className="relative">
              <div className="sticky top-0 z-30 mb-1 flex items-baseline gap-2 bg-white px-2 pt-2 pb-1.5 dark:bg-stone-900">
                <span className="text-[12px] font-medium text-stone-600 dark:text-stone-300">
                  {day}
                </span>
                {dayUnread > 0 && (
                  <span className="text-[11px] tabular-nums text-stone-400 dark:text-stone-500">
                    {dayUnread} unread
                  </span>
                )}
              </div>
              {dayItems.map((item) => (
                <MessageRow
                  key={item.id}
                  item={item}
                  isSelected={selected.has(item.id)}
                  selectionActive={selectionActive}
                  onOpen={() => onOpenItem(item)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  onSetRead={onSetRead}
                  onArchive={onArchive}
                />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
