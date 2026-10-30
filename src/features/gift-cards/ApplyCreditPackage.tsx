"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { isPackageKey } from "@/lib/orders/catalog";
import { oncesungStore } from "@/lib/store";

/** When starting intake from a claimed gift, pin the package from the credit. */
export function ApplyCreditPackage() {
  const params = useSearchParams();
  const creditId = params.get("credit");

  useEffect(() => {
    if (!creditId) return;
    void fetch("/api/credits/mine")
      .then((r) => r.json())
      .then((body: { credits?: { id: string; package_key: string }[] }) => {
        const credit = body.credits?.find((c) => c.id === creditId);
        if (credit && isPackageKey(credit.package_key)) {
          oncesungStore.set("package", credit.package_key);
          oncesungStore.set("gift-credit-id", creditId);
        }
      })
      .catch(() => undefined);
  }, [creditId]);

  return null;
}
