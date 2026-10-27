import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

const postSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  try {
    const admin = createAdminClient();
    const { data: conversation } = await admin
      .from("support_conversations")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const { data: messages, error } = await admin
      .from("support_messages")
      .select("id, conversation_id, sender_role, body, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
    }

    return NextResponse.json({ messages: messages ?? [] });
  } catch {
    return NextResponse.json({ error: "Support chat is not available." }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a message." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: conversation } = await admin
      .from("support_conversations")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const { data: message, error } = await admin
      .from("support_messages")
      .insert({
        conversation_id: id,
        sender_role: "admin",
        body: parsed.data.body,
      })
      .select("id, conversation_id, sender_role, body, created_at")
      .single();

    if (error || !message) {
      return NextResponse.json({ error: "Could not send message." }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: "Support chat is not available." }, { status: 503 });
  }
}
