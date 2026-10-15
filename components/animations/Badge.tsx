/** Rotating circular text badge. Pure CSS animation; stops under reduced motion. */
export function Badge({ text, className = "", inner }: { text: string; className?: string; inner?: React.ReactNode }) {
  return (
    <div className={`grid place-items-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full animate-[spin_18s_linear_infinite]">
        <defs>
          <path id="badge-circle" d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1-156 0" />
        </defs>
        <text fontSize="17" fontWeight="700" letterSpacing="4.6" fill="currentColor" style={{ fontFamily: "var(--font-sans)" }}>
          <textPath href="#badge-circle">{text}</textPath>
        </text>
      </svg>
      {inner}
    </div>
  );
}
