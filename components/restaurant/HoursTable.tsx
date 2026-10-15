"use client";

import { restaurant } from "@/config/restaurant";
import { DISPLAY_ORDER, WEEKDAY_LABELS, formatWindow, todayWeekday, upcomingHolidays } from "@/lib/availability/hours";
import { useNow } from "./useNow";

export function HoursTable({ dark = false }: { dark?: boolean }) {
  const now = useNow(60_000);
  const today = now ? todayWeekday(now) : null;
  const holidays = now ? upcomingHolidays(now) : [];
  const muted = dark ? "text-ivory/60" : "text-ink-soft";
  return (
    <div>
      <table className="w-full text-left">
        <caption className="sr-only">Opening hours ({restaurant.timeZone.replace("_", " ")} time)</caption>
        <tbody>
          {DISPLAY_ORDER.map((d) => {
            const windows = restaurant.hours[d];
            const isToday = d === today;
            return (
              <tr
                key={d}
                className={`border-b ${dark ? "border-ivory/15" : "border-ink/10"} ${isToday ? "font-bold" : ""}`}
                aria-current={isToday ? "date" : undefined}
              >
                <th scope="row" className="py-3 pr-4 font-semibold">
                  {WEEKDAY_LABELS[d]}
                  {isToday && <span className="ml-2 rounded-full bg-mustard px-2 py-0.5 text-[0.65rem] uppercase tracking-widest text-ink">Today</span>}
                </th>
                <td className="py-3 text-right tabular-nums">
                  {windows.length === 0 ? <span className={muted}>Closed</span> : windows.map((w) => formatWindow(w)).join(", ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {holidays.length > 0 && (
        <div className={`mt-6 rounded-xl p-4 text-sm ${dark ? "bg-ivory/10" : "bg-stone"}`}>
          <p className="eyebrow mb-2">Holiday hours</p>
          <ul className="space-y-1">
            {holidays.map((h) => (
              <li key={h.date} className="flex justify-between gap-4">
                <span>
                  {h.label} ·{" "}
                  {new Intl.DateTimeFormat(restaurant.locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${h.date}T12:00:00Z`))}
                </span>
                <span className="tabular-nums">{h.windows.length ? h.windows.map((w) => formatWindow(w)).join(", ") : "Closed"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {restaurant.temporaryClosure.active && (
        <p role="alert" className="mt-4 rounded-xl bg-tomato p-4 text-sm font-semibold text-paper">
          {restaurant.temporaryClosure.message}
        </p>
      )}
      <p className={`mt-3 text-xs ${muted}`}>Times shown in the restaurant&rsquo;s local time zone.</p>
    </div>
  );
}
