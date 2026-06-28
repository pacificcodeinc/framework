import type { LucideIcon } from "lucide-react";
import {
  Camera,
  FileText,
  NotepadText,
  Scale,
  Search,
  Table2,
} from "lucide-react";
import { cn } from "@framework/ui/lib/utils";
import type { FileKind } from "./data";

export const KIND_ICONS: Record<FileKind, LucideIcon> = {
  document: NotepadText,
  spreadsheet: Table2,
  contract: Scale,
  reference: Search,
  report: FileText,
  media: Camera,
};

export function KindGlyph({
  kind,
  className,
  iconClassName,
}: {
  kind: FileKind;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = KIND_ICONS[kind];
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
        className
      )}
    >
      <Icon className={cn("size-3.5", iconClassName)} strokeWidth={1.75} />
    </span>
  );
}
