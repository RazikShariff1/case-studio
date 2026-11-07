"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

const KEY = "wishlist";
const read = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
};
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("wishlist-change", cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener("wishlist-change", cb); };
};

const btn = "grid h-11 w-11 place-items-center rounded-2xl bg-white/45 text-ink backdrop-blur-md transition active:scale-95";

export function BackButton() {
  const router = useRouter();
  return (
    <button aria-label="Go back" className={btn} onClick={() => (window.history.length > 1 ? router.back() : router.push("/shop"))}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
    </button>
  );
}

/** Saved on this device only (localStorage) until wishlists live on the backend. */
export function HeartButton({ slug }: { slug: string }) {
  const raw = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY) ?? "[]", () => "[]");
  const on = (() => { try { return (JSON.parse(raw) as string[]).includes(slug); } catch { return false; } })();

  function toggle() {
    const list = read();
    const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new Event("wishlist-change"));
  }

  return (
    <button aria-label={on ? "Remove from saved" : "Save"} aria-pressed={on} className={btn} onClick={toggle}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
    </button>
  );
}
