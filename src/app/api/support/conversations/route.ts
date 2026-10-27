import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { SupportInquiryKind } from "@/lib/support/types";

const openSchema = z.object({
  kind: z.enum(["general", "paid_song"]),
  orderId: z.string().uuid().optional(),
  songTitle: z.string().max(200).optional(),
});

async function findConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  kind: SupportInquiryKind,
  orderId: string | null,
) {
  let query = supabase
    .from("support_conversations")
    .select("id, user_id, kind, order_id, song_title, created_at, updated_at")
    .eq("user_id", userId)
    .eq("kind", kind);

  if (orderId) query = query.eq("order_id", orderId);
  else query = query.is("order_id", null);

  const { data, error } = await query.maybeSingle();
  if (error) return { error, conversation: null };
  return { error: null, conversation: data };
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = openSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid conversation request." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to message us." }, { status: 401 });
  }

  const { kind, orderId, songTitle } = parsed.data;
  const title = (songTitle ?? "").trim().slice(0, 200);

  if (kind === "paid_song") {
    if (!orderId) {
      return NextResponse.json({ error: "An order is required for this inquiry." }, { status: 400 });
    }
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, recipient_name")
      .eq("id", orderId)
      .maybeSingle();
    if (!order || order.status !== "paid") {
      return NextResponse.json({ error: "That order could not be found." }, { status: 404 });
    }
    const resolvedTitle = title || order.recipient_name || "Your song";
    const existing = await findConversation(supabase, user.id, kind, orderId);
    if (existing.error) {
      return NextResponse.json({ error: "Could not open this conversation." }, { status: 500 });
    }
    if (existing.conversation) {
      return NextResponse.json({ conversation: existing.conversation });
    }

    const { data: created, error } = await supabase
      .from("support_conversations")
      .insert({
        user_id: user.id,
        kind,
        order_id: orderId,
        song_title: resolvedTitle,
      })
      .select("id, user_id, kind, order_id, song_title, created_at, updated_at")
      .single();

    if (error || !created) {
      return NextResponse.json({ error: "Could not start this conversation." }, { status: 500 });
    }
    return NextResponse.json({ conversation: created });
  }

  const existing = await findConversation(supabase, user.id, "general", null);
  if (existing.error) {
    return NextResponse.json({ error: "Could not open this conversation." }, { status: 500 });
  }
  if (existing.conversation) {
    return NextResponse.json({ conversation: existing.conversation });
  }

  const { data: created, error } = await supabase
    .from("support_conversations")
    .insert({
      user_id: user.id,
      kind: "general",
      order_id: null,
      song_title: "",
    })
    .select("id, user_id, kind, order_id, song_title, created_at, updated_at")
    .single();

  if (error || !created) {
    return NextResponse.json({ error: "Could not start this conversation." }, { status: 500 });
  }
  return NextResponse.json({ conversation: created });
}
