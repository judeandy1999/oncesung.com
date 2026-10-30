/** Whether ad/conversion tags may run (Consent Mode v2 / CMP updates on dataLayer). */
export function isConversionTrackingAllowed(): boolean {
  if (typeof window === "undefined") return false;

  const dl = window.dataLayer;
  if (!dl?.length) return true;

  let adStorage: string | undefined;
  let analyticsStorage: string | undefined;

  for (const item of dl) {
    if (Array.isArray(item) && item[0] === "consent") {
      const payload = item[2];
      if (payload && typeof payload === "object") {
        const p = payload as Record<string, string>;
        if (p.ad_storage) adStorage = p.ad_storage;
        if (p.analytics_storage) analyticsStorage = p.analytics_storage;
      }
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.ad_storage === "string") adStorage = row.ad_storage;
    if (typeof row.analytics_storage === "string") analyticsStorage = row.analytics_storage;
  }

  if (adStorage === undefined && analyticsStorage === undefined) return true;
  return adStorage === "granted" || analyticsStorage === "granted";
}
