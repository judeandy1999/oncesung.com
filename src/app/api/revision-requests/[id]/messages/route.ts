import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { listSongChangeRequestsForSession } from "@/lib/revisions/queries";
import { addCustomerSongChangeMessage } from "@/lib/revisions/record";

const bodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "That conversation could not be found." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Could not read your message." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to reply." }, { status: 401 });
  }

  const result = await addCustomerSongChangeMessage({
    userId: user.id,
    requestId: id,
    body: parsed.data.body,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const requests = await listSongChangeRequestsForSession();
  return NextResponse.json({ ok: true, requests });
}
