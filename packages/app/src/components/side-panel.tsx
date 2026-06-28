import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { FileText, PanelRight, Plus, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@framework/ui/components/dropdown-menu";
import { cn } from "@framework/ui/lib/utils";
import type { ResourceFile } from "../resources/data";
import { KIND_ICONS } from "../resources/kind";
import {
  LAUNCHER_ITEMS,
  PLACEHOLDER_PANELS,
  type PlaceholderPanelId,
} from "./panel-launcher";

export type PanelTab =
  | { id: "resources"; kind: "resources" }
  | { id: string; kind: "file"; file: ResourceFile }
  | { id: PlaceholderPanelId; kind: "placeholder" };

export const SIDE_PANEL_MIN_WIDTH = 340;
const CHAT_AREA_MIN_WIDTH_RATIO = 0.25 * 1.075;
export const SIDE_PANEL_MAX_WIDTH_RATIO = 1 - CHAT_AREA_MIN_WIDTH_RATIO;
const MIN_WIDTH = SIDE_PANEL_MIN_WIDTH;
const MAX_WIDTH_RATIO = SIDE_PANEL_MAX_WIDTH_RATIO;
const HALF_WIDTH_SNAP_RATIO = 0.5;
/** Magnet range around drag snap points (even split, etc.). */
const SNAP_DISTANCE = 12;
/** Vertical distance from the strip before the ghost floats free. */
const TEAR_DISTANCE = 36;
const DRAG_THRESHOLD = 5;

function tabTitle(tab: PanelTab): string {
  if (tab.kind === "resources") return "Resources";
  if (tab.kind === "placeholder") return PLACEHOLDER_PANELS[tab.id].title;
  return tab.file.name;
}

function TabIcon({ tab }: { tab: PanelTab }) {
  const Icon =
    tab.kind === "resources"
      ? FileText
      : tab.kind === "placeholder"
        ? PLACEHOLDER_PANELS[tab.id].icon
        : KIND_ICONS[tab.file.kind];
  return <Icon className="size-3.5 shrink-0 opacity-70" strokeWidth={1.75} />;
}

function TabStrip({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onReorderTab,
  onOpenResources,
  onOpenPlaceholder,
}: {
  tabs: PanelTab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onReorderTab: (id: string, toIndex: number) => void;
  onOpenResources: () => void;
  onOpenPlaceholder: (id: PlaceholderPanelId) => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const previousTabIdsRef = useRef(tabs.map((tab) => tab.id));
  // The ghost is portal-rendered at the body so it can float outside the
  // rail's overflow clipping; drag holds the grab-time slot it flies from.
  const [drag, setDrag] = useState<{
    tab: PanelTab;
    rect: { left: number; top: number; width: number; height: number };
  } | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  // Pointer moves outpace the portal mount; the callback ref replays the
  // latest transform onto the ghost when it appears.
  const ghostStyleRef = useRef({ transform: "" });
  // Bumped per grab so a settle timer from a superseded drag no-ops.
  const dragSeqRef = useRef(0);

  const scrollToTabStripEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const strip = stripRef.current;
      if (!strip) return;
      strip.scrollLeft = strip.scrollWidth;
    });
  }, []);

  useLayoutEffect(() => {
    const previousTabIds = previousTabIdsRef.current;
    const currentTabIds = tabs.map((tab) => tab.id);
    const openedTab =
      currentTabIds.length > previousTabIds.length &&
      currentTabIds.some((id) => !previousTabIds.includes(id));

    previousTabIdsRef.current = currentTabIds;
    if (openedTab) scrollToTabStripEnd();
  }, [scrollToTabStripEnd, tabs]);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const scroller = event.currentTarget;
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;

    if (maxScrollLeft <= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      return;
    }

    const delta =
      event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaMode === 2
          ? event.deltaY * scroller.clientWidth
          : event.deltaY;
    const nextScrollLeft = Math.max(
      0,
      Math.min(maxScrollLeft, scroller.scrollLeft + delta)
    );

    if (nextScrollLeft === scroller.scrollLeft) return;
    event.preventDefault();
    scroller.scrollLeft = nextScrollLeft;
  };

  const onTabPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    tab: PanelTab
  ) => {
    // Only plain left-button drags; let the close button handle itself.
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-tab-close]")) return;

    const strip = stripRef.current;
    const el = event.currentTarget;
    if (!strip) return;

    const els = [...strip.querySelectorAll<HTMLElement>("[data-tab-id]")];
    const from = els.indexOf(el);
    if (from < 0) return;

    // A re-grab can land while the previous ghost is still settling; take
    // over its styles here and let its stale settle timer no-op via seq.
    const seq = ++dragSeqRef.current;
    for (const tabEl of els) tabEl.style.opacity = "";

    // Snapshot the layout at grab time; all target math runs in these
    // coordinates while inline transforms preview the result. The React
    // reorder itself only commits on drop.
    const rects = els.map((e) => e.getBoundingClientRect());
    const gap =
      els.length > 1 ? Math.max(0, rects[1].left - rects[0].right) : 0;
    const slot = rects[from].width + gap;
    const grabOffset = event.clientX - rects[from].left;
    const stripRect = strip.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY };
    const state = {
      moved: false,
      tearing: false,
      target: from,
      tx: 0,
      desiredLeft: rects[from].left,
    };

    const applyTransforms = (move: PointerEvent) => {
      state.desiredLeft = move.clientX - grabOffset;
      state.tx = state.desiredLeft - rects[from].left;
      // The ghost tracks the pointer 1:1 on both axes — never snapped or
      // rail-locked; it only flies to a slot on release.
      const ty = move.clientY - start.y;
      ghostStyleRef.current.transform = `translate(${state.tx}px, ${ty}px)`;
      const ghost = ghostRef.current;
      if (ghost) ghost.style.transform = ghostStyleRef.current.transform;

      let target = from;
      if (!state.tearing) {
        const center = state.desiredLeft + rects[from].width / 2;
        rects.forEach((rect, i) => {
          const mid = rect.left + rect.width / 2;
          if (i < from && center < mid) target = Math.min(target, i);
          if (i > from && center > mid) target = Math.max(target, i);
        });
      }
      state.target = target;

      els.forEach((tabEl, i) => {
        if (i === from) return;
        let shift = 0;
        if (state.tearing) {
          // The strip closes the gap while a tab is torn off.
          if (i > from) shift = -slot;
        } else if (i >= target && i < from) {
          shift = slot;
        } else if (i > from && i <= target) {
          shift = -slot;
        }
        tabEl.style.transform = shift ? `translateX(${shift}px)` : "";
      });
    };

    const cleanupStyles = () => {
      for (const tabEl of els) {
        tabEl.style.transform = "";
        tabEl.style.transition = "";
      }
      el.style.opacity = "";
    };

    const onMove = (move: PointerEvent) => {
      if (
        !state.moved &&
        Math.hypot(move.clientX - start.x, move.clientY - start.y) <
          DRAG_THRESHOLD
      ) {
        return;
      }
      if (!state.moved) {
        state.moved = true;
        // The ghost tracks the pointer raw; neighbors ease between slots.
        els.forEach((tabEl, i) => {
          tabEl.style.transition = i === from ? "none" : "transform 160ms ease";
        });
        ghostStyleRef.current = { transform: "" };
        // flushSync so the ghost exists and the rail tab hides in the same
        // tick — no frame with two copies or none.
        flushSync(() =>
          setDrag({
            tab,
            rect: {
              left: rects[from].left,
              top: rects[from].top,
              width: rects[from].width,
              height: rects[from].height,
            },
          })
        );
        el.style.opacity = "0";
      }

      const tearing =
        move.clientY < stripRect.top - TEAR_DISTANCE ||
        move.clientY > stripRect.bottom + TEAR_DISTANCE;
      if (tearing !== state.tearing) {
        state.tearing = tearing;
      }

      applyTransforms(move);
    };

    const onUp = () => {
      // Window-level listeners instead of pointer capture: capture is
      // unreliable under Wayland and silently stops delivering moves.
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      suppressClick.current = state.moved;

      if (!state.moved) {
        cleanupStyles();
        return;
      }

      // Fly the ghost to (tx, ty) relative to its grab-time slot, then
      // swap the rail tab back in beneath it in a single tick.
      const settle = (tx: number, ty: number) => {
        const ghost = ghostRef.current;
        ghostStyleRef.current = {
          transform: `translate(${tx}px, ${ty}px)`,
        };
        if (ghost) {
          ghost.style.transition = "transform 160ms ease";
          ghost.style.transform = ghostStyleRef.current.transform;
        }
        window.setTimeout(
          () => {
            if (dragSeqRef.current !== seq) return;
            cleanupStyles();
            flushSync(() => setDrag(null));
          },
          ghost ? 170 : 0
        );
      };

      if (!state.tearing && state.target !== from) {
        // Commit the previewed order, then fly the ghost into its new
        // slot (FLIP: measure post-commit layout).
        onReorderTab(tab.id, state.target);
        requestAnimationFrame(() => {
          for (const tabEl of els) {
            if (tabEl === el) continue;
            tabEl.style.transform = "";
            tabEl.style.transition = "";
          }
          const slotRect = el.getBoundingClientRect();
          settle(
            slotRect.left - rects[from].left,
            slotRect.top - rects[from].top
          );
        });
      } else {
        // No valid drop (torn off the rail, or back where it started):
        // reopen the gap and snap the ghost home.
        for (const tabEl of els) {
          if (tabEl !== el) tabEl.style.transform = "";
        }
        settle(0, 0);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  return (
    <div
      ref={stripRef}
      onWheel={handleWheel}
      className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain pr-5 [mask-image:linear-gradient(to_right,black_0,black_calc(100%-24px),transparent_100%)] [scrollbar-width:none] [-webkit-mask-image:linear-gradient(to_right,black_0,black_calc(100%-24px),transparent_100%)] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            onPointerDown={(event) => onTabPointerDown(event, tab)}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              onSelectTab(tab.id);
            }}
            style={{ touchAction: "none" }}
            title={tabTitle(tab)}
            className={cn(
              "group relative flex h-7.5 max-w-56 min-w-20 flex-none cursor-default items-center gap-1.5 rounded-lg px-2.5 text-[13px] transition-colors",
              active
                ? "bg-stone-200/65 text-stone-800 dark:bg-stone-800 dark:text-stone-100"
                : "text-stone-500 hover:bg-stone-200/45 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-200"
            )}
          >
            <TabIcon tab={tab} />
            <span className="min-w-0 flex-1 truncate group-hover:[mask-image:linear-gradient(to_right,black_calc(100%-30px),transparent_calc(100%-8px))]">
              {tabTitle(tab)}
            </span>
            <button
              type="button"
              data-tab-close
              aria-label={`Close ${tabTitle(tab)}`}
              onClick={(event) => {
                event.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="absolute top-1/2 right-2 flex size-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-stone-200/70 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-stone-300/90 dark:bg-stone-700/70 dark:hover:bg-stone-600/90"
            >
              <X className="size-3" strokeWidth={2} />
            </button>
          </div>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="New tab"
            className="ml-0.5 flex size-7.5 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-200/60 hover:text-stone-600 data-[state=open]:bg-stone-200/60 dark:hover:bg-stone-800 dark:hover:text-stone-300 dark:data-[state=open]:bg-stone-800"
          >
            <Plus className="size-4" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {LAUNCHER_ITEMS.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onSelect={() =>
                item.id === "resources"
                  ? onOpenResources()
                  : onOpenPlaceholder(item.id)
              }
            >
              <item.icon
                className="size-3.5 text-stone-500 dark:text-stone-400"
                strokeWidth={1.75}
              />
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="inline-flex items-center self-center leading-none text-[11px] text-stone-400 dark:text-stone-500">
                  {item.shortcut}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {drag &&
        createPortal(
          <div
            ref={(node) => {
              ghostRef.current = node;
              if (node) {
                // Replay the latest drag styles (moves outpace the mount)
                // and drop any transition left over from a prior settle.
                node.style.transition = "none";
                node.style.transform = ghostStyleRef.current.transform;
              }
            }}
            style={{
              left: drag.rect.left,
              top: drag.rect.top,
              width: drag.rect.width,
              height: drag.rect.height,
            }}
            className="pointer-events-none fixed z-50 flex items-center gap-1.5 rounded-lg bg-stone-200 px-2.5 text-[13px] text-stone-800 shadow-md ring-1 ring-stone-300/60 dark:bg-stone-700 dark:text-stone-100 dark:ring-stone-600/60"
          >
            <TabIcon tab={drag.tab} />
            <span className="min-w-0 flex-1 truncate">
              {tabTitle(drag.tab)}
            </span>
          </div>,
          document.body
        )}
    </div>
  );
}

export function SidePanel({
  open,
  tabs,
  activeTabId,
  widthRatio,
  onSelectTab,
  onCloseTab,
  onReorderTab,
  onClosePanel,
  onOpenPanel,
  onOpenResources,
  onOpenPlaceholder,
  onResize,
  children,
}: {
  open: boolean;
  tabs: PanelTab[];
  activeTabId: string | null;
  /** Panel width as a fraction of the main area (0..MAX_WIDTH_RATIO). */
  widthRatio: number;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onReorderTab: (id: string, toIndex: number) => void;
  onClosePanel: () => void;
  onOpenPanel: () => void;
  onOpenResources: () => void;
  onOpenPlaceholder: (id: PlaceholderPanelId) => void;
  onResize: (ratio: number) => void;
  children: React.ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isOpen = open;

  // Pin the content to the panel's resolved pixel width. The observer on
  // the main area fires before paint, so sidebar toggles and window
  // resizes track frame-exactly; open/close animations don't change the
  // main area, so the content stays put and the panel slides over it.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const parent = frame?.parentElement;
    const content = contentRef.current;
    if (!frame || !parent || !content) return;

    const sync = () => {
      if (frame.dataset.resizing) return; // drag writes widths itself
      const parentWidth = parent.clientWidth;
      const max = Math.round(parentWidth * MAX_WIDTH_RATIO);
      const min = Math.min(MIN_WIDTH, max);
      const px = Math.min(max, Math.max(min, Math.round(parentWidth * widthRatio)));
      content.style.width = `${px}px`;
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [widthRatio]);

  // Resize without React in the loop: write widths straight to the DOM at
  // RAF cadence with the width transition suspended, then commit the final
  // width to state on release.
  const startResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const frame = frameRef.current;
      if (!frame) return;

      frame.dataset.resizing = "true";
      document.body.style.cursor = "col-resize";

      const right = frame.getBoundingClientRect().right;
      const parentLeft = frame.parentElement?.getBoundingClientRect().left ?? 0;
      const availableWidth = right - parentLeft;
      const maxWidth = Math.round(availableWidth * MAX_WIDTH_RATIO);
      const minWidth = Math.min(MIN_WIDTH, maxWidth);
      // Gentle magnets while dragging only — a restored width is never
      // re-snapped on open. Keep the list short so resizing feels smooth.
      const snapPoints = [
        Math.round(availableWidth * HALF_WIDTH_SNAP_RATIO),
        Math.round(availableWidth * MAX_WIDTH_RATIO),
      ].filter((point) => point >= minWidth && point <= maxWidth);

      let next = frame.getBoundingClientRect().width;
      let raf = 0;

      const onMove = (move: PointerEvent) => {
        next = Math.min(
          maxWidth,
          Math.max(minWidth, Math.round(right - move.clientX))
        );
        for (const point of snapPoints) {
          if (Math.abs(next - point) <= SNAP_DISTANCE) {
            next = point;
            break;
          }
        }
        if (!raf) {
          raf = requestAnimationFrame(() => {
            raf = 0;
            frame.style.width = `${next}px`;
            if (contentRef.current)
              contentRef.current.style.width = `${next}px`;
          });
        }
      };
      const onUp = () => {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        delete frame.dataset.resizing;
        document.body.style.cursor = "";
        const ratio = Math.min(
          MAX_WIDTH_RATIO,
          next / Math.max(1, availableWidth)
        );
        // Swap the drag's inline pixel width back to a percentage here:
        // snapping often lands on the exact ratio already in state, so
        // React skips the re-render that would otherwise restore it, and
        // a pixel width would stop tracking the main area when the
        // sidebar collapses or expands.
        frame.style.width = `${ratio * 100}%`;
        onResize(ratio);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [onResize]
  );

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Collapse panel" : "Open panel"}
        onClick={isOpen ? onClosePanel : onOpenPanel}
        className="absolute top-2 right-2 z-50 flex size-7 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200/60 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
      >
        <PanelRight className="size-4" strokeWidth={1.75} />
      </button>

      <aside
        ref={frameRef}
        style={
          isOpen
            ? {
                width: `${widthRatio * 100}%`,
                minWidth: MIN_WIDTH,
                maxWidth: `${MAX_WIDTH_RATIO * 100}%`,
              }
            : { width: "0%", minWidth: 0 }
        }
        className={cn(
          "relative flex h-full shrink-0 overflow-hidden border-l bg-white transition-[width,border-color] duration-200 ease-out data-resizing:transition-none dark:bg-stone-900",
          isOpen
            ? "border-stone-200/70 dark:border-stone-800"
            : "border-transparent"
        )}
        aria-hidden={!isOpen}
      >
        <div
          ref={contentRef}
          className={cn(
            "flex h-full shrink-0 flex-col transition-opacity duration-150 ease-out",
            isOpen ? "opacity-100 delay-75" : "opacity-0 pointer-events-none"
          )}
          inert={isOpen ? undefined : true}
        >
          {/* Resize handle */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panel"
            onPointerDown={startResize}
            className="absolute top-0 left-0 z-40 h-full w-3.5 -translate-x-1/2 cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-[3px] after:-translate-x-1/2 after:rounded-full after:bg-transparent after:transition-colors hover:after:bg-stone-300/80 active:after:bg-stone-400/80 dark:hover:after:bg-stone-700/80 dark:active:after:bg-stone-600/80"
          />

          {/* Tab strip */}
          <div className="flex h-10 shrink-0 items-start gap-1 px-2 pt-2 pr-10">
            <TabStrip
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={onSelectTab}
              onCloseTab={onCloseTab}
              onReorderTab={onReorderTab}
              onOpenResources={onOpenResources}
              onOpenPlaceholder={onOpenPlaceholder}
            />
          </div>

          <div className="min-h-0 flex-1">{children}</div>
        </div>
      </aside>
    </>
  );
}
