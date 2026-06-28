import { useMemo, useState, type WheelEvent } from "react";
import { Bookmark, Clock, LayoutGrid, List, Loader2, Search } from "lucide-react";
import { cn } from "@framework/ui/lib/utils";
import {
  factCount,
  KIND_LABELS,
  type FileKind,
  type ResourceFile,
} from "./data";
import { KIND_ICONS, KindGlyph } from "./kind";

const FILTERS: Array<{ id: FileKind | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "document", label: KIND_LABELS.document },
  { id: "spreadsheet", label: KIND_LABELS.spreadsheet },
  { id: "contract", label: KIND_LABELS.contract },
  { id: "reference", label: KIND_LABELS.reference },
  { id: "report", label: KIND_LABELS.report },
  { id: "media", label: KIND_LABELS.media },
];

type ResourcesViewMode = "cards" | "list";
const RESOURCE_VIEW_MODE_KEY = "framework:resources-view-mode";

function getStoredViewMode(): ResourcesViewMode {
  const stored = localStorage.getItem(RESOURCE_VIEW_MODE_KEY);
  return stored === "list" || stored === "cards" ? stored : "cards";
}

function StatusBadge({ file }: { file: ResourceFile }) {
  if (file.status === "processing") {
    return (
      <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
        <Loader2 className="size-3 animate-spin" strokeWidth={2} />
        extracting
      </span>
    );
  }
  if (file.status === "queued") {
    return (
      <span className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
        <Clock className="size-3" strokeWidth={2} />
        queued
      </span>
    );
  }
  return (
    <span className="flex items-center text-xs tabular-nums text-stone-400 dark:text-stone-500">
      {file.facts.length} facts
    </span>
  );
}

