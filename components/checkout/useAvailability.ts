"use client";

import { useEffect, useState } from "react";
import type { FulfillmentType } from "@/types/restaurant";

export interface AvailabilityResponse {
  now: string;
  status: { state: string; headline: string; detail: string | null; acceptingAsap: boolean; nextOpen: string | null };
  enabled: boolean;
  leadMinutes: number;
  slots: string[];
}

export function useAvailability(fulfillment: FulfillmentType) {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/availability?fulfillment=${fulfillment}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: AvailabilityResponse) => {
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") setError("We couldn't load pickup and delivery times. Please refresh.");
      });
    return () => ctrl.abort();
  }, [fulfillment, tick]);

  // Refresh every 2 minutes so slots don't go stale while the customer types.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 120_000);
    return () => clearInterval(t);
  }, []);

  return { data, error, refresh: () => setTick((n) => n + 1) };
}
