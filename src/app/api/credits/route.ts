import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/credits/record";
import { isPackageKey, packageByKey } from "@/lib/orders/catalog";

const bodySchema = z.object({
  packageKey: z.string(),
  recipientName: z.string().max(200).optional(),
  recipientEmail: z.string().email().max(254),
  personalMessage: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Could not read the gift card form." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success || !isPackageKey(parsed.data.packageKey)) {
    return NextResponse.json({ error: "Choose a valid gift card amount." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to buy a gift card." }, { status: 401 });

  const pkg = packageByKey(parsed.data.packageKey);
  const recipientEmail = normalizeEmail(parsed.data.recipientEmail);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("song_credits")
      .insert({
        purchaser_user_id: user.id,
        package_key: pkg.key,
        amount_cents: pkg.amountCents,
        currency: "USD",
        status: "pending",
        recipient_email: recipientEmail,
        recipient_name: (parsed.data.recipientName ?? "").trim().slice(0, 200),
        personal_message: (parsed.data.personalMessage ?? "").trim().slice(0, 500),
      })
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: "Could not save the gift card." }, { status: 500 });
    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not save the gift card." }, { status: 500 });
  }
}
