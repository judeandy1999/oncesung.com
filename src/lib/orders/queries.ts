import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PackageKey } from "@/lib/orders/catalog";

export type CustomerOrder = {
  id: string;
  package_key: PackageKey;
  amount_cents: number;
  recipient_name: string;
  occasion: string;
  paid_at: string | null;
  song_filename: string | null;
  song_storage_path: string | null;
};

export async function listOwnPaidOrders(): Promise<CustomerOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, package_key, amount_cents, recipient_name, occasion, paid_at, song_filename, song_storage_path")
    .eq("status", "paid")
    .order("paid_at", { ascending: false });
  if (error || !data) return [];
  return data as CustomerOrder[];
}

export async function getOwnOrder(id: string): Promise<CustomerOrder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, package_key, amount_cents, recipient_name, occasion, paid_at, song_filename, song_storage_path, status")
    .eq("id", id)
    .eq("status", "paid")
    .maybeSingle();
  if (error || !data) return null;
  return data as CustomerOrder;
}
