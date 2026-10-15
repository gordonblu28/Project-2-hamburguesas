import type { ReactNode } from "react";
import { band, cheese, domeScatter, lettuce, rng, wave } from "./geometry";

export type LayerKind =
  | "bunTop"
  | "bunBottom"
  | "patty"
  | "veggiePatty"
  | "cheese"
  | "cheddar"
  | "lettuce"
  | "tomato"
  | "onion"
  | "pickles"
  | "bacon"
  | "sauce"
  | "bbq"
  | "chicken"
  | "slaw"
  | "jalapeno"
  | "crispyOnion";

interface LayerDef {
  /** Visual height of the layer's own drawing. */
  h: number;
  /** Vertical space the layer contributes to the stack (overlap = h - stack). */
  stack: number;
  draw: (seed: number) => ReactNode;
}

const W = 400;

const LAYERS: Record<LayerKind, LayerDef> = {
  bunTop: {
    h: 142,
    stack: 128,
    draw: (seed) => {
      const seeds = domeScatter(200, 128, 180, 120, 17, seed);
      return (
        <>
          <path d="M18 128C14 58 96 8 200 8s186 50 182 120c-1 10-8 14-18 14H36c-10 0-17-4-18-14Z" fill="url(#sh-bun)" />
          <path d="M18 128C14 58 96 8 200 8s186 50 182 120c-1 10-8 14-18 14H36c-10 0-17-4-18-14Z" fill="url(#sh-bun-hi)" />
          <path d="M26 132c50 8 298 8 348 0" stroke="#8C4A15" strokeOpacity="0.35" strokeWidth="3" fill="none" strokeLinecap="round" />
          {seeds.map((s, i) => (
            <g key={i} transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.rot.toFixed(0)})`}>
              <ellipse cx="0.8" cy="1.6" rx="7.5" ry="3.6" fill="#7A3E10" opacity="0.25" />
              <ellipse rx="7" ry="3.3" fill="#FFF1CF" />
              <ellipse cx="-1.6" cy="-0.8" rx="3" ry="1.2" fill="#FFFFFF" opacity="0.7" />
            </g>
          ))}
        </>
      );
    },
  },
  bunBottom: {
    h: 62,
    stack: 62,
    draw: () => (
      <>
        <path d="M24 0h352c10 0 14 5 12 15l-8 28c-4 14-12 19-26 19H46c-14 0-22-5-26-19l-8-28C10 5 14 0 24 0Z" fill="url(#sh-bun-bottom)" />
        <path d="M22 3h356c4 0 6 2 5 6l-1 5H18l-1-5c-1-4 1-6 5-6Z" fill="#F6D69C" />
        <path d="M30 16c70 6 270 6 340 0" stroke="#FFF2D2" strokeOpacity="0.4" strokeWidth="2" fill="none" />
      </>
    ),
  },
  patty: {
    h: 52,
    stack: 42,
    draw: (seed) => {
      const rand = rng(seed + 7);
      return (
        <>
          <path d={band({ x0: 10, x1: 390, y0: 2, y1: 50, seed, topNoise: 3, bottomNoise: 3.5, step: 10 })} fill="url(#sh-patty)" />
          {Array.from({ length: 34 }, (_, i) => (
            <ellipse
              key={i}
              cx={28 + rand() * 344}
              cy={10 + rand() * 32}
              rx={2 + rand() * 6}
              ry={1 + rand() * 2}
              fill={i % 3 === 0 ? "#A0592A" : "#1F0D04"}
              opacity={0.55}
            />
          ))}
          <path d="M40 12c90-6 230-6 320 0" stroke="#B36A35" strokeOpacity="0.45" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    },
  },
  veggiePatty: {
    h: 50,
    stack: 42,
    draw: (seed) => {
      const rand = rng(seed + 3);
      return (
        <>
          <path d={band({ x0: 12, x1: 388, y0: 2, y1: 48, seed, topNoise: 2, bottomNoise: 2 })} fill="url(#sh-veggie)" />
          {Array.from({ length: 26 }, (_, i) => (
            <circle key={i} cx={30 + rand() * 340} cy={10 + rand() * 30} r={1.5 + rand() * 3} fill={i % 2 ? "#C9A26A" : "#5E8F3A"} opacity="0.7" />
          ))}
        </>
      );
    },
  },
  cheese: {
    h: 16,
    stack: 7,
    draw: (seed) => <path d={cheese(8, 392, 0, 12, seed)} fill="url(#sh-cheese)" />,
  },
  cheddar: {
    h: 16,
    stack: 7,
    draw: (seed) => <path d={cheese(8, 392, 0, 12, seed, 4)} fill="url(#sh-cheddar)" />,
  },
  lettuce: {
    h: 34,
    stack: 19,
    draw: (seed) => (
      <>
        <path d={lettuce(4, 396, 0, 26, seed)} fill="url(#sh-lettuce)" />
        <path d="M30 10c60 6 120-4 170 2s110 4 170-2" stroke="#D3F09A" strokeOpacity="0.6" strokeWidth="2" fill="none" />
      </>
    ),
  },
  tomato: {
    h: 24,
    stack: 19,
    draw: () => (
      <>
        <rect x="22" y="2" width="180" height="20" rx="10" fill="url(#sh-tomato)" />
        <rect x="196" y="1" width="184" height="21" rx="10" fill="url(#sh-tomato)" />
        <rect x="32" y="4" width="160" height="6" rx="3" fill="#F7907C" opacity="0.8" />
        <rect x="206" y="3" width="164" height="6" rx="3" fill="#F7907C" opacity="0.8" />
        {[60, 100, 140, 240, 290, 335].map((x) => (
          <ellipse key={x} cx={x} cy="14" rx="4" ry="2" fill="#FBD38D" opacity="0.8" />
        ))}
      </>
    ),
  },
  onion: {
    h: 12,
    stack: 7,
    draw: () => (
      <>
        <rect x="30" y="2" width="340" height="8" rx="4" fill="#F4E6F1" />
        <path d="M34 6h332" stroke="#B57BA6" strokeWidth="2" strokeDasharray="34 10" />
      </>
    ),
  },
  pickles: {
    h: 14,
    stack: 5,
    draw: () => (
      <>
        {[
          [26, 6, -8],
          [374, 7, 10],
          [120, 4, 2],
          [270, 5, -3],
        ].map(([x, y, r]) => (
          <g key={x} transform={`translate(${x} ${y}) rotate(${r})`}>
            <ellipse rx="34" ry="6" fill="#7E9A2F" />
            <ellipse rx="26" ry="3.5" fill="#B7CB5A" />
            <path d="M-20 0h40" stroke="#6C8526" strokeWidth="1.2" strokeDasharray="3 4" />
          </g>
        ))}
      </>
    ),
  },
  bacon: {
    h: 24,
    stack: 12,
    draw: (seed) => (
      <>
        <path d={wave(-6, 210, 4, 12, 4, 42, seed)} fill="url(#sh-bacon)" />
        <path d={wave(190, 406, 6, 12, 4, 46, seed + 1)} fill="url(#sh-bacon)" />
        <path d={wave(0, 205, 8, 2.5, 4, 42, seed + 2)} fill="#F4B9A1" opacity="0.85" />
        <path d={wave(195, 400, 10, 2.5, 4, 46, seed + 3)} fill="#F4B9A1" opacity="0.85" />
      </>
    ),
  },
  sauce: {
    h: 12,
    stack: 3,
    draw: (seed) => <path d={wave(30, 370, 2, 6, 2.5, 30, seed)} fill="#F28C67" />,
  },
  bbq: {
    h: 16,
    stack: 4,
    draw: (seed) => <path d={cheese(20, 380, 0, 6, seed, 4)} fill="url(#sh-bbq)" />,
  },
  chicken: {
    h: 70,
    stack: 58,
    draw: (seed) => {
      const rand = rng(seed + 11);
      return (
        <>
          <path d={band({ x0: -4, x1: 404, y0: 2, y1: 64, seed, topNoise: 6, bottomNoise: 5, step: 9 })} fill="url(#sh-chicken)" />
          {Array.from({ length: 46 }, (_, i) => (
            <circle key={i} cx={10 + rand() * 380} cy={10 + rand() * 46} r={2 + rand() * 4} fill={i % 2 ? "#F7CC74" : "#A9601F"} opacity="0.6" />
          ))}
        </>
      );
    },
  },
  slaw: {
    h: 22,
    stack: 12,
    draw: (seed) => {
      const rand = rng(seed);
      return (
        <>
          {Array.from({ length: 40 }, (_, i) => {
            const x = 20 + rand() * 360;
            const y = 4 + rand() * 12;
            return (
              <path
                key={i}
                d={`M${x} ${y}q10 ${-4 + rand() * 8} 22 ${-2 + rand() * 4}`}
                stroke={i % 4 === 0 ? "#A35A9B" : i % 3 === 0 ? "#F2B544" : "#E9F2C8"}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </>
      );
    },
  },
  jalapeno: {
    h: 12,
    stack: 4,
    draw: () => (
      <>
        {[60, 150, 250, 340].map((x) => (
          <g key={x} transform={`translate(${x} 6)`}>
            <ellipse rx="16" ry="6" fill="#3E7E2A" />
            <ellipse rx="9" ry="3" fill="#B9D88A" />
          </g>
        ))}
      </>
    ),
  },
  crispyOnion: {
    h: 18,
    stack: 8,
    draw: (seed) => {
      const rand = rng(seed);
      return (
        <>
          {Array.from({ length: 26 }, (_, i) => {
            const x = 18 + rand() * 360;
            return (
              <path key={i} d={`M${x} ${8 + rand() * 6}c6-8 14-8 20 0`} stroke="#C27A2C" strokeWidth="4" strokeLinecap="round" fill="none" />
            );
          })}
        </>
      );
    },
  },
};

export const RECIPES = {
  house: ["bunTop", "sauce", "lettuce", "tomato", "onion", "pickles", "cheese", "patty", "cheese", "patty", "bunBottom"],
  double: ["bunTop", "crispyOnion", "bacon", "cheddar", "patty", "cheddar", "patty", "sauce", "bunBottom"],
  classic: ["bunTop", "pickles", "onion", "cheese", "patty", "bunBottom"],
  bbq: ["bunTop", "crispyOnion", "bbq", "bacon", "cheddar", "patty", "lettuce", "bunBottom"],
  smash: ["bunTop", "sauce", "cheese", "patty", "bunBottom"],
  veggie: ["bunTop", "lettuce", "tomato", "cheese", "veggiePatty", "sauce", "bunBottom"],
  chickenSpicy: ["bunTop", "slaw", "pickles", "bbq", "chicken", "bunBottom"],
  chickenClassic: ["bunTop", "lettuce", "pickles", "chicken", "sauce", "bunBottom"],
} satisfies Record<string, LayerKind[]>;

export type RecipeKey = keyof typeof RECIPES;

export function layoutRecipe(recipe: readonly LayerKind[]) {
  let cursor = 0;
  const placed = recipe.map((kind, i) => {
    const def = LAYERS[kind];
    const y = cursor;
    cursor += def.stack;
    return { kind, def, y, index: i };
  });
  const last = placed[placed.length - 1];
  const height = last ? last.y + last.def.h : 0;
  return { placed, height };
}

interface BurgerProps {
  recipe: RecipeKey;
  className?: string;
  /** Static vertical spread for an "exploded" still. GSAP animates `[data-layer]` groups instead. */
  spread?: number;
  shadow?: boolean;
  title?: string;
  seed?: number;
}

export function Burger({ recipe, className, spread = 0, shadow = true, title, seed = 3 }: BurgerProps) {
  const layers = RECIPES[recipe];
  const { placed, height } = layoutRecipe(layers);
  const n = placed.length;
  const pad = 16;
  return (
    <svg
      viewBox={`-20 ${-pad} ${W + 40} ${height + pad * 2 + 24}`}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ overflow: "visible" }}
    >
      {shadow && <ellipse data-burger-shadow cx={W / 2} cy={height + 14} rx={W * 0.54} ry={18} fill="url(#sh-shadow)" />}
      {[...placed].reverse().map(({ kind, def, y, index }) => {
        const offset = spread ? (index - (n - 1) / 2) * spread : 0;
        return (
          <g key={index} transform={`translate(0 ${y})`}>
            <g data-layer={kind} data-index={index} transform={offset ? `translate(0 ${offset})` : undefined}>
              {def.draw(seed + index * 13)}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
