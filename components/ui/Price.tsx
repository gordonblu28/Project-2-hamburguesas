import { formatMoney } from "@/lib/money";

export function Price({ cents, className }: { cents: number; className?: string }) {
  return <span className={`tabular-nums ${className ?? ""}`}>{formatMoney(cents)}</span>;
}
