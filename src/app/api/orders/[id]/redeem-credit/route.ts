import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { consumeCreditForOrder } from "@/lib/credits/record";
import { isPackageKey } from "@/lib/orders/catalog";

const bodySchema = z.object({
  creditId: z.string().uuid(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  if (!z.string().uuid().safeParse(orderId).success) {
    return NextResponse.json({ error: "That order could not be found." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Could not read the gift credit." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Choose a gift credit." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to use your gift." }, { status: 401 });

  const { data: order } = await supabase
    .from("orders")
    .select("id, package_key, status, user_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "That order could not be found." }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ ok: true, orderId });
  }
  if (!isPackageKey(order.package_key)) {
    return NextResponse.json({ error: "Choose a valid package." }, { status: 400 });
  }

  const applied = await consumeCreditForOrder({
    creditId: parsed.data.creditId,
    orderId: order.id,
    userId: user.id,
    packageKey: order.package_key,
  });
  if (!applied.ok) return NextResponse.json({ error: applied.error }, { status: 409 });
  return NextResponse.json({ ok: true, orderId: order.id });
}
