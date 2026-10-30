import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { finalizeCreditPayPalCapture } from "@/lib/paypal/finalize-credit-capture";
import { finalizeCaptureHttpStatus } from "@/lib/paypal/finalize-capture";

const bodySchema = z.object({
  creditId: z.string().uuid(),
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

  const saved = await finalizeCreditPayPalCapture({
    creditId: parsed.data.creditId,
    paypalOrderId: parsed.data.paypalOrderId,
    userId: user.id,
  });
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: finalizeCaptureHttpStatus(saved.error) });
  }
  return NextResponse.json({ ok: true, creditId: saved.creditId });
}
