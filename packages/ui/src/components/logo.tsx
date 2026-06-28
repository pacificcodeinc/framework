import { cn } from "../lib/utils";

/**
 * The Framework mark: a square shell with an inset channel.
 */
function FrameworkMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 20"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 2h16v16H0V2Zm8 2h6v12H8V4Z"
      />
    </svg>
  );
}

function FrameworkWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <FrameworkMark className="size-[18px]" />
      <span className="text-[13px] font-semibold uppercase tracking-[0.16em]">
        Framework
      </span>
    </span>
  );
}

export { FrameworkMark, FrameworkWordmark };
