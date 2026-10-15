import { restaurant } from "@/config/restaurant";
import type { RestaurantConfig } from "@/types/restaurant";

export function testConfig(overrides: Partial<RestaurantConfig> = {}): RestaurantConfig {
  return structuredClone({ ...restaurant, ...overrides });
}

/** Thursday 15 Oct 2026, 12:00 in America/Chicago (CDT, UTC-5) — restaurant open. */
export const OPEN_THU_NOON = new Date("2026-10-15T17:00:00Z");
