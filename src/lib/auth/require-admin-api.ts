import "server-only";
import { NextResponse } from "next/server";
import { isAdminConfigured, isAdminEmail } from "@/lib/orders/admin";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function requireAdminApi(): Promise<
  { user: User; error: null } | { user: null; error: NextResponse }
> {
  if (!isAdminConfigured()) {
    return {
      user: null,
      error: NextResponse.json({ error: "Admin is not configured." }, { status: 503 }),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }
  if (!isAdminEmail(user.email)) {
    return { user: null, error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { user, error: null };
}
