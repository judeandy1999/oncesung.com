"use client";

import { useEffect } from "react";
import { pushPurchaseConversion } from "@/lib/analytics/push-purchase";

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

    const tryPush = () => pushPurchaseConversion(payload);

    if (tryPush()) return;

    const onConsent = () => {
      tryPush();
    };
    window.addEventListener("consent_update", onConsent);
    return () => window.removeEventListener("consent_update", onConsent);
  }, [orderId, amountCents, currency]);

  return null;
}
