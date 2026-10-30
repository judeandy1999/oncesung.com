import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOrderPaid } from "@/lib/email/notify";
import { payPalValueToCents, type PackageKey } from "@/lib/orders/catalog";

export type SavedOrder = {
  id: string;
  user_id: string;
  package_key: PackageKey;
  amount_cents: number;
  currency: string;
  status: "draft" | "pending" | "paid";
  recipient_name: string;
  occasion: string;
  story: unknown;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  song_storage_path: string | null;
  song_filename: string | null;
  song_content_type: string | null;
  gift_access_token: string | null;
  paid_at: string | null;
  created_at: string;
};

export async function getOrderById(id: string): Promise<SavedOrder | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("orders").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as SavedOrder;
}

export async function getOrderByGiftToken(token: string): Promise<SavedOrder | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("gift_access_token", token)
    .eq("status", "paid")
    .maybeSingle();
  if (error || !data) return null;
  return data as SavedOrder;
}

export async function markOrderPaid(input: {
  paypalOrderId: string;
  captureId: string;
  currency: string;
  value: string;
  customId: string | null;
  captureStatus: string;
}): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  if (input.captureStatus !== "COMPLETED") return { ok: false, error: "PayPal has not completed this payment." };
  const cents = payPalValueToCents(input.value);
  if (input.currency !== "USD" || cents == null) return { ok: false, error: "PayPal returned an unexpected amount." };

  const admin = createAdminClient();
  let order: SavedOrder | null = null;
  if (input.customId) order = await getOrderById(input.customId);
  if (!order) {
    const { data } = await admin.from("orders").select("*").eq("paypal_order_id", input.paypalOrderId).maybeSingle();
    order = (data as SavedOrder | null) ?? null;
  }
  if (!order) return { ok: false, error: "This payment does not match an order." };
  if (order.paypal_order_id && order.paypal_order_id !== input.paypalOrderId) {
    return { ok: false, error: "This payment does not match the order." };
  }
  if (order.amount_cents !== cents) return { ok: false, error: "The amount paid does not match the package price." };
  if (order.status === "paid") {
    if (order.paypal_capture_id === input.captureId) return { ok: true, orderId: order.id };
    return { ok: false, error: "This order was already paid." };
  }

  const { data: updated, error } = await admin
    .from("orders")
    .update({
      status: "paid",
      paypal_order_id: input.paypalOrderId,
      paypal_capture_id: input.captureId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .neq("status", "paid")
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    const current = await getOrderById(order.id);
    if (current?.status === "paid" && current.paypal_capture_id === input.captureId) {
      return { ok: true, orderId: order.id };
    }
    return { ok: false, error: "The payment was taken but the order could not be saved." };
  }
  const paid = await getOrderById(order.id);
  if (paid) void notifyOrderPaid(paid);
  return { ok: true, orderId: order.id };
}
