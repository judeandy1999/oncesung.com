export const PACKAGE_KEYS = ["essential", "signature", "concierge"] as const;

export type PackageKey = (typeof PACKAGE_KEYS)[number];

export const PACKAGE_CATALOG: Record<
  PackageKey,
  { key: PackageKey; name: string; amountCents: number; delivery: string }
> = {
  essential: { key: "essential", name: "Essential", amountCents: 4900, delivery: "48-hour delivery" },
  signature: { key: "signature", name: "Signature", amountCents: 8900, delivery: "72-hour delivery" },
  concierge: { key: "concierge", name: "Concierge", amountCents: 14900, delivery: "72-hour delivery" },
};

export function isPackageKey(key: string | null | undefined): key is PackageKey {
  return key === "essential" || key === "signature" || key === "concierge";
}

export function packageByKey(key: string | null | undefined): (typeof PACKAGE_CATALOG)[PackageKey] {
  return PACKAGE_CATALOG[isPackageKey(key) ? key : "signature"];
}

export function formatCents(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainder = Math.abs(cents % 100);
  return `$${dollars}.${String(remainder).padStart(2, "0")}`;
}

/** PayPal amount values are decimal strings with two digits, not floats. */
export function centsToPayPalValue(cents: number): string {
  if (!Number.isInteger(cents) || cents <= 0) {
    throw new Error("Invalid package amount");
  }
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  return `${dollars}.${String(remainder).padStart(2, "0")}`;
}

export function payPalValueToCents(value: string): number | null {
  const match = /^(\d+)\.(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 100 + Number(match[2]);
}
