import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminSupportInbox } from "@/features/admin/AdminSupportInbox";
import { requireUser } from "@/lib/auth/require-user";
import { isAdminConfigured, isAdminEmail } from "@/lib/orders/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer messages",
  description: "Reply to paid song and general customer inquiries.",
  robots: { index: false, follow: false },
};

export default async function AdminMessagesPage() {
  const user = await requireUser("/admin/messages");
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

  return (
    <main>
      <section>
        <div className="container" style={{ padding: "32px 0 64px" }}>
          <h1>Customer messages</h1>
          <p className="muted">Real-time chat from the site widget. Paid song threads are tied to a customer order.</p>
          <AdminSupportInbox />
          <p style={{ marginTop: 24 }}>
            <Link href="/admin/orders">Song orders</Link>
            {" · "}
            <Link href="/dashboard">My Orders</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
