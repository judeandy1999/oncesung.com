import { isAdsConversionAllowed } from "@/lib/analytics/consent";
import { GOOGLE_ADS_ID, GOOGLE_ADS_PURCHASE_SEND_TO } from "@/lib/analytics/google-ads";

const DEDUPE_PREFIX = "oncesung:gtm_purchase:";

export type PurchaseConversion = {
  transactionId: string;
  value: number;
  currency: string;
};

declare global {
  interface Window {
    /** GTM events (objects) and gtag consent commands (arrays). */
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
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

export const ADMIN_TEST_TRANSACTION_PREFIX = "admin-verify-";

export function isAdminTestTransactionId(transactionId: string): boolean {
  return transactionId.startsWith(ADMIN_TEST_TRANSACTION_PREFIX);
}

export function markPurchaseConversionTracked(transactionId: string): void {
  try {
    localStorage.setItem(purchaseConversionStorageKey(transactionId), "1");
  } catch {
    // Private mode or blocked storage — still pushed once this session.
  }
}

/** gtag.js for AW-… must be on the page before conversion events count in Ads. */
export function isGoogleAdsGtagReady(): boolean {
  if (typeof document === "undefined") return false;
  if (typeof window.gtag !== "function") return false;
  const aw = GOOGLE_ADS_ID.replace(/'/g, "");
  return Boolean(document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${aw}"]`));
}

function isValidConversionValue(order: PurchaseConversion): boolean {
  if (!Number.isFinite(order.value)) return false;
  if (isAdminTestTransactionId(order.transactionId)) return order.value >= 0;
  return order.value > 0;
}

/** Push Google Ads purchase conversion once per order when marketing consent + gtag are ready. */
export function pushPurchaseConversion(order: PurchaseConversion): boolean {
  if (!order.transactionId || !isValidConversionValue(order)) return false;
  if (!order.currency) return false;
  if (!isAdsConversionAllowed()) return false;
  if (hasPurchaseConversionBeenTracked(order.transactionId)) return false;
  if (!isGoogleAdsGtagReady()) return false;

  const gtag = window.gtag;
  if (typeof gtag !== "function" || !GOOGLE_ADS_PURCHASE_SEND_TO) return false;

  gtag("event", "conversion", {
    send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
    value: order.value,
    currency: order.currency.toUpperCase(),
    transaction_id: order.transactionId,
  });

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "purchase",
    transaction_id: order.transactionId,
    value: order.value,
    currency: order.currency.toUpperCase(),
  });
  window.dataLayer.push({
    event: "conversion",
    send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
    value: order.value,
    currency: order.currency.toUpperCase(),
    transaction_id: order.transactionId,
  });

  markPurchaseConversionTracked(order.transactionId);
  return true;
}
