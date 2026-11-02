import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { addAdminSongChangeMessage } from "@/lib/revisions/record";

const bodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Write a reply first." }, { status: 400 });
  }

  const result = await addAdminSongChangeMessage({
    requestId: id,
    body: parsed.data.body,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
