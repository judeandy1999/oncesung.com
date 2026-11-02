import type { PackageKey } from "@/lib/orders/catalog";

export type ChangeRequestType = "revision" | "remake";

export const REVISION_LIMITS: Record<
  PackageKey,
  { revision: number; remake: number }
> = {
  essential: { revision: 1, remake: 0 },
  signature: { revision: 3, remake: 3 },
  concierge: { revision: 3, remake: 3 },
};

export const PACKAGE_DISPLAY: Record<PackageKey, string> = {
  essential: "Essential",
  signature: "Signature",
  concierge: "Concierge",
};

export function limitsForPackage(packageKey: PackageKey) {
  return REVISION_LIMITS[packageKey];
}

export function limitForType(packageKey: PackageKey, type: ChangeRequestType): number {
  const limits = limitsForPackage(packageKey);
  return type === "revision" ? limits.revision : limits.remake;
}
