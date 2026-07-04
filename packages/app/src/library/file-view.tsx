import { Bookmark, Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { cn } from "@framework/ui/lib/utils";
import { KIND_LABELS, type LibraryFile } from "./data";
import { KindGlyph } from "./kind";

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <span
      className="flex h-1 w-8 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"
      title={`${Math.round(value * 100)}% confidence`}
    >
      <span
        className={cn(
          "rounded-full",
          value >= 0.8
            ? "bg-stone-500 dark:bg-stone-400"
            : "bg-stone-300 dark:bg-stone-600"
        )}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </span>
  );
}

export function FileView({
  file,
  onToggleContext,
  onAskAbout,
}: {
  file: LibraryFile;
  onToggleContext: () => void;
  onAskAbout: () => void;
}) {
  const needsReview = file.facts.filter((fact) => fact.confidence < 0.8);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* File header */}
      <div className="border-b border-stone-200/70 px-4 py-3 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <KindGlyph kind={file.kind} className="size-9 rounded-xl" iconClassName="size-4" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium text-stone-800 dark:text-stone-100">
              {file.name}
            </div>
            <div className="truncate text-[11px] text-stone-400 dark:text-stone-500">
              {KIND_LABELS[file.kind]} · {file.project} · {file.size} ·{" "}
              {file.modified}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleContext}
            aria-pressed={file.inContext}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] transition-colors",
              file.inContext
                ? "bg-stone-200/70 text-stone-800 dark:bg-stone-700/60 dark:text-stone-100"
                : "border border-stone-200 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            )}
          >
            <Bookmark
              className="size-3"
              strokeWidth={2}
              fill={file.inContext ? "currentColor" : "none"}
            />
            {file.inContext ? "In context" : "Pin to context"}
          </button>
          <button
            type="button"
            onClick={onAskAbout}
            className="flex items-center gap-1.5 rounded-full border border-stone-200 px-2.5 py-1 text-[12px] text-stone-600 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <MessageCircleQuestion className="size-3" strokeWidth={2} />
            Ask about this file
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {/* Preview placeholder until the file service lands */}
        <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50 dark:border-stone-700/70 dark:bg-stone-900/60">
          <div className="flex flex-col items-center gap-1.5 text-stone-300 dark:text-stone-600">
            <KindGlyph kind={file.kind} className="size-10 rounded-xl" iconClassName="size-5" />
            <span className="text-[11px]">Preview arrives with the file service</span>
          </div>
        </div>

        {/* What Framework knows */}
        <div className="mt-4 flex items-baseline justify-between">
          <h3 className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
            <Sparkles className="size-3.5 text-stone-400 dark:text-stone-500" strokeWidth={2} />
            What Framework knows
          </h3>
          {needsReview.length > 0 && (
            <span className="text-[11px] text-stone-400 dark:text-stone-500">
              {needsReview.length} to review
            </span>
          )}
        </div>

        {file.status === "processing" && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-stone-200/70 bg-white px-3 py-3 text-[13px] text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
            <Loader2 className="size-4 animate-spin text-stone-400" strokeWidth={2} />
            Extracting — facts will appear here as they're verified.
          </div>
        )}

        {file.status === "inbox" && (
          <div className="mt-3 rounded-xl border border-stone-200/70 bg-white px-3 py-3 dark:border-stone-800 dark:bg-stone-900">
            <div className="text-[13px] text-stone-600 dark:text-stone-300">
              Not extracted yet.
            </div>
            <div className="mt-0.5 text-[12px] text-stone-400 dark:text-stone-500">
              Framework hasn't read this file. Extraction will pull out the facts
              worth knowing.
            </div>
            <button
              type="button"
              className="mt-2.5 rounded-full bg-stone-900 px-3 py-1 text-[12px] text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              Extract now
            </button>
          </div>
        )}

        {file.status === "extracted" && (
          <ul className="mt-2 flex flex-col">
            {file.facts.map((fact) => (
              <li
                key={fact.label}
                className="flex items-center gap-3 border-b border-stone-100 py-2 last:border-b-0 dark:border-stone-800/70"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-stone-400 dark:text-stone-500">
                    {fact.label}
                  </div>
                  <div
                    className="truncate text-[13px] text-stone-800 dark:text-stone-200"
                    data-selectable="true"
                  >
                    {fact.value}
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-400 dark:bg-stone-800 dark:text-stone-500">
                  {fact.source}
                </span>
                <ConfidenceMeter value={fact.confidence} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
