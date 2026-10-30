import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { CheckoutPaymentSummary } from "@/features/checkout/CheckoutPaymentSummary";
import { CheckoutStepperSection } from "@/features/checkout/CheckoutStepperSection";
import { GiftCreditPayment } from "@/features/checkout/GiftCreditPayment";
import { PayPalCheckout } from "@/features/checkout/PayPalCheckout";
import { requireUser } from "@/lib/auth/require-user";
import { isPackageKey } from "@/lib/orders/catalog";
import { PENDING_ORDER_COOKIE } from "@/lib/orders/pending-order-cookie";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pay with PayPal",
  description: "Pay for your Oncesung song with PayPal.",
  robots: { index: false, follow: false },
};

export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const next = order ? `/checkout/payment?order=${encodeURIComponent(order)}` : "/song-intake";
  await requireUser(next);

  if (!order || !z.string().uuid().safeParse(order).success) {
    const pending = (await cookies()).get(PENDING_ORDER_COOKIE)?.value;
    if (pending && z.string().uuid().safeParse(pending).success) {
      const supabase = await createClient();
      const { data: pendingOrder } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", pending)
        .maybeSingle();
      if (pendingOrder && pendingOrder.status !== "paid") {
        redirect(`/checkout/payment?order=${encodeURIComponent(pendingOrder.id)}`);
      }
    }

    return (
      <main>
        <section>
          <div className="container" style={{ padding: "32px 0 64px", maxWidth: 640 }}>
            <h1>Pay with PayPal</h1>
            <p className="muted">
              This step is not the old demo card form. After your story and contact details are saved, you land here
              with PayPal buttons for Essential ($49), Signature ($89), or Concierge ($149).
            </p>
            <ol className="muted" style={{ marginTop: 12, paddingLeft: 20 }}>
              <li>Sign in and complete your story (Create a New Song or checkout review).</li>
              <li>
                On <Link href="/checkout/details">Your details</Link>, submit the form — that creates a draft order.
              </li>
              <li>Pay with PayPal on this page, then see order confirmation and My Orders.</li>
            </ol>
            <div className="row" style={{ marginTop: 16 }}>
              <Link className="btn btn-primary" href="/checkout/details">
                Your details
              </Link>
              <Link className="btn" href="/song-intake">
                Create a New Song
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user: payer },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("orders")
    .select("id, package_key, status, recipient_name, occasion")
    .eq("id", order)
    .maybeSingle();
  const { data: giftCredits } = payer
    ? await supabase
        .from("song_credits")
        .select("id, package_key")
        .eq("recipient_user_id", payer.id)
        .eq("status", "claimed")
    : { data: [] };

  if (!data) notFound();
  if (data.status === "paid") redirect(`/order-confirmed?order=${encodeURIComponent(data.id)}`);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
  const packageKey = isPackageKey(data.package_key) ? data.package_key : "signature";

  return (
    <main>
      <section
        style={{
          padding: "8px 0 48px",
          background: "linear-gradient(180deg,#fff8f5,#fff1ec)",
        }}
      >
        <div className="container">
          <CheckoutStepperSection current={3} orderId={data.id} />
          <div className="split-r">
            <GiftCreditPayment
              orderId={data.id}
              packageKey={packageKey}
              credits={(giftCredits ?? []).filter((c) => isPackageKey(c.package_key)) as { id: string; package_key: typeof packageKey }[]}
            />
            <PayPalCheckout
              orderId={data.id}
              clientId={clientId}
              packageKey={packageKey}
              recipientName={data.recipient_name || ""}
              occasion={data.occasion || ""}
            />
            <CheckoutPaymentSummary
              packageKey={packageKey}
              recipientName={data.recipient_name || ""}
              occasion={data.occasion || ""}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
