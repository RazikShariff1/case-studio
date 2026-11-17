/**
 * The 3D phone case, drawn with Three.js. Everything is built from code (no model files to download), at the proportions of
 * a 6.1" phone (1 unit = 100 mm): a case with rounded walls and a raised lip, the phone's frosted camera plateau showing
 * through a cut-out, lenses with coated glass, button covers, port and speaker cut-outs, a lit screen, and studio lighting.
 *
 * This module touches the DOM and WebGL, so it is only ever loaded in the browser (CaseViewer imports it on demand).
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type Finish = "matte" | "clear" | "metal" | "waves" | "gradient";
export type CaseSpec = { color: string; finish: Finish };
export type SceneMode = "single" | "hero";
export type SceneHandle = { update(items: CaseSpec[]): void; destroy(): void };

// ---- dimensions (1 unit = 100 mm) ----
const W = 0.716, H = 1.466, D = 0.0825, R = 0.14; // the phone
const WALL = 0.017; // case side wall
const CW = W + 2 * WALL, CH = H + 2 * WALL, CR = R + WALL; // case outside
const DC = D + 0.024; // case depth: 1.2 mm back + 1.2 mm screen lip
const BS = 0.008, BT = 0.02; // the case's rounded edge: a little in from the side, more along the depth, like a moulded case
const P = 0.36, PR = 0.085; // camera plateau
const PX = -W / 2 + 0.034 + P / 2, PY = H / 2 - 0.034 - P / 2;
const CUT = P + 0.022; // camera cut-out in the case
const PLATEAU_TOP = DC / 2 + 0.004;

/** A rounded rectangle with "continuous" (squircle) corners, as phones have, rather than plain circular ones. */
function squircle(w: number, h: number, r: number, cx = 0, cy = 0, n = 4.2, seg = 14) {
  const pts: THREE.Vector2[] = [];
  const corners: [number, number, number][] = [
    [cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, Math.PI / 2],
    [cx - w / 2 + r, cy - h / 2 + r, Math.PI], [cx + w / 2 - r, cy - h / 2 + r, (3 * Math.PI) / 2],
  ];
  for (const [ox, oy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      const c = Math.cos(a), s = Math.sin(a);
      pts.push(new THREE.Vector2(ox + r * Math.sign(c) * Math.abs(c) ** (2 / n), oy + r * Math.sign(s) * Math.abs(s) ** (2 / n)));
    }
  }
  return pts;
}
const shape = (pts: THREE.Vector2[], ...holes: THREE.Vector2[][]) => {
  const s = new THREE.Shape(pts);
  holes.forEach((h) => s.holes.push(new THREE.Path(h)));
  return s;
};

// ---- canvas textures ----

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d", { willReadFrequently: true })!] as const;
}
function colorTex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Turns a greyscale height field into a tangent-space normal map that tiles. */
function normalMapFrom(height: Float32Array, size: number, strength: number, repeat: number) {
  const [c, g] = canvas(size, size);
  const img = g.createImageData(size, size);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      img.data[i] = (-dx / len * 0.5 + 0.5) * 255;
      img.data[i + 1] = (dy / len * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
}

/** Blur a tiling height field in place (box blur, a few passes ~ gaussian). */
function blur(h: Float32Array, size: number, r: number, passes = 2) {
  const tmp = new Float32Array(h.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += h[y * size + ((x + k + size) % size)];
      tmp[y * size + x] = s / (2 * r + 1);
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += tmp[((y + k + size) % size) * size + x];
      h[y * size + x] = s / (2 * r + 1);
    }
  }
}

/** Seeded random, so every visit draws the same grain. */
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/** Fine sand-blasted grain, for soft-touch matte. */
function grainNormal() {
  const size = 256, rand = rng(7), h = new Float32Array(size * size);
  for (let i = 0; i < h.length; i++) h[i] = rand();
  blur(h, size, 1, 1);
  return normalMapFrom(h, size, 1.6, 6);
}

