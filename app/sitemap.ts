import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/restaurant";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/menu", "/order", "/our-story", "/location", "/contact", "/privacy", "/terms", "/ordering-policy", "/refund-policy"];
  return routes.map((r) => ({
    url: `${siteUrl}${r}`,
    changeFrequency: r === "/menu" || r === "" ? "weekly" : "monthly",
    priority: r === "" ? 1 : r === "/menu" || r === "/order" ? 0.9 : 0.5,
  }));
}
