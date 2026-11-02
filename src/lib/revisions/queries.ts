import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { PackageKey } from "@/lib/orders/catalog";
import { isPackageKey } from "@/lib/orders/catalog";
import type { ChangeRequestType } from "@/lib/revisions/limits";

export type EligibleRevisionOrder = {
  id: string;
  package_key: PackageKey;
  recipient_name: string;
  occasion: string;
  song_filename: string | null;
};

export type SongChangeRequestRow = {
  id: string;
  order_id: string;
  package_key: PackageKey;
  request_type: ChangeRequestType;
  sequence_number: number;
  status: string;
  fields: Record<string, string>;
  created_at: string;
};

export type SongChangeRequestMessageRow = {
  id: string;
  request_id: string;
  sender_role: "customer" | "admin";
  body: string;
  created_at: string;
};

export type SongChangeRequestWithMessages = SongChangeRequestRow & {
  messages: SongChangeRequestMessageRow[];
};

export async function listEligibleRevisionOrders(): Promise<EligibleRevisionOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, package_key, recipient_name, occasion, song_filename, song_storage_path, status")
    .eq("status", "paid")
    .not("song_storage_path", "is", null)
    .order("paid_at", { ascending: false });

  if (error || !data) return [];

  return data
    .filter((row) => isPackageKey(row.package_key))
    .map((row) => ({
      id: row.id,
      package_key: row.package_key as PackageKey,
      recipient_name: row.recipient_name ?? "",
      occasion: row.occasion ?? "",
      song_filename: row.song_filename,
    }));
}

export async function listSongChangeRequestsForSession(): Promise<SongChangeRequestWithMessages[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: requests, error } = await supabase
    .from("song_change_requests")
    .select(
      "id, order_id, package_key, request_type, sequence_number, status, fields, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !requests?.length) return [];

  const ids = requests.map((r) => r.id);
  const { data: messages } = await supabase
    .from("song_change_request_messages")
    .select("id, request_id, sender_role, body, created_at")
    .in("request_id", ids)
    .order("created_at", { ascending: true });

  const byRequest = new Map<string, SongChangeRequestMessageRow[]>();
  for (const msg of messages ?? []) {
    const list = byRequest.get(msg.request_id) ?? [];
    list.push(msg as SongChangeRequestMessageRow);
    byRequest.set(msg.request_id, list);
  }

  return requests
    .filter((row) => isPackageKey(row.package_key))
    .map((row) => ({
      id: row.id,
      order_id: row.order_id,
      package_key: row.package_key as PackageKey,
      request_type: row.request_type as ChangeRequestType,
      sequence_number: row.sequence_number,
      status: row.status,
      fields: (row.fields ?? {}) as Record<string, string>,
      created_at: row.created_at,
      messages: byRequest.get(row.id) ?? [],
    }));
}
