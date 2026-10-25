import { headers } from "next/headers";

/** Origin used in Supabase email links. Prefers NEXT_PUBLIC_SITE_URL when set. */
export async function getSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto === "https" ? "https" : "http"}://${host}`;
}
