import { isConversionTrackingAllowed } from "@/lib/analytics/consent";

const DEDUPE_PREFIX = "oncesung:gtm_purchase:";

export type PurchaseConversion = {
  transactionId: string;
  value: number;
  currency: string;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function purchaseConversionStorageKey(transactionId: string): string {
  return DEDUPE_PREFIX + transactionId;
}

export function hasPurchaseConversionBeenTracked(transactionId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(purchaseConversionStorageKey(transactionId)) === "1";
  } catch {
    return false;
  }
}

export function markPurchaseConversionTracked(transactionId: string): void {
  try {
    localStorage.setItem(purchaseConversionStorageKey(transactionId), "1");
  } catch {
    // Private mode or blocked storage — still pushed once this session.
  }
}

/** Push a Google Ads / GTM purchase event once per order when consent allows. */
export function pushPurchaseConversion(order: PurchaseConversion): boolean {
  if (!order.transactionId || !Number.isFinite(order.value) || order.value <= 0) return false;
  if (!order.currency) return false;
  if (!isConversionTrackingAllowed()) return false;
  if (hasPurchaseConversionBeenTracked(order.transactionId)) return false;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "purchase",
    transaction_id: order.transactionId,
    value: order.value,
    currency: order.currency,
  });
  markPurchaseConversionTracked(order.transactionId);
  return true;
}
