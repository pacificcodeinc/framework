import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Mic,
  NotepadText,
  Plus,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@framework/ui/components/dropdown-menu";
import { Textarea } from "@framework/ui/components/textarea";
import { cn } from "@framework/ui/lib/utils";

const MODELS = ["Fast", "Standard", "Smart"] as const;
type Model = (typeof MODELS)[number];

type Attachment = {
  id: string;
  name: string;
};

export function Home() {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasText, setHasText] = useState(false);
  const [model, setModel] = useState<Model>("Standard");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const canSend = hasText || attachments.length > 0;

  const syncPrompt = () => {
    const el = promptRef.current;
    if (!el) return;
    if (el.value) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    } else {
      // Leave the empty box at its natural min height; a pinned pixel
      // height measured from a stale layout would stick.
      el.style.height = "";
    }
    setHasText(el.value.trim().length > 0);
  };

  const addAttachments = (files: FileList | null, input: HTMLInputElement) => {
    if (!files?.length) return;

    const selected = Array.from(files);
    setAttachments((current) => [
      ...current,
      ...selected.map((file, index) => ({
        id: `file-${Date.now()}-${index}-${file.name}`,
        name: file.name,
      })),
    ]);
    input.value = "";
  };

  // Size to initial content (e.g. a restored draft) and re-measure when
  // the box's width changes, since wrapping changes the content height.
  useEffect(() => {
    syncPrompt();
    const el = promptRef.current;
    if (!el) return;
    const observer = new ResizeObserver(syncPrompt);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-[41rem]">
        <h1 className="mb-8 text-center text-[28px] font-semibold tracking-tight text-stone-800 dark:text-stone-100">
          What are we building today?
        </h1>

        {/* Prompt card */}
        <div className="relative z-10 rounded-[22px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] dark:border-stone-700/60 dark:bg-stone-800/50 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.25)]">
          <Textarea
            ref={promptRef}
            onInput={syncPrompt}
            placeholder="Describe a workflow, a dataset, or an interface"
            rows={2}
            className="max-h-64 min-h-[52px] overflow-y-auto px-4 pt-3.5 text-[15px] placeholder:text-stone-400 dark:placeholder:text-stone-500"
          />

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex max-w-48 items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 py-1 pr-1 pl-2 text-xs text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                  title={attachment.name}
                >
                  <span className="shrink-0 text-stone-400">File</span>
                  <span className="min-w-0 truncate">{attachment.name}</span>
                  <button
                    type="button"
                    className="flex size-4 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-200"
                    aria-label={`Remove ${attachment.name}`}
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((item) => item.id !== attachment.id)
                      )
                    }
                  >
                    <X className="size-3" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 px-2.5 pb-2.5">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700/60"
              aria-label="Attach files"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="size-[18px]" strokeWidth={1.75} />
            </button>

            <div className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] text-stone-600 transition-colors hover:bg-stone-100 data-[state=open]:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700/60 dark:data-[state=open]:bg-stone-700/60">
                  {model}
                  <ChevronDown className="size-3.5 text-stone-400" strokeWidth={2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {MODELS.map((m) => (
                  <DropdownMenuItem key={m} onSelect={() => setModel(m)}>
                    <span className="flex-1">{m}</span>
                    {m === model && <Check className="size-3.5" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              className="flex size-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700/60"
              aria-label="Dictate"
            >
              <Mic className="size-[18px]" strokeWidth={1.75} />
            </button>

            <button
              disabled={!canSend}
              className={cn(
                "ml-0.5 flex size-8 items-center justify-center rounded-full text-white transition-colors",
                canSend
                  ? "bg-stone-900 hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
                  : "bg-stone-300 dark:bg-stone-700 dark:text-stone-400"
              )}
              aria-label="Send"
            >
              <ArrowUp className="size-[18px]" strokeWidth={2.25} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) =>
              addAttachments(event.currentTarget.files, event.currentTarget)
            }
          />
        </div>

        {/* Attached footer */}
        <div className="relative -mt-4 rounded-b-2xl border-x border-b border-stone-200/70 bg-stone-50 px-4 pt-6 pb-2.5 dark:border-stone-800 dark:bg-stone-900/70">
          <button className="flex items-center gap-2 rounded-md text-[13px] text-stone-600 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200">
            <NotepadText className="size-4 text-stone-400 dark:text-stone-500" strokeWidth={1.75} />
            Choose project
          </button>
        </div>
      </div>
    </div>
  );
}
