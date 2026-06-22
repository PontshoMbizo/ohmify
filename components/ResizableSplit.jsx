"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Two-pane horizontal split with a draggable divider (desktop) that stacks
 * vertically on small screens. The left pane's width is a percentage of the
 * container, clamped to [min, max]; the right pane flexes to fill the rest.
 *
 * Used by the problem page to let solvers resize the description vs. simulator
 * panes. Below the `lg` breakpoint the panes stack and the handle is hidden, so
 * the inline width is only applied when the split is actually horizontal.
 */
export default function ResizableSplit({ left, right, initial = 50, min = 25, max = 75 }) {
  const [leftPct, setLeftPct] = useState(initial);
  const [isWide, setIsWide] = useState(false);
  const containerRef = useRef(null);

  // Only split horizontally (and apply the width %) at the `lg` breakpoint,
  // matching the Tailwind `lg:` row layout below. Tracked in JS because the
  // width is an inline style that would otherwise constrain the stacked panes.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const startDrag = useCallback((e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const onMove = (ev) => {
      const rect = container.getBoundingClientRect();
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const pct = ((x - rect.left) / rect.width) * 100;
      setLeftPct(Math.max(min, Math.min(max, pct)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [min, max]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col lg:flex-row overflow-hidden items-stretch min-h-0"
    >
      <div
        className="w-full min-h-0 overflow-hidden lg:h-full"
        style={isWide ? { width: `${leftPct}%` } : undefined}
      >
        {left}
      </div>

      {isWide && (
        <div
          onPointerDown={startDrag}
          title="Drag to resize"
          className="hidden lg:flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-slate-200 hover:bg-green-500/60 transition-colors group touch-none"
        >
          <div className="h-10 w-0.5 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
        </div>
      )}

      <div className="w-full min-h-0 overflow-hidden lg:h-full lg:flex-1">
        {right}
      </div>
    </div>
  );
}
