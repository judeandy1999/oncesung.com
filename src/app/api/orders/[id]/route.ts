import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPackageKey, packageByKey } from "@/lib/orders/catalog";

const patchSchema = z.object({
  packageKey: z.string(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "That order could not be found." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Could not read the package." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success || !isPackageKey(parsed.data.packageKey)) {
    return NextResponse.json({ error: "Choose a valid package." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your order." }, { status: 401 });

  const { data: order } = await supabase.from("orders").select("id, status, user_id").eq("id", id).maybeSingle();
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "That order could not be found." }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ error: "This song is already paid." }, { status: 409 });
  }

  const pkg = packageByKey(parsed.data.packageKey);
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ package_key: pkg.key, amount_cents: pkg.amountCents, currency: "USD" })
    .eq("id", id)
    .neq("status", "paid");
  if (error) return NextResponse.json({ error: "Could not save the package." }, { status: 500 });

  return NextResponse.json({ ok: true, packageKey: pkg.key, amountCents: pkg.amountCents });
}
