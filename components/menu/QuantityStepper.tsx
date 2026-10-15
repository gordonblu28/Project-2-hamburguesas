"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  label,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max: number;
  label: string;
  size?: "sm" | "md";
}) {
  const btn = size === "sm" ? "size-9" : "size-11";
  return (
    <div className="inline-flex items-center rounded-full bg-paper ring-1 ring-ink/10" role="group" aria-label={label}>
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full transition hover:bg-stone disabled:opacity-30`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={min === 0 && value === 1 ? "Remove item" : "Decrease quantity"}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output className="min-w-8 text-center font-bold tabular-nums" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full transition hover:bg-stone disabled:opacity-30`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
