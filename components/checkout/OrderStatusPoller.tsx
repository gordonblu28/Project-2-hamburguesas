"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** While a payment is pending, refresh the server-rendered page until the webhook updates the order. */
export function OrderStatusPoller({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    let n = 0;
    const t = setInterval(() => {
      if (++n > 20) return clearInterval(t);
      router.refresh();
    }, 3000);
    return () => clearInterval(t);
  }, [active, router]);
  return null;
}
