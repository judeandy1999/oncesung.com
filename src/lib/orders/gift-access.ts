import "server-only";

import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderById } from "@/lib/orders/record";

/** Ensures a private gift link token exists (DB column `gift_access_token`). */
export async function ensureGiftAccessToken(orderId: string): Promise<string | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;
  if (order.gift_access_token) return order.gift_access_token;

  const token = randomUUID();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .update({ gift_access_token: token })
    .eq("id", orderId)
    .select("gift_access_token")
    .maybeSingle();

  if (error) {
    console.error("gift_access_token could not be saved", error.message);
    return null;
  }
  return (data?.gift_access_token as string | null) ?? token;
}
