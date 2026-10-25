import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { centsToPayPalValue, packageByKey } from "@/lib/orders/catalog";
import { getOrderById } from "@/lib/orders/record";
import { createPayPalOrder, paypalConfigured } from "@/lib/paypal/client";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  packageKey: z.string().optional(),
});

export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "PayPal is not set up yet." }, { status: 503 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Choose a package and try again." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Choose a package and try again." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to pay." }, { status: 401 });

  const order = await getOrderById(parsed.data.orderId);
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "That order could not be found." }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ error: "This song is already paid." }, { status: 409 });
  }

  const pkg = packageByKey(parsed.data.packageKey ?? order.package_key);
  try {
    const admin = createAdminClient();
    const { error: priceError } = await admin
      .from("orders")
      .update({ package_key: pkg.key, amount_cents: pkg.amountCents, currency: "USD" })
      .eq("id", order.id)
      .neq("status", "paid");
    if (priceError) return NextResponse.json({ error: "Could not start PayPal." }, { status: 500 });

    const paypalOrderId = await createPayPalOrder({
      orderId: order.id,
      value: centsToPayPalValue(pkg.amountCents),
      description: `Oncesung ${pkg.name} song`,
    });
    const { error: saveError } = await admin
      .from("orders")
      .update({ status: "pending", paypal_order_id: paypalOrderId })
      .eq("id", order.id)
      .neq("status", "paid");
    if (saveError) return NextResponse.json({ error: "Could not start PayPal." }, { status: 500 });
    return NextResponse.json({ id: paypalOrderId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not start PayPal." }, { status: 500 });
  }
}
