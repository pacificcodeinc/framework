import { useEffect, useMemo, useState } from "react";
import { EMPTY_SIDEBAR, Sidebar } from "./components/sidebar";
import { Home } from "./components/home";
import { isMacPlatform, NonMacMenubar } from "./components/non-mac-menubar";
import {
  SIDE_PANEL_MAX_WIDTH_RATIO,
  SIDE_PANEL_MIN_WIDTH,
  SidePanel,
  type PanelTab,
} from "./components/side-panel";
import {
  PanelLauncher,
  PlaceholderView,
  type PlaceholderPanelId,
} from "./components/panel-launcher";
import { ResourcesView } from "./resources/resources-view";
import { FileView } from "./resources/file-view";
import { RESOURCE_FILES, type ResourceFile } from "./resources/data";

const PANEL_WIDTH_KEY = "framework:panel-width";
const PANEL_WIDTH_RATIO_KEY = "framework:panel-width-ratio";
import { cn } from "@framework/ui/lib/utils";

function clampPanelRatio(ratio: number) {
  return Math.max(0, Math.min(SIDE_PANEL_MAX_WIDTH_RATIO, ratio));
}

function getStoredPanelRatio() {
  const storedRatio = Number(localStorage.getItem(PANEL_WIDTH_RATIO_KEY) ?? "");
  if (Number.isFinite(storedRatio) && storedRatio > 0) {
    return clampPanelRatio(storedRatio);
  }

  // Legacy pixel width from before the ratio-based panel.
  const windowWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const storedWidth = Number(localStorage.getItem(PANEL_WIDTH_KEY) ?? "");
  if (Number.isFinite(storedWidth) && storedWidth >= SIDE_PANEL_MIN_WIDTH) {
    return clampPanelRatio(storedWidth / windowWidth);
  }

  return clampPanelRatio(440 / windowWidth);
}

function initialTabs(): {
  tabs: PanelTab[];
  active: string | null;
  open: boolean;
} {
  // Deep link for dev/screenshots: ?view=resources, ?view=file, or ?view=panel
  const view =
    typeof location !== "undefined"
      ? new URLSearchParams(location.search).get("view")
      : null;
  if (view === "resources") {
    return {
      tabs: [{ id: "resources", kind: "resources" }],
      active: "resources",
      open: true,
    };
  }
  if (view === "file") {
    const file = RESOURCE_FILES[0];
    return {
      tabs: [
        { id: "resources", kind: "resources" },
        { id: file.id, kind: "file", file },
      ],
      active: file.id,
      open: true,
    };
  }
  if (view === "panel") {
    return { tabs: [], active: null, open: true };
  }
  return { tabs: [], active: null, open: false };
}

