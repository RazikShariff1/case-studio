"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CaseSpec, SceneHandle, SceneMode } from "./case-scene";

type Props = {
  items: CaseSpec[];
  mode?: SceneMode;
  label: string;
  /** Shown instead when the device cannot draw 3D. */
  fallback?: ReactNode;
  /** Show the "drag to turn" pill. */
  hint?: boolean;
  className?: string;
};

/**
 * A 3D phone case you can spin. Three.js is loaded on demand, after the page is up, so it never slows the first paint.
 * If WebGL is not available the fallback (usually the product photo) is shown instead.
 */
export default function CaseViewer({ items, mode = "single", label, fallback, hint = false, className = "" }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<SceneHandle | null>(null);
  const latest = useRef(items);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const key = JSON.stringify(items);

  useEffect(() => {
    let cancelled = false;
    import("./case-scene")
      .then(({ mountScene }) => {
        if (cancelled || !host.current) return;
        handle.current = mountScene(host.current, { mode, items: latest.current, onReady: () => !cancelled && setState("ready") });
      })
      .catch(() => { if (!cancelled) setState("failed"); });
    return () => {
      cancelled = true;
      handle.current?.destroy();
      handle.current = null;
    };
  }, [mode]);

  useEffect(() => {
    latest.current = JSON.parse(key) as CaseSpec[];
    handle.current?.update(latest.current);
  }, [key]);

  if (state === "failed" && fallback) return <div className={`relative ${className}`}>{fallback}</div>;

  return (
    <div className={`relative ${className}`} role="img" aria-label={label}>
      <div ref={host} className={`absolute inset-0 transition-opacity duration-700 ${state === "ready" ? "opacity-100" : "opacity-0"}`} />
      {state === "loading" && <div className="absolute inset-0 grid place-items-center" aria-hidden><span className="h-8 w-8 animate-spin rounded-full border-2 border-ink/10 border-t-ink/50" /></div>}
      {hint && state === "ready" && (
        <p className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[12px] font-medium text-ink/70 shadow-sm backdrop-blur" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></svg>
          Drag to turn
        </p>
      )}
    </div>
  );
}
