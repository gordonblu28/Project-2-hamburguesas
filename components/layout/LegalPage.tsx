import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHeader eyebrow={`Last updated ${updated}`} title={title} />
      <div className="container-x pb-28">
        <p role="note" className="mb-10 max-w-3xl rounded-2xl border-2 border-dashed border-tomato p-4 text-sm font-semibold text-tomato-ink">
          DRAFT — starter text only. This page has not been reviewed by a lawyer and does not claim compliance with any law.
          Have it reviewed and completed before the site goes live.
        </p>
        <div className="max-w-3xl space-y-6 text-lg leading-relaxed [&_h2]:display [&_h2]:pt-6 [&_h2]:text-4xl [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
          {children}
        </div>
      </div>
    </>
  );
}
