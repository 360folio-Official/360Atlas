"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A scroll strip with previous/next buttons instead of a scrollbar.
// Works in both reading directions: "next" always moves toward the end of the row.
export default function CarouselTrack({ children }: { children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    // scrollLeft is 0 → negative in RTL, so compare its absolute value.
    const pos = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    // Snap points can leave the row a few pixels off either end.
    setCanBack(pos > 24);
    setCanForward(pos < max - 24);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update]);

  const move = (forward: boolean) => {
    const el = track.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const step = el.clientWidth * 0.85 * (forward ? 1 : -1) * (rtl ? -1 : 1);
    el.scrollBy({ left: step, behavior: "smooth" });
  };

  const button =
    "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/95 text-xl text-ink shadow-lg backdrop-blur transition hover:bg-ink hover:text-white sm:flex disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous"
        onClick={() => move(false)}
        disabled={!canBack}
        className={`${button} -start-5`}
      >
        <span className="rtl:rotate-180" aria-hidden>‹</span>
      </button>
      <div
        ref={track}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 pt-1"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Next"
        onClick={() => move(true)}
        disabled={!canForward}
        className={`${button} -end-5`}
      >
        <span className="rtl:rotate-180" aria-hidden>›</span>
      </button>
    </div>
  );
}
