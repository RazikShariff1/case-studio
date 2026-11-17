"use client";

import { useState } from "react";
import Link from "next/link";
import CaseViewer from "@/components/three/CaseViewer";
import type { Finish } from "@/components/three/case-scene";

const FINISHES: { slug: string; label: string; finish: Finish; blurb: string; colors: { name: string; hex: string }[] }[] = [
  { slug: "minimal", label: "Minimal", finish: "matte", blurb: "Soft-touch matte in quiet colours.", colors: [{ name: "Sage", hex: "#a9b79a" }, { name: "Sand", hex: "#d3bfa5" }, { name: "Navy", hex: "#1f2a44" }, { name: "Blush", hex: "#e6b8bf" }] },
  { slug: "minimal", label: "Clear", finish: "clear", blurb: "Crystal clear, so your phone's colour shows.", colors: [{ name: "Crystal", hex: "#dfe3e4" }, { name: "Smoke", hex: "#8a8d90" }, { name: "Blue", hex: "#6f93c9" }] },
  { slug: "trendy", label: "Trendy", finish: "waves", blurb: "Printed patterns, fresh every week.", colors: [{ name: "Lilac", hex: "#b9a8d8" }, { name: "Teal", hex: "#3a8f8a" }, { name: "Pink", hex: "#e9a9b8" }] },
  { slug: "luxury", label: "Luxury", finish: "metal", blurb: "A polished metal frame and a leather back.", colors: [{ name: "Gold", hex: "#c9a24a" }, { name: "Chrome", hex: "#b9bcc4" }, { name: "Brown", hex: "#6b4a34" }] },
  { slug: "colorful", label: "Colorful", finish: "gradient", blurb: "Bright gradients, impossible to miss.", colors: [{ name: "Orange", hex: "#e8833a" }, { name: "Blue", hex: "#6f93c9" }, { name: "Green", hex: "#3f7d5a" }] },
];

/** "Every finish, in 3D": pick a finish and a colour and turn the case around. */
export default function FinishExplorer() {
  const [i, setI] = useState(0);
  const [c, setC] = useState(0);
  const f = FINISHES[i];
  const color = f.colors[Math.min(c, f.colors.length - 1)];

  return (
    <div className="tile stage-3d grid overflow-hidden md:grid-cols-[1fr_1.1fr]">
      <div className="order-2 p-8 md:order-1 md:p-14 md:pr-0">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Finish">
          {FINISHES.map((x, n) => (
            <button key={x.label} type="button" aria-pressed={n === i} onClick={() => { setI(n); setC(0); }}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] transition ${n === i ? "bg-ink text-white" : "bg-white text-ink hover:bg-surface-2"}`}>
              {x.label}
            </button>
          ))}
        </div>
        <h3 className="mt-8 text-[28px] font-semibold tracking-tight md:text-[40px] md:leading-tight">{f.label}. <span className="text-muted">{color.name}.</span></h3>
        <p className="mt-2 text-[17px] text-muted">{f.blurb}</p>
        <div className="mt-6 flex gap-3" role="group" aria-label="Colour">
          {f.colors.map((x, n) => (
            <button key={x.name} type="button" aria-label={x.name} aria-pressed={x.name === color.name} onClick={() => setC(n)}
              className={`grid h-11 w-11 place-items-center rounded-full border-2 transition ${x.name === color.name ? "border-blue" : "border-transparent hover:border-ink/20"}`}>
              <span className="block h-8 w-8 rounded-full border border-black/15" style={{ background: x.hex }} />
            </button>
          ))}
        </div>
        <Link href={`/shop?category=${f.slug}`} className="link link-arrow mt-8 inline-block text-[17px]">Shop {f.label.toLowerCase()}</Link>
      </div>
      <CaseViewer className="order-1 aspect-square w-full md:order-2 md:aspect-auto md:min-h-[560px]" items={[{ color: color.hex, finish: f.finish }]} label={`${f.label} case in ${color.name}, in 3D`} hint />
    </div>
  );
}
