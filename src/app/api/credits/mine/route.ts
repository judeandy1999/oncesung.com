import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ credits: [] });

  const { data } = await supabase
    .from("song_credits")
    .select("id, package_key, status, recipient_name, claimed_at")
    .eq("recipient_user_id", user.id)
    .eq("status", "claimed")
    .order("claimed_at", { ascending: false });

  return NextResponse.json({ credits: data ?? [] });
}
