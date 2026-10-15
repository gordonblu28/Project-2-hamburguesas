import { restaurant } from "@/config/restaurant";

export function Logo({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden="true">
        <circle cx="20" cy="20" r="20" fill="currentColor" />
        <path d="M9 18c0-6 5-10 11-10s11 4 11 10Z" fill="var(--color-mustard)" />
        <rect x="8" y="20" width="24" height="4" rx="2" fill="var(--color-tomato)" />
        <rect x="9" y="26" width="22" height="5" rx="2.5" fill="var(--color-mustard)" />
      </svg>
      {!compact && (
        <span aria-hidden="true" className="display text-[1.35rem] leading-[0.8]">
          {restaurant.logoText.line1}
          <br />
          {restaurant.logoText.line2}
        </span>
      )}
      <span className="sr-only">{restaurant.name}</span>
    </span>
  );
}
