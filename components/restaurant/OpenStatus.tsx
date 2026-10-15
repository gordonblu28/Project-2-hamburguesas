"use client";

import { getStatus } from "@/lib/availability/hours";
import { useNow } from "./useNow";

/** Live open/closed status computed from configured hours in the restaurant's time zone. */
export function OpenStatus({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const now = useNow();
  if (!now) {
    return <span className={`inline-block h-5 w-48 animate-pulse rounded-full bg-current/10 ${className}`} aria-hidden="true" />;
  }
  const s = getStatus(now);
  const dot = s.state === "open" ? (s.acceptingAsap ? "bg-emerald-500" : "bg-mustard") : "bg-tomato";
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-semibold ${className}`} role="status">
      <span className="relative flex size-2.5">
        {s.state === "open" && <span className={`absolute inset-0 animate-ping rounded-full ${dot} opacity-60`} />}
        <span className={`relative size-2.5 rounded-full ${dot}`} />
      </span>
      <span className={tone === "dark" ? "text-ivory" : ""}>{s.headline}</span>
    </span>
  );
}
