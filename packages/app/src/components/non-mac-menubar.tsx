import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Minus, PanelLeft, Square, X } from "lucide-react";
import { cn } from "@framework/ui/lib/utils";

type MenuEntry =
  | {
      label: string;
      shortcut?: string;
    }
  | {
      separator: true;
    };

type MenuGroup = {
  label: string;
  entries: MenuEntry[];
};

type FrameworkWindowControls = {
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  close: () => Promise<void>;
};

const MENU_GROUPS: MenuGroup[] = [
  {
    label: "File",
    entries: [
      { label: "New chat", shortcut: "Ctrl+N" },
      { label: "New project", shortcut: "Ctrl+Shift+N" },
      { separator: true },
      { label: "Close window", shortcut: "Alt+F4" },
    ],
  },
  {
    label: "Edit",
    entries: [
      { label: "Undo", shortcut: "Ctrl+Z" },
      { label: "Redo", shortcut: "Ctrl+Y" },
      { separator: true },
      { label: "Cut", shortcut: "Ctrl+X" },
      { label: "Copy", shortcut: "Ctrl+C" },
      { label: "Paste", shortcut: "Ctrl+V" },
      { label: "Select all", shortcut: "Ctrl+A" },
    ],
  },
  {
    label: "View",
    entries: [
      { label: "Reload", shortcut: "Ctrl+R" },
      { label: "Actual size", shortcut: "Ctrl+0" },
      { label: "Zoom in", shortcut: "Ctrl++" },
      { label: "Zoom out", shortcut: "Ctrl+-" },
      { separator: true },
      { label: "Toggle sidebar" },
    ],
  },
  {
    label: "Help",
    entries: [{ label: "About Framework" }],
  },
];

export function isMacPlatform() {
  if (typeof navigator === "undefined") return false;

  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

function ChromeButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-md text-stone-500 outline-none transition-colors hover:bg-stone-200/65 hover:text-stone-700 focus:outline-none focus-visible:outline-none disabled:text-stone-400/60 disabled:hover:bg-transparent dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 dark:disabled:text-stone-600 dark:disabled:hover:bg-transparent"
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </button>
  );
}

function WindowControlButton({
  label,
  icon: Icon,
  variant = "default",
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  variant?: "default" | "close";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-9 w-11 items-center justify-center rounded-none text-stone-500 outline-none transition-colors focus:outline-none focus-visible:outline-none dark:text-stone-400",
        variant === "close"
          ? "hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white"
          : "hover:bg-stone-200/65 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.75} />
    </button>
  );
}

export function NonMacMenubar({
  isSidebarExpanded,
  isChromeActive,
  onToggleSidebar,
}: {
  isSidebarExpanded: boolean;
  isChromeActive: boolean;
  onToggleSidebar: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const windowControls = (
    window as Window & { frameworkWindow?: FrameworkWindowControls }
  ).frameworkWindow;

  useEffect(() => {
    if (!openMenu) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  if (isMacPlatform()) return null;

  return (
    <header
      ref={rootRef}
      className={cn(
        "flex h-9 shrink-0 items-center px-2 text-[13px] text-stone-600 transition-colors duration-200 ease-out dark:text-stone-300",
        isChromeActive
          ? "bg-stone-100/80 dark:bg-stone-950"
          : "bg-white dark:bg-stone-900"
      )}
    >
      <div className="flex items-center gap-1">
        <ChromeButton
          label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          icon={PanelLeft}
          onClick={onToggleSidebar}
        />
        <ChromeButton label="Back" icon={ArrowLeft} disabled />
        <ChromeButton label="Forward" icon={ArrowRight} disabled />
      </div>

      <nav className="ml-2 flex items-center gap-0.5" aria-label="Application menu">
        {MENU_GROUPS.map((group) => {
          const isOpen = openMenu === group.label;

          return (
            <div key={group.label} className="relative">
              <button
                type="button"
                className={cn(
                  "rounded-md px-2.5 py-1 text-left outline-none transition-colors hover:bg-stone-200/65 hover:text-stone-800 focus:outline-none focus-visible:outline-none dark:hover:bg-stone-800 dark:hover:text-stone-100",
                  isOpen &&
                    "bg-stone-200/65 text-stone-800 dark:bg-stone-800 dark:text-stone-100"
                )}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={() => setOpenMenu(isOpen ? null : group.label)}
                onMouseEnter={() => {
                  if (openMenu) setOpenMenu(group.label);
                }}
              >
                {group.label}
              </button>

              {isOpen && (
                <div
                  role="menu"
                  className="absolute top-[calc(100%+2px)] left-0 z-50 min-w-52 rounded-lg border border-stone-200 bg-white p-1 text-[13px] text-stone-700 shadow-lg dark:border-stone-700/70 dark:bg-stone-800 dark:text-stone-200"
                >
                  {group.entries.map((entry, index) =>
                    "separator" in entry ? (
                      <div
                        key={`${group.label}-${index}`}
                        className="-mx-1 my-1 h-px bg-stone-200 dark:bg-stone-700"
                      />
                    ) : (
                      <button
                        key={entry.label}
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-6 rounded-md px-2.5 py-1.5 text-left outline-none transition-colors hover:bg-stone-100 focus:outline-none focus-visible:outline-none dark:hover:bg-stone-700/60"
                        onClick={() => {
                          if (entry.label === "Toggle sidebar") {
                            onToggleSidebar();
                          }
                          setOpenMenu(null);
                        }}
                      >
                        <span className="flex-1">{entry.label}</span>
                        {entry.shortcut && (
                          <span className="text-xs text-stone-400 dark:text-stone-500">
                            {entry.shortcut}
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="-mr-2 ml-auto flex self-stretch" aria-label="Window controls">
        <WindowControlButton
          label="Minimize window"
          icon={Minus}
          onClick={() => {
            void windowControls?.minimize();
          }}
        />
        <WindowControlButton
          label="Maximize window"
          icon={Square}
          onClick={() => {
            void windowControls?.toggleMaximize();
          }}
        />
        <WindowControlButton
          label="Close window"
          icon={X}
          variant="close"
          onClick={() => {
            if (windowControls) {
              void windowControls.close();
            } else {
              window.close();
            }
          }}
        />
      </div>
    </header>
  );
}
