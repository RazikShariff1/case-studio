/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

const ModelViewer = "model-viewer" as unknown as (props: Record<string, unknown>) => ReactNode;

/** snippets/tx-stone-3d.liquid: the flat stone shows until the glb has loaded, then cross-fades to the 3D model. */
export default function Stone3D({ className = "", spin = 25, eager = false, attrs = {} }: { className?: string; spin?: number; eager?: boolean; attrs?: Record<string, unknown> }) {
  return (
    <span className={`tx-stone-3d ${className}`} data-tx-stone-3d>
      <img className="tx-stone-3d__poster" src="/theme/thingx-stone.png" alt="" width={237} height={260} loading={eager ? "eager" : "lazy"} />
      <ModelViewer
        class="tx-stone-3d__model"
        src="/theme/thingx-stone.glb"
        alt=""
        aria-hidden="true"
        loading={eager ? "eager" : "lazy"}
        {...(spin > 0 ? { "auto-rotate": "", "auto-rotate-delay": "0", "rotation-per-second": `${spin}deg` } : {})}
        interaction-prompt="none"
        environment-image="neutral"
        exposure="1"
        shadow-intensity="0"
        camera-orbit="auto 80deg 86%"
        {...attrs}
      >
        <span slot="progress-bar" />
        <span slot="poster" />
      </ModelViewer>
    </span>
  );
}
