"use client";

import { isDemoContact } from "@/features/checkout/contact-demo";
import { oncesungStore } from "@/lib/store";

export type CheckoutDetails = {
  fullName: string;
  email: string;
  updates: boolean;
  isGift: boolean;
  recipient?: string;
  recipientEmail?: string;
  relationship: "Partner" | "Friend" | "Family";
  notes?: string;
};

function isSampleDetails(details: Partial<CheckoutDetails> | null): boolean {
  if (!details) return false;
  return isDemoContact(details.email, details.fullName);
}

export function readCheckoutDetails(): Partial<CheckoutDetails> | null {
  const saved = oncesungStore.get<Partial<CheckoutDetails>>("details");
  if (!saved) return null;
  if (isSampleDetails(saved)) {
    oncesungStore.remove("details");
    return null;
  }
  return saved;
}

function storyForCheckout(details: Partial<CheckoutDetails> | null): Record<string, unknown> {
  const saved = oncesungStore.get<unknown>("story");
  const base =
    saved && typeof saved === "object" && !Array.isArray(saved) ? { ...(saved as Record<string, unknown>) } : {};
  const answers =
    base.answers && typeof base.answers === "object" && !Array.isArray(base.answers)
      ? { ...(base.answers as Record<string, unknown>) }
      : {};
  if (details?.recipient?.trim()) answers.recipient = details.recipient.trim();
  if (details?.notes?.trim()) answers.notes = details.notes.trim();
  if (details?.fullName?.trim()) answers.contactName = details.fullName.trim();
  if (details?.email?.trim()) answers.contactEmail = details.email.trim();
  if (details?.relationship) answers.relationship = details.relationship;
  answers.isGift = Boolean(details?.isGift);
  if (details?.isGift && details.recipientEmail?.trim()) {
    answers.recipientEmail = details.recipientEmail.trim();
  }

  const brief = oncesungStore.get<{ text?: string; json?: unknown }>("brief");
  const payload: Record<string, unknown> = { ...base, answers };
  if (brief?.text?.trim()) payload.briefText = brief.text.trim();
  if (brief?.json && typeof brief.json === "object") payload.briefJson = brief.json;
  return payload;
}

export async function createCheckoutOrder(
  details: Partial<CheckoutDetails> | null,
): Promise<{ id: string } | { error: string; status: number }> {
  const pkg = oncesungStore.get<unknown>("package");
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      story: storyForCheckout(details),
      packageKey: typeof pkg === "string" ? pkg : null,
    }),
  });
  const body = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
  if (response.status === 401) return { error: "Sign in to pay.", status: 401 };
  if (!response.ok || !body?.id) {
    return { error: body?.error || "Could not open payment.", status: response.status };
  }
  oncesungStore.set("pending-order", body.id);
  return { id: body.id };
}
