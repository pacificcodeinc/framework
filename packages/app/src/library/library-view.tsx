import { useMemo, useState } from "react";
import { Bookmark, Inbox, LayoutGrid, List, Loader2 } from "lucide-react";
import { cn } from "@framework/ui/lib/utils";
import { FilterBar } from "../components/filter-bar";
import {
  factCount,
  KIND_LABELS,
  type FileKind,
  type LibraryFile,
} from "./data";
import { KIND_ICONS, KindGlyph } from "./kind";

const FILTERS: Array<{ id: FileKind | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "drawing", label: KIND_LABELS.drawing },
  { id: "legal", label: KIND_LABELS.legal },
  { id: "financial", label: KIND_LABELS.financial },
  { id: "site", label: KIND_LABELS.site },
  { id: "report", label: KIND_LABELS.report },
  { id: "photo", label: KIND_LABELS.photo },
];

type LibraryViewMode = "cards" | "list";
const LIBRARY_VIEW_MODE_KEY = "framework:library-view-mode";

function getStoredViewMode(): LibraryViewMode {
  const stored = localStorage.getItem(LIBRARY_VIEW_MODE_KEY);
  return stored === "list" || stored === "cards" ? stored : "cards";
}

function StatusBadge({ file }: { file: LibraryFile }) {
  if (file.status === "processing") {
    return (
      <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
        <Loader2 className="size-3 animate-spin" strokeWidth={2} />
        extracting
      </span>
    );
  }
  if (file.status === "inbox") {
    return (
      <span className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
        <Inbox className="size-3" strokeWidth={2} />
        inbox
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
  file: LibraryFile;
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
  file: LibraryFile;
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
        ) : file.status === "inbox" ? (
          <span>inbox · {file.size} · {file.modified}</span>
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

export function LibraryView({
  files,
  onOpenFile,
  onToggleContext,
}: {
  files: LibraryFile[];
  onOpenFile: (file: LibraryFile) => void;
  onToggleContext: (file: LibraryFile) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FileKind | "all">("all");
  const [viewMode, setViewMode] =
    useState<LibraryViewMode>(getStoredViewMode);
  const [isFileListScrolled, setIsFileListScrolled] = useState(false);

  const chooseViewMode = (mode: LibraryViewMode) => {
    setViewMode(mode);
    localStorage.setItem(LIBRARY_VIEW_MODE_KEY, mode);
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
    const byProject = new Map<string, LibraryFile[]>();
    for (const file of visible) {
      const group = byProject.get(file.project) ?? [];
      group.push(file);
      byProject.set(file.project, group);
    }
    return [...byProject.entries()];
  }, [visible]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search files and projects"
        isScrolled={isFileListScrolled}
        filters={FILTERS}
        activeFilter={filter}
        onSelectFilter={setFilter}
        trailing={[
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
      />

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
