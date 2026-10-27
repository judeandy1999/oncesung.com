import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  kind: z.enum(["general", "paid_song", "all"]).optional(),
});

export async function GET(request: Request) {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const url = new URL(request.url);
  const rawKind = url.searchParams.get("kind");
  const parsed = querySchema.safeParse({ kind: rawKind ?? undefined });
  if (!parsed.success || !parsed.data.kind || parsed.data.kind === "all") {
    return NextResponse.json({ error: "Choose general or paid_song." }, { status: 400 });
  }
  const kind = parsed.data.kind;

  try {
    const admin = createAdminClient();
    let query = admin
      .from("support_conversations")
      .select("id, user_id, kind, order_id, song_title, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (kind === "general") query = query.eq("kind", "general");
    if (kind === "paid_song") query = query.eq("kind", "paid_song");

    const { data: conversations, error } = await query;
    if (error) {
      return NextResponse.json({ error: "Could not load conversations." }, { status: 500 });
    }

    const rows = conversations ?? [];
    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const convIds = rows.map((row) => row.id);

    const { data: profiles } = userIds.length
      ? await admin.from("profiles").select("id, email, full_name").in("id", userIds)
      : { data: [] as { id: string; email: string | null; full_name: string | null }[] };

    const people = new Map((profiles ?? []).map((p) => [p.id, p]));

    const lastByConv = new Map<string, { body: string; created_at: string; sender_role: string }>();
    if (convIds.length) {
      const { data: messages } = await admin
        .from("support_messages")
        .select("conversation_id, body, created_at, sender_role")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      for (const msg of messages ?? []) {
        if (!lastByConv.has(msg.conversation_id)) {
          lastByConv.set(msg.conversation_id, msg);
        }
      }
    }

    return NextResponse.json({
      conversations: rows.map((row) => {
        const person = people.get(row.user_id);
        const last = lastByConv.get(row.id);
        return {
          ...row,
          customer_name: person?.full_name || "Customer",
          customer_email: person?.email ?? null,
          last_message: last?.body ?? null,
          last_message_at: last?.created_at ?? row.updated_at,
          last_sender_role: last?.sender_role ?? null,
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Support chat is not set up yet. Run the support_messages SQL migration." },
      { status: 503 },
    );
  }
}
