import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PENDING_ORDER_COOKIE, pendingOrderCookieOptions } from "@/lib/orders/pending-order-cookie";
import { packageByKey } from "@/lib/orders/catalog";
import { isStoryWithinLimit, occasionFromStory, recipientFromStory } from "@/lib/orders/story";

const bodySchema = z.object({
  story: z.unknown(),
  packageKey: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "The story could not be read." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success || !parsed.data.story || typeof parsed.data.story !== "object" || Array.isArray(parsed.data.story)) {
    return NextResponse.json({ error: "The story could not be read." }, { status: 400 });
  }
  if (!isStoryWithinLimit(parsed.data.story)) {
    return NextResponse.json({ error: "That story is too long to save." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to save your song." }, { status: 401 });

  const pkg = packageByKey(parsed.data.packageKey);
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        package_key: pkg.key,
        amount_cents: pkg.amountCents,
        currency: "USD",
        status: "draft",
        recipient_name: recipientFromStory(parsed.data.story),
        occasion: occasionFromStory(parsed.data.story),
        story: parsed.data.story,
      })
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: "Could not save your story." }, { status: 500 });
    const response = NextResponse.json({ id: data.id });
    response.cookies.set(PENDING_ORDER_COOKIE, data.id, pendingOrderCookieOptions);
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not save your story." }, { status: 500 });
  }
}
