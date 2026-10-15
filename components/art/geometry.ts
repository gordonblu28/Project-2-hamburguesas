/** Small deterministic geometry helpers for the illustrated food art. */

export function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Closed, smoothed path through points using quadratic midpoints. */
export function smoothClosed(points: Pt[]): string {
  const n = points.length;
  if (n < 3) return "";
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(points[n - 1]!, points[0]!);
  let d = `M${r1(start[0])} ${r1(start[1])}`;
  for (let i = 0; i < n; i++) {
    const p = points[i]!;
    const m = mid(p, points[(i + 1) % n]!);
    d += `Q${r1(p[0])} ${r1(p[1])} ${r1(m[0])} ${r1(m[1])}`;
  }
  return d + "Z";
}

interface BandOpts {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  seed: number;
  topNoise?: number;
  bottomNoise?: number;
  step?: number;
  /** How much the bottom edge is inset at the ends (rounded underside). */
  capSteps?: number;
}

/** A horizontal band with rounded ends and noisy edges — patties, fried chicken, bacon. */
export function band({ x0, x1, y0, y1, seed, topNoise = 2, bottomNoise = 2, step = 12, capSteps = 6 }: BandOpts): string {
  const rand = rng(seed);
  const pts: Pt[] = [];
  const r = (y1 - y0) / 2;
  const cy = (y0 + y1) / 2;
  for (let x = x0 + r; x <= x1 - r; x += step) pts.push([x + (rand() - 0.5) * 3, y0 + (rand() - 0.5) * 2 * topNoise]);
  for (let i = 0; i <= capSteps; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / capSteps;
    const jitter = 1 + (rand() - 0.5) * 0.12;
    pts.push([x1 - r + Math.cos(a) * r * jitter, cy + Math.sin(a) * r]);
  }
  for (let x = x1 - r; x >= x0 + r; x -= step) pts.push([x + (rand() - 0.5) * 3, y1 + (rand() - 0.5) * 2 * bottomNoise]);
  for (let i = 0; i <= capSteps; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / capSteps;
    const jitter = 1 + (rand() - 0.5) * 0.12;
    pts.push([x0 + r + Math.cos(a) * r * jitter, cy + Math.sin(a) * r]);
  }
  return smoothClosed(pts);
}

/** Melted cheese sheet with drips hanging below y1. */
export function cheese(x0: number, x1: number, y0: number, y1: number, seed: number, drips = 5): string {
  const rand = rng(seed);
  const pts: Pt[] = [];
  pts.push([x0 + 4, y0 + 2]);
  for (let x = x0 + 20; x < x1 - 10; x += 30) pts.push([x, y0 + (rand() - 0.5) * 2]);
  pts.push([x1 - 2, y0 + 3]);
  pts.push([x1 + 4, y1 + 6]); // corner droops over the edge
  pts.push([x1 - 8, y1 + 10]);
  const dripXs = Array.from({ length: drips }, (_, i) => x1 - 30 - ((x1 - x0 - 60) * (i + rand() * 0.6)) / drips);
  let lastX = x1 - 8;
  for (const dx of dripXs) {
    const depth = 10 + rand() * 22;
    const w = 7 + rand() * 6;
    if (lastX - dx > w * 2) pts.push([(lastX + dx) / 2, y1 + (rand() - 0.3) * 3]);
    pts.push([dx + w, y1 + 1]);
    pts.push([dx + w * 0.8, y1 + depth * 0.75]);
    pts.push([dx, y1 + depth]);
    pts.push([dx - w * 0.8, y1 + depth * 0.75]);
    pts.push([dx - w, y1 + 1]);
    lastX = dx - w;
  }
  pts.push([x0 + 8, y1 + 9]);
  pts.push([x0 - 4, y1 + 5]);
  return smoothClosed(pts);
}

/** Ruffled lettuce leaf band. */
export function lettuce(x0: number, x1: number, y0: number, y1: number, seed: number): string {
  const rand = rng(seed);
  const pts: Pt[] = [];
  for (let x = x0 + 6; x <= x1 - 6; x += 16) pts.push([x, y0 + 4 + (rand() - 0.5) * 6]);
  pts.push([x1 + 6, (y0 + y1) / 2]);
  let up = true;
  for (let x = x1 - 4; x >= x0 + 4; x -= 11) {
    pts.push([x, up ? y1 - 4 - rand() * 3 : y1 + 4 + rand() * 6]);
    up = !up;
  }
  pts.push([x0 - 6, (y0 + y1) / 2 + 2]);
  return smoothClosed(pts);
}

/** Wavy strip (bacon / sauce). */
export function wave(x0: number, x1: number, y: number, thickness: number, amp: number, period: number, seed: number): string {
  const rand = rng(seed);
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (let x = x0; x <= x1; x += period / 4) {
    const phase = ((x - x0) / period) * Math.PI * 2;
    const off = Math.sin(phase) * amp + (rand() - 0.5) * 1.5;
    top.push([x, y + off]);
    bottom.push([x, y + off + thickness + (rand() - 0.5) * 2]);
  }
  return smoothClosed([...top, ...bottom.reverse()]);
}

/** Scatter points inside a half-ellipse dome (for sesame seeds). */
export function domeScatter(cx: number, baseY: number, rx: number, ry: number, count: number, seed: number) {
  const rand = rng(seed);
  const out: { x: number; y: number; rot: number }[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const x = cx + (rand() * 2 - 1) * rx * 0.86;
    const y = baseY - rand() * ry * 0.92;
    const nx = (x - cx) / rx;
    const ny = (baseY - y) / ry;
    if (nx * nx + ny * ny > 0.78) continue;
    if (baseY - y < ry * 0.22) continue;
    if (out.some((p) => Math.hypot(p.x - x, p.y - y) < 22)) continue;
    out.push({ x, y, rot: (rand() - 0.5) * 70 + (x - cx) * 0.18 });
  }
  return out;
}
