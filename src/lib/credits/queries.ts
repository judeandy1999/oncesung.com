import { createClient } from "@/lib/supabase/server";
import type { PackageKey } from "@/lib/orders/catalog";
import { isPackageKey } from "@/lib/orders/catalog";

export type ClaimedCreditSummary = {
  id: string;
  package_key: PackageKey;
  recipient_name: string;
  claimed_at: string | null;
};

export type SentCreditSummary = {
  id: string;
  package_key: PackageKey;
  amount_cents: number;
  status: string;
  recipient_email: string;
  recipient_name: string;
  personal_message: string;
  paid_at: string | null;
  claimed_at: string | null;
  consumed_at: string | null;
  created_at: string;
};

export async function listSentCreditsForSession(): Promise<SentCreditSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("song_credits")
    .select(
      "id, package_key, amount_cents, status, recipient_email, recipient_name, personal_message, paid_at, claimed_at, consumed_at, created_at",
    )
    .eq("purchaser_user_id", user.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  return (data ?? [])
    .filter((row) => isPackageKey(row.package_key))
    .map((row) => ({
      id: row.id,
      package_key: row.package_key as PackageKey,
      amount_cents: row.amount_cents,
      status: row.status,
      recipient_email: row.recipient_email,
      recipient_name: row.recipient_name ?? "",
      personal_message: row.personal_message ?? "",
      paid_at: row.paid_at,
      claimed_at: row.claimed_at,
      consumed_at: row.consumed_at,
      created_at: row.created_at,
    }));
}

export async function listClaimedCreditsForSession(): Promise<ClaimedCreditSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("song_credits")
    .select("id, package_key, recipient_name, claimed_at")
    .eq("recipient_user_id", user.id)
    .eq("status", "claimed")
    .order("claimed_at", { ascending: false });

  return (data ?? [])
    .filter((row) => isPackageKey(row.package_key))
    .map((row) => ({
      id: row.id,
      package_key: row.package_key as PackageKey,
      recipient_name: row.recipient_name ?? "",
      claimed_at: row.claimed_at,
    }));
}
