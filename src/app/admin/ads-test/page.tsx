import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAdsConversionTest } from "@/features/admin/AdminAdsConversionTest";
import { requireUser } from "@/lib/auth/require-user";
import { isAdminConfigured, isAdminEmail } from "@/lib/orders/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ads conversion test",
  robots: { index: false, follow: false },
};

export default async function AdminAdsTestPage() {
  if (!isAdminConfigured()) notFound();

  await requireUser("/admin/ads-test");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) notFound();

  return (
    <main>
      <section>
        <div className="container" style={{ padding: "48px 0" }}>
          <Link className="back" href="/admin/orders">
            ← Admin orders
          </Link>
          <h1 style={{ fontSize: 32, marginTop: 12 }}>Google Ads conversion test</h1>
          <p className="muted">Signed in as {user?.email}</p>
          <div style={{ marginTop: 20 }}>
            <AdminAdsConversionTest />
          </div>
        </div>
      </section>
    </main>
  );
}
