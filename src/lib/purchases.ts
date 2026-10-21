import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Purchase = {
  id: string;
  song_slug: string;
  order_reference: string;
  created_at: string;
};

/** Songs this signed-in user has purchased. Empty when signed out or none exist. */
export async function listOwnPurchases(): Promise<Purchase[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("purchases")
    .select("id, song_slug, order_reference, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Purchase[];
}
