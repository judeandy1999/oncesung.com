import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });

  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, created_at")
    .eq("user_id", user.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(8);

  return NextResponse.json({ notifications: data ?? [] });
}
