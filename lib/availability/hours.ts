import { TZDate } from "@date-fns/tz";
import { restaurant } from "@/config/restaurant";
import type { FulfillmentType, RestaurantConfig, ServiceWindow, Weekday } from "@/types/restaurant";

/**
 * Time-zone-aware opening hours. All schedule math happens in the restaurant's
 * configured IANA time zone via @date-fns/tz, so DST transitions are handled by
 * the tz database rather than fixed offsets.
 */

export const WEEKDAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
export const DISPLAY_ORDER: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export interface Interval {
  start: Date;
  end: Date;
  /** Local date (YYYY-MM-DD) the window belongs to. */
  dateKey: string;
  holiday?: string;
}

const MIN = 60_000;

function parseClock(t: string): [number, number] {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) throw new Error(`Invalid clock time "${t}"`);
  return [Number(m[1]), Number(m[2])];
}

const pad = (n: number) => String(n).padStart(2, "0");

export interface LocalDay {
  y: number;
  m: number; // 0-based
  d: number;
}

export function localDay(instant: Date, tz: string): LocalDay {
  const z = new TZDate(instant.getTime(), tz);
  return { y: z.getFullYear(), m: z.getMonth(), d: z.getDate() };
}

export function dayKey({ y, m, d }: LocalDay): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function addDays(day: LocalDay, n: number): LocalDay {
  const dt = new Date(Date.UTC(day.y, day.m, day.d + n));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
}

function weekdayOf(day: LocalDay): Weekday {
  return WEEKDAYS[new Date(Date.UTC(day.y, day.m, day.d)).getUTCDay()]!;
}

function at(day: LocalDay, clock: string, tz: string): Date {
  const [h, min] = parseClock(clock);
  // TZDate normalises overflow (e.g. 24:00 -> next day 00:00) in the target zone.
  return new Date(new TZDate(day.y, day.m, day.d, h, min, tz).getTime());
}

export function windowsFor(day: LocalDay, config: RestaurantConfig = restaurant): { windows: ServiceWindow[]; holiday?: string } {
  const key = dayKey(day);
  const holiday = config.holidays.find((h) => h.date === key);
  if (holiday) return { windows: holiday.windows, holiday: holiday.label };
  return { windows: config.hours[weekdayOf(day)] };
}

function intervalsForDay(day: LocalDay, config: RestaurantConfig): Interval[] {
  const { windows, holiday } = windowsFor(day, config);
  return windows.map((w) => {
    const start = at(day, w.open, config.timeZone);
    const [oh, om] = parseClock(w.open);
    const [ch, cm] = parseClock(w.close);
    const overnight = ch * 60 + cm <= oh * 60 + om;
    const end = at(overnight ? addDays(day, 1) : day, w.close, config.timeZone);
    return { start, end, dateKey: dayKey(day), holiday };
  });
}

