import type { LucideIcon } from "lucide-react";
import { Inbox, Library, ListTodo, Zap } from "lucide-react";

export type PlaceholderPanelId = "tasks" | "automations";

export type LauncherItemId = "library" | "inbox" | PlaceholderPanelId;

export const PLACEHOLDER_PANELS: Record<
  PlaceholderPanelId,
  { title: string; icon: LucideIcon; empty: string; hint: string }
> = {
  tasks: {
    title: "Tasks",
    icon: ListTodo,
    empty: "No tasks yet",
    hint: "Work Framework is running or waiting on will show up here.",
  },
  automations: {
    title: "Automations",
    icon: Zap,
    empty: "No automations yet",
    hint: "Scheduled and recurring agent runs will live here.",
  },
};

export const LAUNCHER_ITEMS: Array<{
  id: LauncherItemId;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
}> = [
  { id: "library", label: "Library", icon: Library, shortcut: "Ctrl+P" },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "automations", label: "Automations", icon: Zap },
];

export function PanelLauncher({
  onOpenItem,
}: {
  onOpenItem: (id: LauncherItemId) => void;
}) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="flex w-full max-w-80 flex-col gap-1.5">
        {LAUNCHER_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpenItem(item.id)}
            className="flex items-center gap-2.5 rounded-lg bg-stone-100/80 px-3 py-2.5 text-left text-[13px] text-stone-700 transition-colors hover:bg-stone-200/70 dark:bg-stone-800/50 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <item.icon
              className="size-4 shrink-0 text-stone-500 dark:text-stone-400"
              strokeWidth={1.75}
            />
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="inline-flex items-center self-center leading-none text-[11px] text-stone-400 dark:text-stone-500">
                {item.shortcut}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PlaceholderView({ id }: { id: PlaceholderPanelId }) {
  const panel = PLACEHOLDER_PANELS[id];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-8 text-center">
      <panel.icon
        className="mb-1 size-5 text-stone-300 dark:text-stone-600"
        strokeWidth={1.5}
      />
      <div className="text-[13px] text-stone-600 dark:text-stone-300">
        {panel.empty}
      </div>
      <div className="text-[12px] text-stone-400 dark:text-stone-500">
        {panel.hint}
      </div>
    </div>
  );
}
