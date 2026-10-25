import type { PackageKey } from "@/lib/orders/catalog";

export type ProgressStepKey = "received" | "story" | "production" | "review" | "delivery";

export type ProgressStep = {
  key: ProgressStepKey;
  label: string;
  state: "done" | "cur" | "todo";
  detail: string;
};

export type OrderFulfillment = "in_progress" | "completed";

export function orderFulfillment(hasSongFile: boolean): OrderFulfillment {
  return hasSongFile ? "completed" : "in_progress";
}

export function orderProgressSteps(input: {
  paidAt: string | null;
  hasSongFile: boolean;
}): ProgressStep[] {
  const paidLabel = formatShortDate(input.paidAt) || "Paid";
  if (input.hasSongFile) {
    return [
      { key: "received", label: "Order received", state: "done", detail: paidLabel },
      { key: "story", label: "Story & lyrics", state: "done", detail: "Completed" },
      { key: "production", label: "Production", state: "done", detail: "Completed" },
      { key: "review", label: "Your review", state: "done", detail: "Ready" },
      { key: "delivery", label: "Final delivery", state: "done", detail: "Delivered" },
    ];
  }

  return [
    { key: "received", label: "Order received", state: "done", detail: paidLabel },
    { key: "story", label: "Story & lyrics", state: "done", detail: "Completed" },
    { key: "production", label: "Production", state: "cur", detail: "In progress" },
    { key: "review", label: "Your review", state: "todo", detail: "Next" },
    { key: "delivery", label: "Final delivery", state: "todo", detail: "—" },
  ];
}

export function estimatedDeliveryDate(paidAt: string | null, packageKey: PackageKey): string {
  if (!paidAt) return "—";
  const date = new Date(paidAt);
  if (Number.isNaN(date.getTime())) return "—";
  const hours = packageKey === "essential" ? 48 : 72;
  date.setHours(date.getHours() + hours);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatShortDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function orderReference(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
