import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/format";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl()}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl()}/politica-de-privacidade`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
