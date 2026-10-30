import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCreditById } from "@/lib/credits/record";
import { centsToPayPalValue, packageByKey } from "@/lib/orders/catalog";
import { createPayPalOrder, paypalConfigured } from "@/lib/paypal/client";

const bodySchema = z.object({
  creditId: z.string().uuid(),
});

export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "PayPal is not set up yet." }, { status: 503 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Could not start PayPal." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Could not start PayPal." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to pay." }, { status: 401 });

  const credit = await getCreditById(parsed.data.creditId);
  if (!credit || credit.purchaser_user_id !== user.id) {
    return NextResponse.json({ error: "That gift card could not be found." }, { status: 404 });
  }
  if (credit.status !== "pending") {
    return NextResponse.json({ error: "This gift card was already paid." }, { status: 409 });
  }

  const pkg = packageByKey(credit.package_key);
  try {
    const paypalOrderId = await createPayPalOrder({
      customId: `credit:${credit.id}`,
      value: centsToPayPalValue(pkg.amountCents),
      description: `Oncesung ${pkg.name} gift card`,
    });
    const admin = createAdminClient();
    const { error } = await admin
      .from("song_credits")
      .update({ paypal_order_id: paypalOrderId })
      .eq("id", credit.id)
      .eq("status", "pending");
    if (error) return NextResponse.json({ error: "Could not start PayPal." }, { status: 500 });
    return NextResponse.json({ id: paypalOrderId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not start PayPal." }, { status: 500 });
  }
}
