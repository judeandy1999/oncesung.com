import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { payPalValueToCents, type PackageKey } from "@/lib/orders/catalog";

export type SongCreditStatus = "pending" | "paid" | "claimed" | "consumed" | "cancelled";

export type SongCredit = {
  id: string;
  purchaser_user_id: string;
  package_key: PackageKey;
  amount_cents: number;
  currency: string;
  status: SongCreditStatus;
  recipient_email: string;
  recipient_name: string;
  recipient_user_id: string | null;
  personal_message: string;
  claim_token: string;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  paid_at: string | null;
  claimed_at: string | null;
  consumed_at: string | null;
  redeemed_order_id: string | null;
  created_at: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getCreditById(id: string): Promise<SongCredit | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("song_credits").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as SongCredit;
}

export async function getCreditByClaimToken(token: string): Promise<SongCredit | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("song_credits")
    .select("*")
    .eq("claim_token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data as SongCredit;
}

export async function findProfileIdByEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").eq("email", normalized).maybeSingle();
  return data?.id ?? null;
}

export async function markCreditPaid(input: {
  creditId: string;
  paypalOrderId: string;
  captureId: string;
  currency: string;
  value: string;
  captureStatus: string;
}): Promise<{ ok: true; creditId: string } | { ok: false; error: string }> {
  if (input.captureStatus !== "COMPLETED") {
    return { ok: false, error: "PayPal has not completed this payment." };
  }
  const cents = payPalValueToCents(input.value);
  if (input.currency !== "USD" || cents == null) {
    return { ok: false, error: "PayPal returned an unexpected amount." };
  }

  const credit = await getCreditById(input.creditId);
  if (!credit) return { ok: false, error: "This payment does not match a gift card." };
  if (credit.amount_cents !== cents) {
    return { ok: false, error: "The amount paid does not match the gift card price." };
  }
  if (credit.status === "paid" || credit.status === "claimed" || credit.status === "consumed") {
    if (credit.paypal_capture_id === input.captureId) return { ok: true, creditId: credit.id };
    return { ok: false, error: "This gift card was already paid." };
  }

  const admin = createAdminClient();
  const recipientUserId = credit.recipient_user_id ?? (await findProfileIdByEmail(credit.recipient_email));

  const { data: updated, error } = await admin
    .from("song_credits")
    .update({
      status: "paid",
      paypal_order_id: input.paypalOrderId,
      paypal_capture_id: input.captureId,
      paid_at: new Date().toISOString(),
      recipient_user_id: recipientUserId,
    })
    .eq("id", credit.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    const current = await getCreditById(credit.id);
    if (current?.paypal_capture_id === input.captureId) return { ok: true, creditId: credit.id };
    return { ok: false, error: "The payment was taken but the gift card could not be saved." };
  }

  return { ok: true, creditId: credit.id };
}

export async function claimCredit(input: {
  token: string;
  userId: string;
  userEmail: string;
}): Promise<{ ok: true; creditId: string } | { ok: false; error: string }> {
  const credit = await getCreditByClaimToken(input.token);
  if (!credit || credit.status === "consumed" || credit.status === "cancelled" || credit.status === "pending") {
    return { ok: false, error: "This gift link is not available." };
  }
  if (credit.status !== "paid" && credit.status !== "claimed") {
    return { ok: false, error: "This gift link is not available." };
  }
  if (normalizeEmail(input.userEmail) !== normalizeEmail(credit.recipient_email)) {
    return {
      ok: false,
      error: `Sign in with ${credit.recipient_email} to claim this gift.`,
    };
  }

  if (credit.status === "claimed" && credit.recipient_user_id === input.userId) {
    return { ok: true, creditId: credit.id };
  }
  if (credit.recipient_user_id && credit.recipient_user_id !== input.userId) {
    return { ok: false, error: "This gift was claimed by another account." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("song_credits")
    .update({
      status: "claimed",
      recipient_user_id: input.userId,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", credit.id)
    .in("status", ["paid", "claimed"]);

  if (error) return { ok: false, error: "Could not claim this gift. Try again." };
  return { ok: true, creditId: credit.id };
}

export async function listRedeemableCredits(userId: string): Promise<SongCredit[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("song_credits")
    .select("*")
    .eq("recipient_user_id", userId)
    .eq("status", "claimed")
    .order("claimed_at", { ascending: false });
  return (data ?? []) as SongCredit[];
}

export async function consumeCreditForOrder(input: {
  creditId: string;
  orderId: string;
  userId: string;
  packageKey: PackageKey;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const credit = await getCreditById(input.creditId);
  if (!credit || credit.recipient_user_id !== input.userId) {
    return { ok: false, error: "That gift credit could not be found." };
  }
  if (credit.status !== "claimed") {
    return { ok: false, error: "This gift credit is not ready to use." };
  }
  if (credit.package_key !== input.packageKey) {
    return { ok: false, error: "This gift credit is for a different package." };
  }

  const admin = createAdminClient();
  const { error: orderError } = await admin
    .from("orders")
    .update({
      status: "paid",
      payment_source: "gift_credit",
      song_credit_id: credit.id,
      paid_at: new Date().toISOString(),
    })
    .eq("id", input.orderId)
    .eq("user_id", input.userId)
    .neq("status", "paid");

  if (orderError) return { ok: false, error: "Could not apply the gift credit to this order." };

  const { error: creditError } = await admin
    .from("song_credits")
    .update({
      status: "consumed",
      consumed_at: new Date().toISOString(),
      redeemed_order_id: input.orderId,
    })
    .eq("id", credit.id)
    .eq("status", "claimed");

  if (creditError) return { ok: false, error: "The order was updated but the gift credit was not marked used." };
  return { ok: true };
}
