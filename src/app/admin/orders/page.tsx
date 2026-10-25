import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { isAdminConfigured, isAdminEmail } from "@/lib/orders/admin";
import { formatCents, packageByKey } from "@/lib/orders/catalog";
import { AdminOrderPanel } from "@/features/admin/AdminOrderPanel";
import { storyBriefSections } from "@/lib/orders/story";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders",
  description: "Upload finished songs for paid orders.",
  robots: { index: false, follow: false },
};

type AdminOrder = {
  id: string;
  user_id: string;
  package_key: string;
  amount_cents: number;
  recipient_name: string;
  occasion: string;
  paid_at: string | null;
  story: unknown;
  song_filename: string | null;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; uploaded?: string }>;
}) {
  const user = await requireUser("/admin/orders");
  const notice = await searchParams;
  if (!isAdminConfigured()) {
    return (
      <main>
        <section>
          <div className="container" style={{ padding: "48px 0" }}>
            <h1>Admin is not configured</h1>
            <p className="muted">Set ADMIN_EMAIL to the email you use to sign in, then open this page again.</p>
          </div>
        </section>
      </main>
    );
  }
  if (!isAdminEmail(user.email)) notFound();

  let orders: AdminOrder[] = [];
  let people = new Map<string, { id: string; email: string | null; full_name: string | null }>();
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("orders")
      .select("id, user_id, package_key, amount_cents, recipient_name, occasion, paid_at, story, song_filename")
      .eq("status", "paid")
      .order("paid_at", { ascending: false });
    orders = (data ?? []) as AdminOrder[];
    const userIds = [...new Set(orders.map((order) => order.user_id))];
    const { data: profiles } = userIds.length
      ? await admin.from("profiles").select("id, email, full_name").in("id", userIds)
      : { data: [] as { id: string; email: string | null; full_name: string | null }[] };
    people = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  } catch (err) {
    console.error(err);
    return (
      <main>
        <section>
          <div className="container" style={{ padding: "48px 0" }}>
            <h1>Orders cannot be loaded</h1>
            <p className="muted">Add SUPABASE_SERVICE_ROLE_KEY and run the orders SQL in Supabase, then reload this page.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section>
        <div className="container" style={{ padding: "32px 0 64px" }}>
          <h1>Paid orders</h1>
          <p className="muted">Upload the finished song onto the order the customer paid for. They can then play and download it from My Orders.</p>
          {notice.error ? <p>{notice.error}</p> : null}
          {notice.uploaded ? <p>Song uploaded. The customer can play it from My Orders.</p> : null}
          {orders.length === 0 ? (
            <div className="card pad">
              <p className="muted" style={{ margin: 0 }}>
                No paid orders yet.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const pkg = packageByKey(order.package_key);
              const person = people.get(order.user_id);
              const briefSections = storyBriefSections(order.story);
              return (
                <AdminOrderPanel
                  key={order.id}
                  orderId={order.id}
                  title={order.recipient_name ? `Song for ${order.recipient_name}` : "Song order"}
                  meta={`${person?.full_name || "Customer"} · ${person?.email || "No email"} · ${pkg.name} · ${formatCents(order.amount_cents)}${order.occasion ? ` · ${order.occasion}` : ""}`}
                  badge={{
                    label: order.song_filename ? "File uploaded" : "Waiting for file",
                    green: Boolean(order.song_filename),
                  }}
                  briefSections={briefSections}
                  hasFile={Boolean(order.song_filename)}
                />
              );
            })
          )}
          <p>
            <Link href="/dashboard">My Orders</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