export function App() {
  const hasCustomChrome = !isMacPlatform();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [files, setFiles] = useState<ResourceFile[]>(RESOURCE_FILES);
  const [{ tabs, active }, setPanel] = useState<{
    tabs: PanelTab[];
    active: string | null;
  }>(() => {
    const { tabs, active } = initialTabs();
    return { tabs, active };
  });
  const [isPanelOpen, setIsPanelOpen] = useState(() => initialTabs().open);
  const [panelWidthRatio, setPanelWidthRatio] = useState(getStoredPanelRatio);

  const isSidebarVisible = !hasCustomChrome || isSidebarExpanded;
  const isChromeActive = isSidebarExpanded || isPanelOpen;

  const openResources = () => {
    setPanel(({ tabs }) => ({
      tabs: tabs.some((t) => t.kind === "resources")
        ? tabs
        : [{ id: "resources", kind: "resources" as const }, ...tabs],
      active: "resources",
    }));
    setIsPanelOpen(true);
  };

  const openFile = (file: ResourceFile) => {
    setPanel(({ tabs }) => ({
      tabs: tabs.some((t) => t.id === file.id)
        ? tabs
        : [...tabs, { id: file.id, kind: "file" as const, file }],
      active: file.id,
    }));
    setIsPanelOpen(true);
  };

  const openPlaceholder = (id: PlaceholderPanelId) => {
    setPanel(({ tabs }) => ({
      tabs: tabs.some((t) => t.id === id)
        ? tabs
        : [...tabs, { id, kind: "placeholder" as const }],
      active: id,
    }));
    setIsPanelOpen(true);
  };

  // Closing the last tab keeps the panel open on the launcher.
  const closeTab = (id: string) =>
    setPanel(({ tabs, active }) => {
      const remaining = tabs.filter((t) => t.id !== id);
      return {
        tabs: remaining,
        active:
          active === id ? (remaining.at(-1)?.id ?? null) : active,
      };
    });

  const reorderTab = (id: string, toIndex: number) =>
    setPanel(({ tabs, active }) => {
      const from = tabs.findIndex((t) => t.id === id);
      if (from < 0 || from === toIndex) return { tabs, active };
      const next = [...tabs];
      const [moved] = next.splice(from, 1);
      next.splice(toIndex, 0, moved);
      return { tabs: next, active };
    });

  const toggleContext = (file: ResourceFile) =>
    setFiles((current) =>
      current.map((f) =>
        f.id === file.id ? { ...f, inContext: !f.inContext } : f
      )
    );

  // Keep file tabs in sync with the canonical file list.
  const syncedTabs = useMemo(
    () =>
      tabs.map((tab) =>
        tab.kind === "file"
          ? { ...tab, file: files.find((f) => f.id === tab.id) ?? tab.file }
          : tab
      ),
    [tabs, files]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "p") {
        event.preventDefault();
        openResources();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeTab = syncedTabs.find((t) => t.id === active) ?? null;

  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-col overflow-hidden text-stone-800 dark:text-stone-200",
        hasCustomChrome
          ? "bg-stone-100/80 dark:bg-stone-950"
          : "bg-white dark:bg-stone-900"
      )}
    >
      <NonMacMenubar
        isSidebarExpanded={isSidebarExpanded}
        isChromeActive={isChromeActive}
        onToggleSidebar={() => setIsSidebarExpanded((expanded) => !expanded)}
      />
      <div className="flex min-h-0 flex-1">
        {/* Sidebar data is empty until persistence/agent state lands. */}
        <Sidebar
          data={EMPTY_SIDEBAR}
          expanded={isSidebarVisible}
          showRightBorder={!hasCustomChrome}
          onOpenResources={openResources}
        />
        <main
          className={cn(
            "relative flex min-w-0 flex-1 overflow-hidden bg-white dark:bg-stone-900",
            hasCustomChrome &&
              "border-t border-l transition-[border-color,border-radius] duration-200 ease-out",
            hasCustomChrome &&
              (isChromeActive
                ? "border-t-stone-200/70 dark:border-t-stone-800"
                : "border-t-transparent"),
            hasCustomChrome &&
              (isSidebarExpanded
                ? "rounded-tl-xl border-l-stone-200/70 dark:border-l-stone-800"
                : "rounded-tl-none border-l-transparent")
          )}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <Home />
          </div>
          <SidePanel
            open={isPanelOpen}
            tabs={syncedTabs}
            activeTabId={active}
            widthRatio={panelWidthRatio}
            onSelectTab={(id) => setPanel((p) => ({ ...p, active: id }))}
            onCloseTab={closeTab}
            onReorderTab={reorderTab}
            onClosePanel={() => setIsPanelOpen(false)}
            onOpenPanel={() => setIsPanelOpen(true)}
            onOpenResources={openResources}
            onOpenPlaceholder={openPlaceholder}
            onResize={(nextRatio) => {
              const clamped = clampPanelRatio(nextRatio);
              setPanelWidthRatio(clamped);
              localStorage.setItem(PANEL_WIDTH_RATIO_KEY, String(clamped));
            }}
          >
            {!activeTab && (
              <PanelLauncher
                onOpenResources={openResources}
                onOpenPlaceholder={openPlaceholder}
              />
            )}
            {activeTab?.kind === "placeholder" && (
              <PlaceholderView id={activeTab.id} />
            )}
            {activeTab?.kind === "resources" && (
              <ResourcesView
                files={files}
                onOpenFile={openFile}
                onToggleContext={toggleContext}
              />
            )}
            {activeTab?.kind === "file" && (
              <FileView
                file={activeTab.file}
                onToggleContext={() => toggleContext(activeTab.file)}
                onAskAbout={() => {
                  document
                    .querySelector<HTMLTextAreaElement>(
                      'textarea[data-slot="textarea"]'
                    )
                    ?.focus();
                }}
              />
            )}
          </SidePanel>
        </main>
      </div>
    </div>
  );
}
