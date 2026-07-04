import type { WheelEvent } from "react";

/** Maps vertical wheel motion onto a horizontally scrolling strip. */
export function scrollHorizontallyOnWheel(event: WheelEvent<HTMLElement>) {
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
}
