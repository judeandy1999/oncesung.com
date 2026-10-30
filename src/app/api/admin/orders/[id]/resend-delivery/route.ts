import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/orders/admin";
import { notifySongReady } from "@/lib/email/notify";
import { ensureGiftAccessToken } from "@/lib/orders/gift-access";
import { getOrderById } from "@/lib/orders/record";

const paramsSchema = z.string().uuid();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const back = new URL("/admin/orders", request.url);
  if (!paramsSchema.safeParse(id).success) {
    back.searchParams.set("error", "That order could not be found.");
    return NextResponse.redirect(back);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", "/admin/orders");
    return NextResponse.redirect(login);
  }
  if (!isAdminEmail(user.email)) {
    back.searchParams.set("error", "Only the site owner can resend delivery emails.");
    return NextResponse.redirect(back);
  }

  const order = await getOrderById(id);
  if (!order || order.status !== "paid" || !order.song_storage_path) {
    back.searchParams.set("error", "Upload a song before resending delivery emails.");
    return NextResponse.redirect(back);
  }

  await ensureGiftAccessToken(order.id);
  const ready = await getOrderById(id);
  if (!ready) {
    back.searchParams.set("error", "That order could not be found.");
    return NextResponse.redirect(back);
  }

  const result = await notifySongReady(ready);
  back.searchParams.set("resent", id);
  if (result.buyerSent) back.searchParams.set("buyer", "1");
  if (result.giftSent) back.searchParams.set("gift", "1");
  if (result.issues.length) back.searchParams.set("delivery", result.issues.join(" · "));
  return NextResponse.redirect(back);
}
