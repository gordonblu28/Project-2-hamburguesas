import { ImageResponse } from "next/og";
import { restaurant } from "@/config/restaurant";

export const alt = `${restaurant.name} — ${restaurant.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const t = restaurant.theme;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: t.ivory, color: t.ink, padding: 72, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "62%" }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6 }}>{restaurant.name.toUpperCase()}</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 128, fontWeight: 900, lineHeight: 0.9, letterSpacing: -2 }}>
            <span>GOOD FOOD.</span>
            <span style={{ color: t.tomato }}>NO HALF STACKS.</span>
          </div>
          <div style={{ fontSize: 28 }}>Order online · Pickup & delivery</div>
        </div>
        <div style={{ position: "absolute", right: -80, top: 95, width: 520, height: 520, borderRadius: 999, background: t.tomato, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 340, height: 140, background: "#DB8C36", borderRadius: "170px 170px 24px 24px" }} />
            <div style={{ width: 360, height: 26, background: "#6DB33F", borderRadius: 14 }} />
            <div style={{ width: 350, height: 22, background: t.mustard, borderRadius: 6 }} />
            <div style={{ width: 340, height: 50, background: "#4F250F", borderRadius: 25 }} />
            <div style={{ width: 330, height: 56, background: "#C77A2E", borderRadius: "10px 10px 40px 40px" }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
