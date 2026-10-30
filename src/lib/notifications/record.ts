import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function createNotification(input: {
  userId: string;
  kind: string;
  title: string;
  body: string;
  href: string;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: input.userId,
    kind: input.kind,
    title: input.title.slice(0, 200),
    body: input.body.slice(0, 1000),
    href: input.href.slice(0, 500),
  });
}

export async function listUnreadNotifications(userId: string, limit = 10) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("notifications")
    .select("id, kind, title, body, href, created_at")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
