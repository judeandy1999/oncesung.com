import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  listEligibleRevisionOrders,
  listSongChangeRequestsForSession,
} from "@/lib/revisions/queries";
import { createSongChangeRequest } from "@/lib/revisions/record";

const postSchema = z.object({
  orderId: z.string().uuid(),
  requestType: z.enum(["revision", "remake"]),
  fields: z.record(z.string(), z.string()),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view revision requests." }, { status: 401 });
  }

  const [eligibleOrders, requests] = await Promise.all([
    listEligibleRevisionOrders(),
    listSongChangeRequestsForSession(),
  ]);

  return NextResponse.json({ eligibleOrders, requests });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Could not read the form." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to send a request." }, { status: 401 });
  }

  const result = await createSongChangeRequest({
    userId: user.id,
    orderId: parsed.data.orderId,
    requestType: parsed.data.requestType,
    fields: parsed.data.fields,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const requests = await listSongChangeRequestsForSession();
  return NextResponse.json({ ok: true, id: result.id, requests });
}