/** Pebbled leather: soft round bumps with creases between them. */
function leatherNormal() {
  const size = 256, rand = rng(42), h = new Float32Array(size * size);
  const pts = Array.from({ length: 420 }, () => [rand() * size, rand() * size]);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let d1 = 1e9, d2 = 1e9;
    for (const [px, py] of pts) {
      let dx = Math.abs(x - px), dy = Math.abs(y - py);
      dx = Math.min(dx, size - dx); dy = Math.min(dy, size - dy);
      const d = dx * dx + dy * dy;
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    h[y * size + x] = Math.min(1, (Math.sqrt(d2) - Math.sqrt(d1)) / 5) + rand() * 0.15;
  }
  blur(h, size, 1, 2);
  return normalMapFrom(h, size, 2.2, 3.2);
}

function shadowTexture() {
  const [c, g] = canvas(256, 128);
  const grad = g.createRadialGradient(128, 64, 4, 128, 64, 124);
  grad.addColorStop(0, "rgba(0,0,0,0.6)");
  grad.addColorStop(0.4, "rgba(0,0,0,0.2)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.setTransform(1, 0, 0, 0.5, 0, 32);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return colorTex(c);
}

/** The lock screen: a soft wallpaper and the time. */
function wallpaperTexture(w: number, h: number) {
  const [c, g] = canvas(512, 1024);
  g.fillStyle = "#06060a";
  g.fillRect(0, 0, 512, 1024);
  for (const [x, y, r, col] of [[90, 820, 560, "rgba(70,80,230,0.75)"], [440, 260, 460, "rgba(235,90,150,0.6)"], [300, 560, 300, "rgba(255,170,90,0.25)"]] as const) {
    const rad = g.createRadialGradient(x, y, 0, x, y, r);
    rad.addColorStop(0, col);
    rad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rad;
    g.fillRect(0, 0, 512, 1024);
  }
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.textAlign = "center";
  g.font = "500 30px -apple-system, Helvetica, Arial, sans-serif";
  g.fillText("Wednesday 11 November", 256, 150);
  g.font = "600 150px -apple-system, Helvetica, Arial, sans-serif";
  g.fillText("9:41", 256, 290);
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.beginPath(); g.roundRect(186, 990, 140, 8, 4); g.fill(); // home bar
  const t = colorTex(c);
  t.repeat.set(-1 / w, 1 / h); // the screen faces backwards, so mirror it to read the right way round
  t.offset.set(0.5, 0.5);
  return t;
}

/** A camera lens seen through its glass: dark elements in rings, a violet-blue coating in the middle. */
function lensTexture() {
  const [c, g] = canvas(8, 256);
  const stops: [number, string][] = [[0, "#1a2350"], [0.08, "#0d1230"], [0.16, "#040508"], [0.3, "#16181d"], [0.34, "#050506"], [0.55, "#0b0c0f"], [0.6, "#1d1f24"], [0.64, "#060607"], [1, "#020203"]];
  const lin = g.createLinearGradient(0, 0, 0, 256);
  stops.forEach(([o, col]) => lin.addColorStop(o, col));
  g.fillStyle = lin;
  g.fillRect(0, 0, 8, 256);
  return colorTex(c);
}

/** Printed MagSafe ring for clear cases. */
function magsafeTexture() {
  const [c, g] = canvas(512, 768);
  g.strokeStyle = "#fff";
  g.lineWidth = 26;
  g.beginPath(); g.arc(256, 300, 200, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#fff";
  g.beginPath(); g.roundRect(240, 560, 32, 130, 16); g.fill();
  return colorTex(c);
}

/** A small embossed-looking wordmark near the bottom of the back. */
function logoTexture() {
  const [c, g] = canvas(512, 64);
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "600 34px -apple-system, Helvetica, Arial, sans-serif";
  g.letterSpacing = "10px";
  g.fillText("CASE STUDIO", 256, 34);
  return colorTex(c);
}

/** A printed back: waves of the colour, or a bright gradient that drifts from it. */
function patternTexture(finish: "waves" | "gradient", hex: string) {
  const [c, g] = canvas(768, 1536);
  g.scale(1.5, 1.5);
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(hex).getHSL(hsl);
  const tone = (dh: number, ds: number, dl: number) =>
    new THREE.Color().setHSL((hsl.h + dh + 1) % 1, Math.min(1, Math.max(0, hsl.s + ds)), Math.min(0.92, Math.max(0.06, hsl.l + dl))).getStyle();

  if (finish === "gradient") {
    const lin = g.createLinearGradient(0, 0, 512, 1024);
    lin.addColorStop(0, tone(0.1, 0.15, 0.15));
    lin.addColorStop(0.5, tone(0, 0.1, 0));
    lin.addColorStop(1, tone(-0.12, 0.1, -0.08));
    g.fillStyle = lin;
    g.fillRect(0, 0, 512, 1024);
    const blobs: [number, number, number, string, number][] = [[120, 760, 260, tone(0.2, 0.2, 0.2), 0.7], [430, 260, 220, tone(-0.2, 0.2, 0.1), 0.7], [300, 560, 160, "#ffffff", 0.25]];
    for (const [x, y, r, col, a] of blobs) {
      const rad = g.createRadialGradient(x, y, 0, x, y, r);
      rad.addColorStop(0, col);
      rad.addColorStop(1, "rgba(255,255,255,0)");
      g.globalAlpha = a;
      g.fillStyle = rad;
      g.fillRect(0, 0, 512, 1024);
    }
    g.globalAlpha = 1;
  } else {
    g.fillStyle = tone(0, 0, 0);
    g.fillRect(0, 0, 512, 1024);
    g.lineCap = "round";
    for (let i = -2; i < 22; i++) {
      g.beginPath();
      for (let x = -20; x <= 540; x += 6) {
        const y = i * 52 + Math.sin(x / 70 + i * 0.6) * 22;
        if (x === -20) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokeStyle = i % 3 === 0 ? tone(0, -0.05, 0.28) : i % 3 === 1 ? tone(0.04, 0, -0.12) : tone(-0.04, 0.05, 0.12);
      g.lineWidth = 18;
      g.stroke();
    }
  }
  const t = colorTex(c);
  // The back's UVs are its shape coordinates, so stretch the picture over the back.
  t.repeat.set(1 / (CW - 2 * BS), 1 / (CH - 2 * BS));
  t.offset.set(0.5, 0.5);
  return t;
}

/** A photo-studio light box for reflections: a dim room, a big soft light overhead and long strip lights at the sides. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const s = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];
  const add = (geo: THREE.BufferGeometry, color: THREE.ColorRepresentation, k: number, pos: [number, number, number], side: THREE.Side = THREE.DoubleSide) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
    disposables.push(geo, mat);
  };
  add(new THREE.BoxGeometry(14, 14, 14), "#3a3a3f", 1, [0, 0, 0], THREE.BackSide);
  add(new THREE.PlaneGeometry(7, 7), "#ffffff", 2.6, [0, 6, 0.5]); // overhead softbox
  add(new THREE.PlaneGeometry(1, 8), "#ffffff", 6, [5.5, 0.5, 3]); // key strip, right
  add(new THREE.PlaneGeometry(1, 8), "#f2f5ff", 3.5, [-5.5, 0.5, 2.5]); // strip, left
  add(new THREE.PlaneGeometry(9, 3.5), "#ffffff", 1.6, [0, 0.5, 6]); // big fill behind the camera
  add(new THREE.PlaneGeometry(5, 5), "#ffffff", 2.4, [0, 2.5, -6]); // rim light behind
  add(new THREE.PlaneGeometry(14, 14), "#8a8a90", 0.6, [0, -6.5, 0]); // grey floor
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(s, 0.015).texture;
  pmrem.dispose();
  disposables.forEach((d) => d.dispose());
  return env;
}

/** Geometry, textures and colour-independent materials, shared by every case in a scene. */
function makeAssets() {
  // Case shell: one moulded piece with rounded edges and a camera cut-out. Extrude puts the flat faces in group 0 and the walls in group 1.
  const shell = new THREE.ExtrudeGeometry(
    shape(squircle(CW - 2 * BS, CH - 2 * BS, CR - BS), squircle(CUT + 2 * BS, CUT + 2 * BS, PR + 0.011 + BS, PX, PY)),
    { depth: DC - 2 * BT, bevelEnabled: true, bevelThickness: BT, bevelSize: BS, bevelSegments: 10, curveSegments: 1 },
  );
  shell.translate(0, 0, -DC / 2 + BT);

  // The lip that stands proud of the screen.
  const lip = new THREE.ExtrudeGeometry(shape(squircle(CW - 2 * BS - 0.002, CH - 2 * BS - 0.002, CR - BS), squircle(W - 0.004, H - 0.004, R - 0.004)),
    { depth: 0.004, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 4, curveSegments: 1 });
  lip.translate(0, 0, -DC / 2 - 0.007);

  // Raised collar around the cameras.
  const collar = new THREE.ExtrudeGeometry(shape(squircle(CUT + 0.04, CUT + 0.04, PR + 0.03, PX, PY), squircle(CUT + 0.006, CUT + 0.006, PR + 0.014, PX, PY)),
    { depth: 0.01, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 6, curveSegments: 1 });
  collar.translate(0, 0, DC / 2 - 0.004);

  // The phone inside (seen through clear cases) and its camera plateau.
  const phone = new THREE.ExtrudeGeometry(shape(squircle(W - 0.012, H - 0.012, R - 0.006)), { depth: D - 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 4, curveSegments: 1 });
  phone.translate(0, 0, -D / 2 + 0.006);
  const plateau = new THREE.ExtrudeGeometry(shape(squircle(P, P, PR, PX, PY)), { depth: 0.01, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 4, curveSegments: 1 });
  plateau.translate(0, 0, PLATEAU_TOP - 0.014);

  // Screen: black glass, the display, the camera pill.
  const flip = (g: THREE.BufferGeometry, z: number) => { g.rotateY(Math.PI); g.translate(0, 0, z); return g; };
  const glass = flip(new THREE.ShapeGeometry(shape(squircle(W - 0.004, H - 0.004, R - 0.004)), 1), -DC / 2 - 0.001);
  const display = flip(new THREE.ShapeGeometry(shape(squircle(W - 0.034, H - 0.034, R - 0.02)), 1), -DC / 2 - 0.0013);
  const pill = flip(new THREE.ShapeGeometry(shape(squircle(0.125, 0.036, 0.018, 0, H / 2 - 0.07, 2.4)), 1), -DC / 2 - 0.0016);

  // Lens: a polished ring (lathed profile), a dark housing and a slightly domed, coated glass.
  const ringProfile = [[0.057, 0], [0.0612, 0.0015], [0.0626, 0.005], [0.0626, 0.0095], [0.0607, 0.0122], [0.0545, 0.0124], [0.0515, 0.0108], [0.0505, 0.008]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const lensRing = new THREE.LatheGeometry(ringProfile, 64);
  lensRing.rotateX(Math.PI / 2);
  const housing = new THREE.CylinderGeometry(0.0505, 0.0505, 0.008, 48);
  housing.rotateX(Math.PI / 2);
  housing.translate(0, 0, 0.004);
  const SR = 0.2, cap = Math.asin(0.047 / SR);
  const lensGlass = new THREE.SphereGeometry(SR, 64, 12, 0, Math.PI * 2, 0, cap);
  lensGlass.rotateX(Math.PI / 2);
  lensGlass.translate(0, 0, 0.0082 + SR * (1 - Math.cos(cap)) - SR);
  const flash = new THREE.CylinderGeometry(0.022, 0.023, 0.004, 40);
  flash.rotateX(Math.PI / 2);
  const flashRing = new THREE.TorusGeometry(0.0235, 0.0022, 8, 48);
  const dot = new THREE.CylinderGeometry(1, 1, 0.003, 32);
  dot.rotateX(Math.PI / 2);

  // Buttons, port and speaker holes.
  const button = new RoundedBoxGeometry(0.016, 1, 0.042, 3, 0.007);
  const port = new RoundedBoxGeometry(0.098, 0.02, 0.036, 3, 0.009);
  const hole = new THREE.CylinderGeometry(0.0046, 0.0046, 0.02, 16);

  const decal = new THREE.PlaneGeometry(1, 1);
  const shadow = new THREE.PlaneGeometry(1.5, 0.55);
  shadow.rotateX(-Math.PI / 2);

  const geo = { shell, lip, collar, phone, plateau, glass, display, pill, lensRing, housing, lensGlass, flash, flashRing, dot, button, port, hole, decal, shadow };

  const tex = {
    grain: grainNormal(), leather: leatherNormal(), shadow: shadowTexture(), wallpaper: wallpaperTexture(W - 0.034, H - 0.034),
    lens: lensTexture(), magsafe: magsafeTexture(), logo: logoTexture(),
  };

  const titanium = new THREE.MeshPhysicalMaterial({ color: "#8d9096", metalness: 1, roughness: 0.28 });
  const mats = {
    phoneBack: new THREE.MeshPhysicalMaterial({ color: "#3f4b5c", roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.35 }), // frosted glass
    titanium,
    plateau: new THREE.MeshPhysicalMaterial({ color: "#2f3540", roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#000000", roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }),
    display: new THREE.MeshPhysicalMaterial({ color: "#000000", emissive: "#ffffff", emissiveMap: tex.wallpaper, emissiveIntensity: 0.85, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }),
    pill: new THREE.MeshBasicMaterial({ color: "#000000" }),
    lensRing: titanium,
    housing: new THREE.MeshStandardMaterial({ color: "#0b0b0d", roughness: 0.5 }),
    lensGlass: new THREE.MeshPhysicalMaterial({ map: tex.lens, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0, iridescence: 0.55, iridescenceIOR: 1.6, iridescenceThicknessMinimum: 280, iridescenceThicknessMaximum: 420 }),
    flash: new THREE.MeshPhysicalMaterial({ color: "#efe7cf", roughness: 0.55, clearcoat: 1, clearcoatRoughness: 0.05, emissive: "#2a261a" }),
    lidar: new THREE.MeshPhysicalMaterial({ color: "#050507", roughness: 0.08, clearcoat: 1 }),
    port: new THREE.MeshStandardMaterial({ color: "#060606", roughness: 0.7 }),
    magsafe: new THREE.MeshPhysicalMaterial({ color: "#ffffff", alphaMap: tex.magsafe, transparent: true, roughness: 0.45, depthWrite: false }),
    shadow: new THREE.MeshBasicMaterial({ map: tex.shadow, transparent: true, depthWrite: false, opacity: 0.6 }),
  };

  return {
    geo, tex, mats,
    dispose() {
      Object.values(geo).forEach((g) => g.dispose());
      Object.values(tex).forEach((t) => t.dispose());
      new Set(Object.values(mats)).forEach((m) => m.dispose());
    },
  };
}
type Assets = ReturnType<typeof makeAssets>;

const LEATHER = new THREE.Color("#3a2219"); // deep brown, tinted a little toward the frame colour
const WHITE = new THREE.Color("#ffffff");

/** One phone in one case. Colour changes fade over a few frames. */
class CaseModel {
  readonly group = new THREE.Group();
  readonly body = new THREE.Group(); // everything that turns (the shadow stays flat)
  readonly shadow: THREE.Mesh;
  readonly finish: Finish;
  private frame: THREE.MeshPhysicalMaterial; // walls, lip, collar, buttons
  private back: THREE.MeshPhysicalMaterial; // the flat back
  private logo: THREE.MeshPhysicalMaterial | null = null;
  private tex: THREE.CanvasTexture | null = null;
  private target = new THREE.Color();

  constructor(spec: CaseSpec, { geo, tex, mats }: Assets) {
    const f = (this.finish = spec.finish);
    const grain = { normalMap: tex.grain, normalScale: new THREE.Vector2(0.18, 0.18) };
    this.frame = new THREE.MeshPhysicalMaterial(
      f === "clear" ? { transmission: 1, thickness: 0.05, roughness: 0.04, ior: 1.5, attenuationDistance: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.03, specularIntensity: 1 }
      : f === "metal" ? { metalness: 1, roughness: 0.14, clearcoat: 0.5, clearcoatRoughness: 0.05 }
      : f === "matte" ? { roughness: 0.62, sheen: 0.6, sheenRoughness: 0.55, sheenColor: new THREE.Color("#ffffff").multiplyScalar(0.25), ...grain }
      : { roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.12 },
    );
    this.back = f === "metal" ? new THREE.MeshPhysicalMaterial({ roughness: 0.62, sheen: 0.8, sheenRoughness: 0.45, normalMap: tex.leather, normalScale: new THREE.Vector2(0.55, 0.55) })
      : f === "waves" || f === "gradient" ? new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04, ...grain, normalScale: new THREE.Vector2(0.04, 0.04) })
      : this.frame;

    const add = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      this.body.add(mesh);
      return mesh;
    };

    add(geo.phone, [mats.phoneBack, mats.titanium]);
    add(geo.plateau, mats.plateau);
    add(geo.shell, [this.back, this.frame]);
    add(geo.lip, this.frame);
    add(geo.collar, this.frame);
    add(geo.glass, mats.glass);
    add(geo.display, mats.display);
    add(geo.pill, mats.pill);

    for (const [lx, ly] of [[-0.08, 0.08], [-0.08, -0.08], [0.086, 0]] as const) {
      add(geo.lensRing, mats.lensRing, PX + lx, PY + ly, PLATEAU_TOP);
      add(geo.housing, mats.housing, PX + lx, PY + ly, PLATEAU_TOP);
      add(geo.lensGlass, mats.lensGlass, PX + lx, PY + ly, PLATEAU_TOP);
    }
    add(geo.flash, mats.flash, PX + 0.098, PY + 0.118, PLATEAU_TOP + 0.002);
    add(geo.flashRing, mats.titanium, PX + 0.098, PY + 0.118, PLATEAU_TOP + 0.002);
    add(geo.dot, mats.lidar, PX + 0.098, PY - 0.118, PLATEAU_TOP + 0.0015).scale.set(0.021, 0.021, 1);
    add(geo.dot, mats.lidar, PX + 0.012, PY + 0.002, PLATEAU_TOP + 0.0015).scale.set(0.006, 0.006, 1); // microphone

    // Button covers: action and volume on one side, power on the other.
    const btn = (side: 1 | -1, y: number, len: number) => { add(geo.button, this.frame, side * (CW / 2 + 0.0015), y, 0).scale.y = len; };
    btn(1, 0.43, 0.065);
    btn(1, 0.29, 0.12);
    btn(1, 0.14, 0.12);
    btn(-1, 0.25, 0.17);

    // Port and speaker cut-outs along the bottom edge.
    add(geo.port, mats.port, 0, -CH / 2 + 0.0098, 0);
    for (let i = 0; i < 6; i++) for (const s of [1, -1]) add(geo.hole, mats.port, s * (0.1 + i * 0.019), -CH / 2 + 0.0098, 0);

    if (f === "clear") {
      add(geo.decal, mats.magsafe, 0, -0.06, DC / 2 + 0.0008).scale.set(0.42, 0.63, 1);
    } else if (f !== "waves" && f !== "gradient") {
      this.logo = new THREE.MeshPhysicalMaterial({ alphaMap: tex.logo, transparent: true, roughness: 0.3, clearcoat: 1, depthWrite: false, opacity: 0.45 });
      add(geo.decal, this.logo, 0, -0.56, DC / 2 + 0.0008).scale.set(0.2, 0.025, 1);
    }

    this.shadow = new THREE.Mesh(geo.shadow, mats.shadow);
    this.shadow.position.y = -CH / 2 - 0.32;
    this.group.add(this.body, this.shadow);
    this.setColor(spec.color, true);
  }

  setColor(hex: string, now = false) {
    const c = new THREE.Color(hex);
    this.target.copy(this.finish === "clear" ? c.lerp(WHITE, 0.6) : c);
    if (this.finish === "waves" || this.finish === "gradient") {
      this.tex?.dispose();
      this.tex = patternTexture(this.finish, hex);
      this.back.map = this.tex;
      this.back.needsUpdate = true;
    }
    if (this.logo) {
      const hsl = { h: 0, s: 0, l: 0 };
      new THREE.Color(hex).getHSL(hsl);
      this.logo.color.set(hsl.l > 0.55 ? "#000000" : "#ffffff");
      this.logo.opacity = hsl.l > 0.55 ? 0.3 : 0.4;
    }
    if (now) this.tick(1);
  }

  /** Ease the colours toward the target. */
  tick(k: number) {
    this.frame.color.lerp(this.target, k);
    if (this.finish === "clear") this.frame.attenuationColor.copy(this.frame.color);
    if (this.finish === "metal") {
      this.back.color.copy(this.frame.color).lerp(LEATHER, 0.95); // colours mix in linear light, so only a hint of the frame
      this.back.sheenColor.copy(this.back.color).multiplyScalar(1.6);
    }
  }

  dispose() {
    this.tex?.dispose();
    new Set([this.frame, this.back, this.logo]).forEach((m) => m?.dispose());
  }
}

const sameFinishes = (a: CaseModel[], b: CaseSpec[]) => a.length === b.length && a.every((c, i) => c.finish === b[i].finish);

export function mountScene(host: HTMLElement, opts: { mode: SceneMode; items: CaseSpec[]; onReady?: () => void }): SceneHandle {
  const { mode } = opts;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); // throws without WebGL
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.75 : 2));
  renderer.toneMapping = THREE.NeutralToneMapping; // keeps product colours true
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline:none";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const env = studioEnvironment(renderer);
  scene.environment = env;
  scene.environmentIntensity = 1;
  const key = new THREE.DirectionalLight("#ffffff", 0.9);
  key.position.set(2.5, 3, 4);
  const rimLight = new THREE.DirectionalLight("#dfe8ff", 0.6);
  rimLight.position.set(-3, 1.5, -2);
  scene.add(key, rimLight);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  const assets = makeAssets();
  const stage = new THREE.Group();
  scene.add(stage);

  let cases: CaseModel[] = [];
  function build(items: CaseSpec[]) {
    cases.forEach((c) => { stage.remove(c.group); c.dispose(); });
    cases = items.map((s) => new CaseModel(s, assets));
    cases.forEach((c) => stage.add(c.group));
    layout();
  }

  // ---- layout and camera fit ----
  let aspect = 1;
  const heroSlots = () => {
    const narrow = aspect < 1;
    const gap = narrow ? 0.6 : 1.08;
    return [
      { x: -gap, z: -0.35, ry: 0.6, rz: 0.06 },
      { x: 0, z: 0.25, ry: -0.35, rz: 0 },
      { x: gap, z: -0.35, ry: -0.85, rz: -0.06 },
    ];
  };
  function layout() {
    if (mode === "hero") {
      const slots = heroSlots();
      cases.forEach((c, i) => { const s = slots[i % 3]; c.group.position.set(s.x, 0, s.z); c.body.rotation.set(0, s.ry, s.rz); });
    } else {
      cases.forEach((c) => c.body.rotation.set(0.08, -0.55, 0));
    }
  }
  function resize() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect;
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const needH = mode === "hero" ? 2.45 : 2.2;
    const needW = mode === "hero" ? (aspect < 1 ? 2.2 : 3.35) : 1.45;
    const dist = Math.max(needH / 2 / half, needW / 2 / (half * aspect));
    camera.position.set(0, 0.12, dist + 0.4);
    camera.lookAt(0, -0.12, 0);
    camera.updateProjectionMatrix();
    layout();
  }

  // ---- interaction: drag to spin, with a little inertia ----
  let yaw = 0, vel = 0, dragging = false, lastX = 0, lastMove = 0, idleSince = 0;
  const pointer = { x: 0, y: 0 }, tilt = { x: 0, y: 0 };
  const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; vel = 0; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = "grabbing"; };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    yaw += dx * 0.012;
    vel = dx * 0.012;
    lastMove = performance.now();
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    idleSince = performance.now();
    if (performance.now() - lastMove > 80) vel = 0;
    canvas.style.cursor = "grab";
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  const onLeave = () => { pointer.x = 0; pointer.y = 0; };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);

  // ---- only draw while on screen ----
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { rootMargin: "100px" });
  io.observe(host);
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  const timer = new THREE.Timer();
  let raf = 0, readyFired = false, t = 0;
  function frame() {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    if (!reduced) t += dt;

    if (!dragging) {
      yaw += vel;
      vel *= 0.94;
      if (Math.abs(vel) < 0.0004) vel = 0;
      // Turn slowly on its own once nobody is touching it.
      if (!reduced && mode === "single" && vel === 0 && performance.now() - idleSince > 2500) yaw += dt * 0.35;
    }
    tilt.x += (pointer.y * 0.12 - tilt.x) * 0.06;
    tilt.y += (pointer.x * 0.18 - tilt.y) * 0.06;

    if (mode === "hero") {
      // Scrolling the hero away fans the cases out and turns the middle one round.
      const r = host.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      stage.rotation.set(tilt.x, yaw + tilt.y + p * 0.5, 0);
      const slots = heroSlots();
      cases.forEach((c, i) => {
        const s = slots[i % 3];
        const bob = Math.sin(t * 1.1 + i * 1.7) * 0.045;
        c.group.position.set(s.x * (1 + p * 0.35), bob - p * 0.15, s.z);
        c.body.rotation.y = s.ry + (i === 1 ? p * Math.PI : p * 0.4 * Math.sign(s.x)) + Math.sin(t * 0.6 + i) * 0.05;
        c.shadow.position.y = -CH / 2 - 0.32 - bob;
        c.shadow.scale.setScalar(1 - bob * 1.5);
      });
    } else {
      cases.forEach((c) => {
        const bob = Math.sin(t * 1.2) * 0.03;
        c.body.position.y = bob;
        c.body.rotation.set(0.08 + tilt.x, -0.55 + yaw + tilt.y, 0);
        c.shadow.scale.setScalar(1 - bob * 2);
      });
    }
    cases.forEach((c) => c.tick(0.12));
    renderer.render(scene, camera);
    if (!readyFired) { readyFired = true; opts.onReady?.(); }
  }
  function loop() {
    cancelAnimationFrame(raf);
    const step = () => {
      if (!visible || document.hidden) return;
      frame();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  const onVis = () => { if (!document.hidden) { timer.update(); loop(); } };
  document.addEventListener("visibilitychange", onVis);

  build(opts.items);
  resize();
  loop();

  return {
    update(items) {
      if (sameFinishes(cases, items)) items.forEach((s, i) => cases[i].setColor(s.color));
      else build(items);
    },
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      cases.forEach((c) => c.dispose());
      assets.dispose();
      env.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
