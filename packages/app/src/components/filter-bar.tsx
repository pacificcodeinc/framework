import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@framework/ui/lib/utils";
import { scrollHorizontallyOnWheel } from "./horizontal-wheel";

export type FilterOption<F extends string> = { id: F; label: string };

/**
 * Standard panel toolbar: a search input with a scrollable filter-chip row
 * beneath it. Panes swap `searchSlot` in for the input when a transient bar
 * (bulk-selection actions, etc.) should take its place without shifting the
 * layout, and hang extra controls off `trailing` after the chips.
 */
export function FilterBar<F extends string>({
  query,
  onQueryChange,
  placeholder,
  isScrolled,
  filters,
  activeFilter,
  onSelectFilter,
  searchSlot,
  trailing,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  /** Draws the bottom border once the list below has scrolled. */
  isScrolled: boolean;
  filters: ReadonlyArray<FilterOption<F>>;
  activeFilter: F;
  onSelectFilter: (id: F) => void;
  /** Rendered in place of the search input; keep it h-8 to avoid layout shift. */
  searchSlot?: ReactNode;
  /** Right-aligned controls after the filter chips (view toggles, etc.). */
  trailing?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b px-2 pt-1 pb-2 transition-colors",
        isScrolled
          ? "border-stone-200/70 dark:border-stone-800"
          : "border-transparent"
      )}
    >
      {searchSlot ?? (
        <label className="flex h-8 items-center gap-2 rounded-lg border border-transparent bg-accent px-2.5 text-accent-foreground focus-within:border-ring/40">
          <Search className="size-3.5 shrink-0 opacity-55" strokeWidth={2} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-[13px] text-inherit outline-none placeholder:text-muted-foreground"
          />
        </label>
      )}
      <div className="flex items-center gap-2">
        <div
          onWheel={scrollHorizontallyOnWheel}
          className="flex min-w-0 flex-1 flex-nowrap gap-1 overflow-x-auto overscroll-x-contain pr-5 [mask-image:linear-gradient(to_right,black_0,black_calc(100%-24px),transparent_100%)] [scrollbar-width:none] [-webkit-mask-image:linear-gradient(to_right,black_0,black_calc(100%-24px),transparent_100%)] [&::-webkit-scrollbar]:hidden"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectFilter(f.id)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-[12px] transition-colors",
                activeFilter === f.id
                  ? "text-stone-800 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800"
                  : "text-stone-400 hover:bg-stone-100 hover:text-stone-500 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-400"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {trailing && <div className="flex shrink-0 gap-0.5">{trailing}</div>}
      </div>
    </div>
  );
}
