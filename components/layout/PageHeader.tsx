import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children, tone = "ivory" }: { eyebrow: string; title: ReactNode; children?: ReactNode; tone?: "ivory" | "ink" }) {
  return (
    <header className={`grain pb-12 pt-[calc(var(--header-h)+3.5rem)] md:pb-16 md:pt-[calc(var(--header-h)+5rem)] ${tone === "ink" ? "bg-ink text-ivory" : ""}`}>
      <div className="container-x">
        <p className={`eyebrow ${tone === "ink" ? "text-mustard" : "text-tomato-ink"}`}>{eyebrow}</p>
        <h1 className="display mt-4 text-[clamp(3.75rem,11vw,10rem)]">{title}</h1>
        {children && <div className="mt-6 max-w-2xl text-lg">{children}</div>}
      </div>
    </header>
  );
}
