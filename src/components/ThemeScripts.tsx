"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Runs the Shopify theme's own scripts (tx-scroll.js: reveal, words, stone hero choreography; tx-carousel.js:
 * letter rise, colour split, stone 3D cross-fade) and loads model-viewer for the 3D stone. The theme scripts
 * initialise once against the DOM they find, so they are re-added after every client-side navigation.
 */
export default function ThemeScripts() {
  const pathname = usePathname();
  useEffect(() => {
    if (!customElements.get("model-viewer") && !document.querySelector("script[data-mv]")) {
      const mv = document.createElement("script");
      mv.type = "module";
      mv.dataset.mv = "";
      mv.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
      document.head.appendChild(mv);
    }
    // Wait until React has finished hydrating, or the scripts' DOM changes would read as a mismatch.
    const added: HTMLScriptElement[] = [];
    const t = setTimeout(() => {
      const stamp = Date.now();
      for (const f of ["tx-scroll.js", "tx-carousel.js"]) {
        const s = document.createElement("script");
        s.src = `/theme/${f}?v=${stamp}`;
        document.body.appendChild(s);
        added.push(s);
      }
    }, 600);
    return () => { clearTimeout(t); added.forEach((s) => s.remove()); };
  }, [pathname]);
  return null;
}
