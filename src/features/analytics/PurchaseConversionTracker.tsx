"use client";

import { useEffect } from "react";
import { pushPurchaseConversion } from "@/lib/analytics/push-purchase";

const RETRY_MS = 400;
const MAX_WAIT_MS = 20000;

export function PurchaseConversionTracker({
  orderId,
  amountCents,
  currency,
}: {
  orderId: string;
  amountCents: number;
  currency: string;
}) {
  useEffect(() => {
    const payload = {
      transactionId: orderId,
      value: amountCents / 100,
      currency: currency.toUpperCase(),
    };

    const started = Date.now();
    let timer: ReturnType<typeof setInterval> | null = null;

    const tryPush = () => {
      if (pushPurchaseConversion(payload)) {
        if (timer) clearInterval(timer);
        return true;
      }
      if (Date.now() - started > MAX_WAIT_MS && timer) {
        clearInterval(timer);
      }
      return false;
    };

    if (tryPush()) return;

    timer = setInterval(tryPush, RETRY_MS);

    const onConsent = () => {
      tryPush();
    };
    window.addEventListener("consent_update", onConsent);

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener("consent_update", onConsent);
    };
  }, [orderId, amountCents, currency]);

  return null;
}
