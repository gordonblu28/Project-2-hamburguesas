import { describe, expect, it } from "vitest";
import { getSlots, getStatus, intervalsAround, validateRequestedTime } from "@/lib/availability/hours";
import { OPEN_THU_NOON, testConfig } from "./helpers";

const cfg = testConfig();

describe("opening status", () => {
  it("is open during configured hours", () => {
    const s = getStatus(OPEN_THU_NOON, cfg);
    expect(s.state).toBe("open");
    expect(s.headline).toBe("Open now · Closes 10:00 PM");
    expect(s.acceptingAsap).toBe(true);
  });

  it("stops ASAP orders inside the cutoff before close", () => {
    // Thu 21:50 local = 02:50Z Fri
    const s = getStatus(new Date("2026-10-16T02:50:00Z"), cfg);
    expect(s.state).toBe("open");
    expect(s.acceptingAsap).toBe(false);
  });

  it("reports when it opens later today", () => {
    // Sun 15:30 local, between the lunch and dinner windows
    const s = getStatus(new Date("2026-10-18T20:30:00Z"), cfg);
    expect(s.state).toBe("closed");
    expect(s.headline).toBe("Closed now · Opens at 5:00 PM");
  });

  it("reports opening tomorrow", () => {
    // Wed 23:00 local
    const s = getStatus(new Date("2026-10-15T04:00:00Z"), cfg);
    expect(s.headline).toBe("Closed now · Opens tomorrow at 11:00 AM");
  });

  it("handles a closed day (Monday)", () => {
    const s = getStatus(new Date("2026-10-19T17:00:00Z"), cfg);
    expect(s.state).toBe("closed");
    expect(s.headline).toContain("tomorrow at 11:00 AM");
  });

  it("handles overnight hours that run past midnight", () => {
    // Sat 00:30 local belongs to Friday's 11:00–01:00 window
    const s = getStatus(new Date("2026-10-17T05:30:00Z"), cfg);
    expect(s.state).toBe("open");
    expect(s.headline).toBe("Open now · Closes 1:00 AM");
    // Sat 01:30 local is closed
    expect(getStatus(new Date("2026-10-17T06:30:00Z"), cfg).state).toBe("closed");
  });

  it("applies holiday exceptions", () => {
    // Thanksgiving Thu 26 Nov 2026 at noon CST (UTC-6)
    const s = getStatus(new Date("2026-11-26T18:00:00Z"), cfg);
    expect(s.state).toBe("closed");
  });

  it("shows temporary closures", () => {
    const c = testConfig({ temporaryClosure: { active: true, message: "Back soon" } });
    const s = getStatus(OPEN_THU_NOON, c);
    expect(s.state).toBe("temporarily_closed");
    expect(s.acceptingAsap).toBe(false);
    expect(getSlots(OPEN_THU_NOON, "pickup", c)).toEqual([]);
  });

  it("is DST-aware (fall back on 1 Nov 2026)", () => {
    const before = intervalsAround(new Date("2026-10-25T12:00:00Z"), 0, cfg).find((i) => i.dateKey === "2026-10-25")!;
    const after = intervalsAround(new Date("2026-11-01T12:00:00Z"), 0, cfg).find((i) => i.dateKey === "2026-11-01")!;
    expect(before.start.toISOString()).toBe("2026-10-25T16:00:00.000Z"); // 11:00 CDT
    expect(after.start.toISOString()).toBe("2026-11-01T17:00:00.000Z"); // 11:00 CST
  });
});

describe("ordering slots", () => {
  it("produces aligned slots after the lead time and before the cutoff", () => {
    const slots = getSlots(OPEN_THU_NOON, "pickup", cfg);
    expect(slots.length).toBeGreaterThan(0);
    const first = slots[0]!;
    expect(first.getTime()).toBeGreaterThanOrEqual(OPEN_THU_NOON.getTime() + cfg.ordering.preparationMinutes * 60_000);
    expect(first.getUTCMinutes() % cfg.ordering.slotIntervalMinutes).toBe(0);
    // No slot today after 21:45 local (02:45Z)
    expect(slots.some((s) => s.toISOString() === "2026-10-16T02:45:00.000Z")).toBe(true);
    expect(slots.some((s) => s.toISOString() === "2026-10-16T03:00:00.000Z")).toBe(false);
  });

  it("uses a longer lead time for delivery", () => {
    const p = getSlots(OPEN_THU_NOON, "pickup", cfg)[0]!;
    const d = getSlots(OPEN_THU_NOON, "delivery", cfg)[0]!;
    expect(d.getTime()).toBeGreaterThan(p.getTime());
  });

  it("offers no slots on closed days", () => {
    const slots = getSlots(new Date("2026-10-18T22:00:00Z"), "pickup", testConfig({ ordering: { ...cfg.ordering, scheduleDaysAhead: 1 } }));
    // Monday 19 Oct local day = 05:00Z Mon → 05:00Z Tue
    const monStart = Date.parse("2026-10-19T05:00:00Z");
    const monEnd = Date.parse("2026-10-20T05:00:00Z");
    expect(slots.length).toBeGreaterThan(0); // Sunday evening slots exist
    expect(slots.some((s) => s.getTime() >= monStart && s.getTime() < monEnd)).toBe(false);
  });

  it("respects scheduleWhileClosed = false", () => {
    const c = testConfig({ ordering: { ...cfg.ordering, scheduleWhileClosed: false } });
    expect(getSlots(new Date("2026-10-19T17:00:00Z"), "pickup", c)).toEqual([]);
  });
});

describe("requested time validation", () => {
  it("accepts ASAP when open and rejects it when closed", () => {
    expect(validateRequestedTime("asap", OPEN_THU_NOON, "pickup", cfg).ok).toBe(true);
    const closed = validateRequestedTime("asap", new Date("2026-10-19T17:00:00Z"), "pickup", cfg);
    expect(closed.ok).toBe(false);
  });

  it("accepts a valid slot and rejects arbitrary or past times", () => {
    const slot = getSlots(OPEN_THU_NOON, "pickup", cfg)[3]!;
    expect(validateRequestedTime(slot.toISOString(), OPEN_THU_NOON, "pickup", cfg).ok).toBe(true);
    expect(validateRequestedTime("2026-10-15T17:07:00Z", OPEN_THU_NOON, "pickup", cfg).ok).toBe(false);
    expect(validateRequestedTime("2026-10-15T10:00:00Z", OPEN_THU_NOON, "pickup", cfg).ok).toBe(false);
    expect(validateRequestedTime("not-a-date", OPEN_THU_NOON, "pickup", cfg).ok).toBe(false);
  });
});
