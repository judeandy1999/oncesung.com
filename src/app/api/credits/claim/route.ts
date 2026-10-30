import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { claimCredit, getCreditById } from "@/lib/credits/record";
import { notifyGiftCreditClaimed } from "@/lib/email/notify-credit";

const bodySchema = z.object({
  token: z.string().uuid(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Could not read the gift link." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "This gift link is not valid." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in to claim this gift." }, { status: 401 });

  const claimed = await claimCredit({
    token: parsed.data.token,
    userId: user.id,
    userEmail: user.email,
  });
  if (!claimed.ok) return NextResponse.json({ error: claimed.error }, { status: 409 });

  const credit = await getCreditById(claimed.creditId);
  if (credit) await notifyGiftCreditClaimed(credit, user.id);

  return NextResponse.json({ ok: true, creditId: claimed.creditId });
}