/** All service intervals touching the range [yesterday, today + days]. Sorted by start. */
export function intervalsAround(now: Date, days: number, config: RestaurantConfig = restaurant): Interval[] {
  const today = localDay(now, config.timeZone);
  const out: Interval[] = [];
  for (let i = -1; i <= days; i++) out.push(...intervalsForDay(addDays(today, i), config));
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type OpenState = "open" | "closed" | "temporarily_closed";

export interface RestaurantStatus {
  state: OpenState;
  /** Human-readable status, e.g. "Open now · Closes 10:00 PM". */
  headline: string;
  detail?: string;
  current?: Interval;
  next?: Interval;
  /** Whether an ASAP order can be accepted right now (open and before the cutoff). */
  acceptingAsap: boolean;
}

export function formatTime(d: Date, config: RestaurantConfig = restaurant) {
  return new Intl.DateTimeFormat(config.locale, { hour: "numeric", minute: "2-digit", timeZone: config.timeZone }).format(d);
}

/** "Today at 11:30 AM" / "today at 11:30 AM" (inline) / "Friday, Oct 16 at 11:30 AM". */
export function formatDayTime(d: Date, now: Date, config: RestaurantConfig = restaurant, inline = false) {
  const rel = relativeDay(d, now, config);
  const day = inline && (rel === "Today" || rel === "Tomorrow") ? rel.toLowerCase() : rel;
  return `${day} at ${formatTime(d, config)}`;
}

export function relativeDay(d: Date, now: Date, config: RestaurantConfig = restaurant) {
  const a = localDay(d, config.timeZone);
  const today = localDay(now, config.timeZone);
  if (dayKey(a) === dayKey(today)) return "Today";
  if (dayKey(a) === dayKey(addDays(today, 1))) return "Tomorrow";
  return new Intl.DateTimeFormat(config.locale, { weekday: "long", month: "short", day: "numeric", timeZone: config.timeZone }).format(d);
}

export function getStatus(now: Date, config: RestaurantConfig = restaurant): RestaurantStatus {
  if (config.temporaryClosure.active) {
    return {
      state: "temporarily_closed",
      headline: "Temporarily closed",
      detail: config.temporaryClosure.message,
      acceptingAsap: false,
    };
  }
  const t = now.getTime();
  const intervals = intervalsAround(now, 7, config);
  const current = intervals.find((i) => i.start.getTime() <= t && t < i.end.getTime());
  const next = intervals.find((i) => i.start.getTime() > t);
  if (current) {
    const cutoff = current.end.getTime() - config.ordering.cutoffMinutesBeforeClose * MIN;
    const acceptingAsap = t < cutoff;
    return {
      state: "open",
      headline: `Open now · Closes ${formatTime(current.end, config)}`,
      detail: acceptingAsap ? undefined : "Kitchen has stopped taking orders for tonight.",
      current,
      next,
      acceptingAsap,
    };
  }
  if (!next) return { state: "closed", headline: "Closed now", acceptingAsap: false };
  const rel = relativeDay(next.start, now, config);
  const headline =
    rel === "Today"
      ? `Closed now · Opens at ${formatTime(next.start, config)}`
      : rel === "Tomorrow"
        ? `Closed now · Opens tomorrow at ${formatTime(next.start, config)}`
        : `Closed now · Opens ${rel} at ${formatTime(next.start, config)}`;
  return { state: "closed", headline, next, acceptingAsap: false };
}

export function leadMinutes(fulfillment: FulfillmentType, config: RestaurantConfig = restaurant) {
  return config.ordering.preparationMinutes + (fulfillment === "delivery" ? config.ordering.deliveryMinutes : 0);
}

/**
 * Bookable fulfillment times (ready-for-pickup or delivery-arrival estimates).
 * Slots land on the configured interval, start after preparation lead time and
 * stop at the ordering cutoff before close.
 */
export function getSlots(now: Date, fulfillment: FulfillmentType, config: RestaurantConfig = restaurant): Date[] {
  const o = config.ordering;
  if (config.temporaryClosure.active || !o.scheduledOrdersEnabled) return [];
  const status = getStatus(now, config);
  if (status.state !== "open" && !o.scheduleWhileClosed) return [];
  const step = o.slotIntervalMinutes * MIN;
  const lead = leadMinutes(fulfillment, config) * MIN;
  const today = localDay(now, config.timeZone);
  const lastDay = dayKey(addDays(today, o.scheduleDaysAhead));
  const slots: Date[] = [];
  for (const iv of intervalsAround(now, o.scheduleDaysAhead, config)) {
    if (iv.dateKey > lastDay) continue;
    const earliest = Math.max(iv.start.getTime() + lead, now.getTime() + lead);
    const latest = iv.end.getTime() - o.cutoffMinutesBeforeClose * MIN;
    for (let s = Math.ceil(earliest / step) * step; s <= latest; s += step) slots.push(new Date(s));
  }
  return slots;
}

export type TimeCheck = { ok: true; readyAt: Date } | { ok: false; reason: string };

/**
 * Server-side validation of a requested time. `graceMinutes` tolerates the delay
 * between the customer loading the slot list and submitting.
 */
export function validateRequestedTime(
  requested: "asap" | string,
  now: Date,
  fulfillment: FulfillmentType,
  config: RestaurantConfig = restaurant,
  graceMinutes = 10,
): TimeCheck {
  if (requested === "asap") {
    const status = getStatus(now, config);
    if (!status.acceptingAsap) {
      return { ok: false, reason: `We're not accepting ASAP orders right now. ${status.headline}.` };
    }
    return { ok: true, readyAt: new Date(now.getTime() + leadMinutes(fulfillment, config) * MIN) };
  }
  const when = new Date(requested);
  if (Number.isNaN(when.getTime())) return { ok: false, reason: "Choose a valid time." };
  if (when.getTime() <= now.getTime()) return { ok: false, reason: "That time has already passed." };
  const slots = getSlots(new Date(now.getTime() - graceMinutes * MIN), fulfillment, config);
  if (!slots.some((s) => s.getTime() === when.getTime())) {
    return { ok: false, reason: "That time is no longer available. Please pick another time." };
  }
  return { ok: true, readyAt: when };
}

export function formatWindow(w: ServiceWindow, config: RestaurantConfig = restaurant) {
  const fmt = (clock: string) => {
    const [h, m] = parseClock(clock);
    const d = new Date(Date.UTC(2000, 0, 1, h % 24, m));
    return new Intl.DateTimeFormat(config.locale, { hour: "numeric", minute: m ? "2-digit" : undefined, timeZone: "UTC" }).format(d);
  };
  return `${fmt(w.open)} – ${fmt(w.close)}`;
}

export function upcomingHolidays(now: Date, days = 45, config: RestaurantConfig = restaurant) {
  const today = dayKey(localDay(now, config.timeZone));
  const limit = dayKey(addDays(localDay(now, config.timeZone), days));
  return config.holidays.filter((h) => h.date >= today && h.date <= limit);
}

export function todayWeekday(now: Date, config: RestaurantConfig = restaurant): Weekday {
  return weekdayOf(localDay(now, config.timeZone));
}
