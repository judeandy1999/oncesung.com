import type { Metadata } from "next";
import Link from "next/link";
import { PurchaseConversionTracker } from "@/features/analytics/PurchaseConversionTracker";
import { requireUser } from "@/lib/auth/require-user";
import { formatCents, packageByKey } from "@/lib/orders/catalog";
import { getOwnOrder } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment",
  description: "A payment is confirmed here only after PayPal completes it.",
  robots: { index: false, follow: false },
};

function paidDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function OrderConfirmedPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const next = order ? `/order-confirmed?order=${encodeURIComponent(order)}` : "/order-confirmed";
  await requireUser(next);
  const paid = order ? await getOwnOrder(order) : null;

  if (!paid) {
    return (
      <main>
        <section>
          <div className="container" style={{ padding: "48px 0" }}>
            <h1>No payment was confirmed</h1>
            <p className="muted">This page confirms an order only after PayPal has completed the payment.</p>
            <Link className="btn btn-primary" href="/dashboard">
              My Orders
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const pkg = packageByKey(paid.package_key);
  return (
    <main>
      <PurchaseConversionTracker
        orderId={paid.id}
        amountCents={paid.amount_cents}
        currency={paid.currency || "USD"}
      />
      <section>
        <div className="container" style={{ padding: "48px 0" }}>
          <span className="badge green">Paid</span>
          <h1>Your payment is confirmed</h1>
          <p className="muted">
            {paid.recipient_name ? `Song for ${paid.recipient_name}` : "Your song"}
            {paid.occasion ? ` · ${paid.occasion}` : ""} · {pkg.name} · {formatCents(paid.amount_cents)}
            {paid.paid_at ? ` · ${paidDate(paid.paid_at)}` : ""}
          </p>
          <p>The song is paid and waiting. It will appear on My Orders after the finished file is uploaded.</p>
          <Link className="btn btn-primary" href="/dashboard">
            Go to My Orders
          </Link>
        </div>
      </section>
    </main>
  );
}
