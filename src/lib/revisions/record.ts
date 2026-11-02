import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isPackageKey, type PackageKey } from "@/lib/orders/catalog";
import {
  limitForType,
  type ChangeRequestType,
} from "@/lib/revisions/limits";

function fieldsRecord(value: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    const trimmed = v.trim();
    if (trimmed) out[k] = trimmed.slice(0, 1500);
  }
  return out;
}

async function getEligibleOrderForUser(orderId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, user_id, package_key, status, song_storage_path")
    .eq("id", orderId)
    .maybeSingle();

  if (!data || data.user_id !== userId || data.status !== "paid" || !data.song_storage_path) {
    return null;
  }
  if (!isPackageKey(data.package_key)) return null;
  return { id: data.id, package_key: data.package_key as PackageKey };
}

async function countRequests(orderId: string, type: ChangeRequestType): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("song_change_requests")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId)
    .eq("request_type", type)
    .neq("status", "cancelled");

  if (error) return Number.MAX_SAFE_INTEGER;
  return count ?? 0;
}

export async function createSongChangeRequest(input: {
  userId: string;
  orderId: string;
  requestType: ChangeRequestType;
  fields: Record<string, string>;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const order = await getEligibleOrderForUser(input.orderId, input.userId);
  if (!order) {
    return { ok: false, error: "Choose a delivered song from your orders." };
  }

  const max = limitForType(order.package_key, input.requestType);
  if (max === 0) {
    return {
      ok: false,
      error: "Remakes aren’t included in the Essential package. You can still request a minor revision.",
    };
  }

  const used = await countRequests(order.id, input.requestType);
  if (used >= max) {
    return {
      ok: false,
      error:
        input.requestType === "remake"
          ? "You’ve used all the remakes included in your package for this song."
          : "You’ve used all the minor revisions included in your package for this song.",
    };
  }

  const mainKey = input.requestType === "revision" ? "What to change" : "New direction";
  if (!input.fields[mainKey]?.trim()) {
    return {
      ok: false,
      error:
        input.requestType === "revision"
          ? "Tell us what to change."
          : "Describe the new version you’d like.",
    };
  }

  const admin = createAdminClient();
  const sequenceNumber = used + 1;
  const { data, error } = await admin
    .from("song_change_requests")
    .insert({
      order_id: order.id,
      user_id: input.userId,
      package_key: order.package_key,
      request_type: input.requestType,
      sequence_number: sequenceNumber,
      status: "sent",
      fields: fieldsRecord(input.fields),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not send your request. Try again or contact support." };
  }

  return { ok: true, id: data.id };
}

export async function addCustomerSongChangeMessage(input: {
  userId: string;
  requestId: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = input.body.trim();
  if (!text) return { ok: false, error: "Write a message first." };
  if (text.length > 4000) return { ok: false, error: "Message is too long." };

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("song_change_requests")
    .select("id")
    .eq("id", input.requestId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!request) return { ok: false, error: "That conversation could not be found." };

  const { error } = await supabase.from("song_change_request_messages").insert({
    request_id: input.requestId,
    sender_role: "customer",
    body: text,
  });

  if (error) return { ok: false, error: "Could not send your message." };
  return { ok: true };
}

export async function addAdminSongChangeMessage(input: {
  requestId: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = input.body.trim();
  if (!text) return { ok: false, error: "Write a message first." };

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("song_change_requests")
    .select("id")
    .eq("id", input.requestId)
    .maybeSingle();

  if (!request) return { ok: false, error: "Request not found." };

  const { error } = await admin.from("song_change_request_messages").insert({
    request_id: input.requestId,
    sender_role: "admin",
    body: text.slice(0, 4000),
  });

  if (error) return { ok: false, error: "Could not send reply." };

  await admin
    .from("song_change_requests")
    .update({ status: "in_progress" })
    .eq("id", input.requestId)
    .eq("status", "sent");

  return { ok: true };
}
