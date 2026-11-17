"use client";

import { useEffect } from "react";

/** The theme's small bits of scripting in one place: reveal-on-scroll, words that light up, the cursor colour-split on big headlines, and "shop by" card reveal. */
export default function HomeFx() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];

    // Reveal on enter.
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    document.querySelectorAll("[data-tx-reveal], [data-tx-cats]").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    // Scroll-lit words.
    const lit = document.querySelectorAll<HTMLElement>("[data-tx-words]");
    const onScroll = () => lit.forEach((p) => {
      const ws = p.querySelectorAll<HTMLElement>(".tx-words__w");
      const r = p.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const n = Math.round(prog * ws.length);
      ws.forEach((w, i) => w.classList.toggle("is-lit", i < n));
    });
    if (lit.length) { onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll); cleanups.push(() => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); }); }

    // Colour-split on headlines near the cursor.
    if (!reduce) {
      document.querySelectorAll<HTMLElement>("[data-tx-landing]").forEach((root) => {
        const chars = [...root.querySelectorAll<HTMLElement>(".tx-landing__char")];
        const move = (e: MouseEvent) => chars.forEach((c) => {
          const r = c.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          c.style.setProperty("--p", String(Math.max(0, 1 - d / 140).toFixed(2)));
        });
        const leave = () => chars.forEach((c) => c.style.setProperty("--p", "0"));
        root.addEventListener("mousemove", move); root.addEventListener("mouseleave", leave);
        cleanups.push(() => { root.removeEventListener("mousemove", move); root.removeEventListener("mouseleave", leave); });
      });
    }
    return () => cleanups.forEach((f) => f());
  }, []);
  return null;
}
