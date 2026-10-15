"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x min-h-[70svh] pt-[calc(var(--header-h)+4rem)]">
      <h1 className="display text-7xl">Something burned.</h1>
      <p className="mt-4 text-lg text-ink-soft">An unexpected error occurred. Your cart is safe.</p>
      <button type="button" onClick={reset} className="btn btn-dark mt-8">
        Try again
      </button>
    </div>
  );
}