function FileRow({
  file,
  onOpen,
  onToggleContext,
}: {
  file: ResourceFile;
  onOpen: () => void;
  onToggleContext: () => void;
}) {
  return (
    <div className="group relative isolate flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800/60">
      <KindGlyph kind={file.kind} />
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:content-['']"
      >
        <div className="truncate text-[13px] text-stone-800 dark:text-stone-200">
          {file.name}
        </div>
        <div className="truncate text-[11px] text-stone-400 dark:text-stone-500">
          {file.size} · {file.modified}
        </div>
      </button>
      <StatusBadge file={file} />
      <button
        type="button"
        aria-label={file.inContext ? "Remove from context" : "Pin to context"}
        aria-pressed={file.inContext}
        onClick={onToggleContext}
        className={cn(
          "relative z-10 flex size-6 items-center justify-center rounded-md transition-all",
          file.inContext
            ? "text-stone-700 dark:text-stone-200"
            : "text-stone-300 opacity-0 group-hover:opacity-100 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400"
        )}
      >
        <Bookmark
          className="size-3.5"
          strokeWidth={2}
          fill={file.inContext ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
}

function FileCard({
  file,
  onOpen,
  onToggleContext,
}: {
  file: ResourceFile;
  onOpen: () => void;
  onToggleContext: () => void;
}) {
  const Icon = KIND_ICONS[file.kind];
  return (
    <div className="group relative isolate flex min-h-26 flex-col rounded-xl border border-stone-200/70 bg-white p-3 transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-black/20 dark:hover:border-stone-700 dark:hover:bg-stone-950/80">
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={`Open ${file.name}`}
      />
      <div className="relative z-10 flex h-5 items-center justify-between">
        <Icon
          className="size-4 text-stone-400 dark:text-stone-500"
          strokeWidth={1.75}
        />
        <button
          type="button"
          aria-label={file.inContext ? "Remove from context" : "Pin to context"}
          aria-pressed={file.inContext}
          onClick={onToggleContext}
          className={cn(
            "relative z-20 -m-1 flex size-6 items-center justify-center rounded-md transition-opacity",
            file.inContext
              ? "text-stone-700 dark:text-stone-200"
              : "text-stone-400 opacity-0 group-hover:opacity-100 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
          )}
        >
          <Bookmark
            className="size-3.5"
            strokeWidth={2}
            fill={file.inContext ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="relative z-10 mt-2 line-clamp-2 text-[13px] leading-snug font-medium text-stone-800 dark:text-stone-100">
        {file.name}
      </div>

      <div className="relative z-10 mt-auto flex items-center gap-1 pt-2.5 text-[11px] text-stone-400 dark:text-stone-500">
        {file.status === "processing" ? (
          <>
            <Loader2 className="size-3 animate-spin" strokeWidth={2} />
            <span>extracting · {file.modified}</span>
          </>
        ) : file.status === "queued" ? (
          <span>queued · {file.size} · {file.modified}</span>
        ) : (
          <span>
            <span className="font-medium text-stone-500 dark:text-stone-400">
              {file.facts.length} facts
            </span>
            {" · "}
            {file.size} · {file.modified}
          </span>
        )}
      </div>
    </div>
  );
}

export function ResourcesView({
  files,
  onOpenFile,
  onToggleContext,
}: {
  files: ResourceFile[];
  onOpenFile: (file: ResourceFile) => void;
  onToggleContext: (file: ResourceFile) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FileKind | "all">("all");
  const [viewMode, setViewMode] =
    useState<ResourcesViewMode>(getStoredViewMode);
  const [isFileListScrolled, setIsFileListScrolled] = useState(false);

  const chooseViewMode = (mode: ResourcesViewMode) => {
    setViewMode(mode);
    localStorage.setItem(RESOURCE_VIEW_MODE_KEY, mode);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter(
      (file) =>
        (filter === "all" || file.kind === filter) &&
        (!q ||
          file.name.toLowerCase().includes(q) ||
          file.project.toLowerCase().includes(q))
    );
  }, [files, filter, query]);

  const groups = useMemo(() => {
    const byProject = new Map<string, ResourceFile[]>();
    for (const file of visible) {
      const group = byProject.get(file.project) ?? [];
      group.push(file);
      byProject.set(file.project, group);
    }
    return [...byProject.entries()];
  }, [visible]);

  const handleFilterWheel = (event: WheelEvent<HTMLDivElement>) => {
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Search + filters */}
      <div
        className={cn(
          "flex flex-col gap-2 border-b px-2 pt-1 pb-2 transition-colors",
          isFileListScrolled
            ? "border-stone-200/70 dark:border-stone-800"
            : "border-transparent"
        )}
      >
        <label className="flex items-center gap-2 rounded-lg border border-transparent bg-accent px-2.5 py-1.5 text-accent-foreground focus-within:border-ring/40">
          <Search className="size-3.5 shrink-0 opacity-55" strokeWidth={2} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files and projects"
            className="w-full bg-transparent text-[13px] text-inherit outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="flex items-center gap-2">
          <div
            onWheel={handleFilterWheel}
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
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-0.5">
            {[
              { id: "cards" as const, label: "Cards", icon: LayoutGrid },
              { id: "list" as const, label: "List", icon: List },
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  aria-label={mode.label}
                  aria-pressed={viewMode === mode.id}
                  onClick={() => chooseViewMode(mode.id)}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-md transition-colors",
                    viewMode === mode.id
                      ? "text-stone-800 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800"
                      : "text-stone-300 hover:bg-stone-100 hover:text-stone-500 dark:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-400"
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grouped files */}
      <div
        className="min-h-0 flex-1 overflow-y-auto pr-2 pb-4 pl-4"
        onScroll={(event) =>
          setIsFileListScrolled(event.currentTarget.scrollTop > 0)
        }
      >
        {groups.length === 0 && (
          <div className="px-4 py-10 text-center text-[13px] text-stone-400 dark:text-stone-500">
            Nothing matches “{query}”.
          </div>
        )}
        {groups.map(([project, projectFiles]) => (
          <section key={project} className="relative">
            <div className="sticky top-0 z-30 mb-2 flex items-baseline gap-2 bg-white pt-2 pb-2 dark:bg-stone-900">
              <span className="text-[12px] font-medium text-stone-600 dark:text-stone-300">
                {project}
              </span>
              <span className="text-[11px] tabular-nums text-stone-400 dark:text-stone-500">
                {projectFiles.length} files · {factCount(projectFiles)} facts
              </span>
            </div>
            {viewMode === "cards" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2 pt-1">
                {projectFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onOpen={() => onOpenFile(file)}
                    onToggleContext={() => onToggleContext(file)}
                  />
                ))}
              </div>
            ) : (
              projectFiles.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  onOpen={() => onOpenFile(file)}
                  onToggleContext={() => onToggleContext(file)}
                />
              ))
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
