import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PENDING_ORDER_COOKIE } from "@/lib/orders/pending-order-cookie";
import { finalizeCaptureHttpStatus, finalizePayPalCapture } from "@/lib/paypal/finalize-capture";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  paypalOrderId: z.string().trim().min(1).max(40),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "PayPal did not confirm the payment." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "PayPal did not confirm the payment." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again to finish payment." }, { status: 401 });

  const saved = await finalizePayPalCapture({
    orderId: parsed.data.orderId,
    paypalOrderId: parsed.data.paypalOrderId,
    userId: user.id,
  });
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: finalizeCaptureHttpStatus(saved.error) });
  }
  const response = NextResponse.json({ ok: true, orderId: saved.orderId });
  response.cookies.set(PENDING_ORDER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
