import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  Clock,
  Folder,
  Library,
  NotepadText,
  Search,
  SquarePen,
} from "lucide-react";
import { cn } from "@framework/ui/lib/utils";

export type ProjectItem = {
  id: string;
  name: string;
  lastActive?: string;
  current?: boolean;
};

export type ChatItem = {
  id: string;
  title: string;
  lastActive?: string;
};

export type SidebarData = {
  pinned: ChatItem[];
  projects: ProjectItem[];
  chats: ChatItem[];
};

export const EMPTY_SIDEBAR: SidebarData = {
  pinned: [],
  projects: [],
  chats: [],
};

const NAV_ITEMS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "new-chat", label: "New chat", icon: SquarePen },
  { id: "library", label: "Library", icon: Library },
  { id: "search", label: "Search", icon: Search },
  { id: "scheduled", label: "Scheduled", icon: Clock },
];

function Row({
  label,
  icon: Icon,
  meta,
  active,
  onClick,
}: {
  label: string;
  icon?: LucideIcon;
  meta?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-stone-700 transition-colors hover:bg-stone-200/55 dark:text-stone-300 dark:hover:bg-stone-800/70"
    >
      {Icon && (
        <Icon
          className="size-4 shrink-0 text-stone-500 dark:text-stone-400"
          strokeWidth={1.75}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {meta && (
        <span className="shrink-0 text-xs text-stone-400 dark:text-stone-500">
          {meta}
        </span>
      )}
      {active && (
        <span className="size-2 shrink-0 rounded-full bg-stone-700 dark:bg-stone-300" />
      )}
    </button>
  );
}

function Section({
  title,
  emptyLabel,
  actionIcon: ActionIcon,
  actionLabel,
  children,
}: {
  title: string;
  emptyLabel?: string;
  actionIcon?: LucideIcon;
  actionLabel?: string;
  children?: React.ReactNode;
}) {
  const hasAction = Boolean(ActionIcon && actionLabel);

  return (
    <>
      <div
        className={cn(
          "group/section mt-4 flex items-center rounded-lg transition-colors hover:bg-stone-200/55 focus-within:bg-stone-200/55 dark:hover:bg-stone-800/70 dark:focus-within:bg-stone-800/70",
          hasAction
            ? "w-full gap-2 px-2 py-1.5 text-left text-[13px] text-stone-700 dark:text-stone-300"
            : "h-7 gap-0.5 px-2 text-xs text-stone-400 dark:text-stone-500"
        )}
      >
        <span className="min-w-0 truncate">{title}</span>
        {hasAction && (
          <ChevronRight
            className="size-4 shrink-0 text-stone-500 opacity-0 transition-opacity group-hover/section:opacity-100 group-focus-within/section:opacity-100 dark:text-stone-400"
            strokeWidth={2}
          />
        )}
        {ActionIcon && actionLabel && (
          <button
            type="button"
            className="ml-auto flex size-5 items-center justify-center rounded-md text-stone-500 opacity-0 transition-opacity group-hover/section:opacity-100 group-focus-within/section:opacity-100 hover:text-stone-700 focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:outline-none dark:text-stone-400 dark:hover:text-stone-200"
            aria-label={actionLabel}
          >
            <ActionIcon className="size-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-px">
        {children ?? (
          <div className="px-2 py-1.5 text-[13px] text-stone-400/90 dark:text-stone-500/90">
            {emptyLabel}
          </div>
        )}
      </div>
    </>
  );
}

export function Sidebar({
  data = EMPTY_SIDEBAR,
  expanded = true,
  showRightBorder = true,
  onOpenLibrary,
}: {
  data?: SidebarData;
  expanded?: boolean;
  showRightBorder?: boolean;
  onOpenLibrary?: () => void;
}) {
  return (
    <aside
      className={cn(
        "flex shrink-0 overflow-hidden bg-stone-100/70 transition-[width] duration-200 ease-out dark:bg-stone-950",
        expanded ? "w-60" : "w-0",
        showRightBorder &&
          expanded &&
          "border-r border-stone-200/70 dark:border-stone-800"
      )}
    >
      <div
        className={cn(
          "flex w-60 shrink-0 flex-col overflow-y-auto px-3 py-3 transition-opacity duration-150 ease-out",
          expanded ? "opacity-100 delay-75" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!expanded}
        inert={expanded ? undefined : true}
      >
        <nav className="flex flex-col gap-px">
          {NAV_ITEMS.map((item) => (
            <Row
              key={item.id}
              label={item.label}
              icon={item.icon}
              onClick={item.id === "library" ? onOpenLibrary : undefined}
            />
          ))}
        </nav>

        {data.pinned.length > 0 && (
          <Section title="Pinned">
            {data.pinned.map((chat) => (
              <Row key={chat.id} label={chat.title} meta={chat.lastActive} />
            ))}
          </Section>
        )}

        <Section
          title="Projects"
          emptyLabel="No projects yet"
          actionIcon={Folder}
          actionLabel="New project"
        >
          {data.projects.length > 0
            ? data.projects.map((project) => (
                <Row
                  key={project.id}
                  label={project.name}
                  icon={NotepadText}
                  meta={project.lastActive}
                  active={project.current}
                />
              ))
            : undefined}
        </Section>

        <Section
          title="Chats"
          emptyLabel="No chats yet"
          actionIcon={SquarePen}
          actionLabel="New chat"
        >
          {data.chats.length > 0
            ? data.chats.map((chat) => (
                <Row key={chat.id} label={chat.title} meta={chat.lastActive} />
              ))
            : undefined}
        </Section>
      </div>
    </aside>
  );
}
