import type { MetadataRoute } from "next";

const routes = [
  "/",
  "/songs",
  "/occasions",
  "/how-it-works",
  "/pricing",
  "/examples",
  "/example",
  "/reviews",
  "/gift-finder",
  "/faq",
  "/guarantee",
  "/gift-cards",
  "/referral",
  "/affiliates",
  "/sitemap",
  "/song-intake",
  "/checkout/package",
  "/checkout/review",
  "/checkout/details",
  "/checkout/payment",
  "/order-confirmed",
  "/email-confirmation",
  "/account",
  "/dashboard",
  "/song-player",
  "/requests",
  "/downloads",
  "/share",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://oncesung.com";
  return routes.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
