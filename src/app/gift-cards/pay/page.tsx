import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { PayPalGiftCardCheckout } from "@/features/gift-cards/PayPalGiftCardCheckout";
import { requireUser } from "@/lib/auth/require-user";
import { getCreditById } from "@/lib/credits/record";
import { isPackageKey } from "@/lib/orders/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pay for gift card",
  robots: { index: false, follow: false },
};

export default async function GiftCardPayPage({ searchParams }: { searchParams: Promise<{ credit?: string }> }) {
  const { credit: creditId } = await searchParams;
  const next = creditId ? `/gift-cards/pay?credit=${encodeURIComponent(creditId)}` : "/gift-cards#buy";
  const user = await requireUser(next);
  if (!creditId || !z.string().uuid().safeParse(creditId).success) redirect("/gift-cards#buy");

  const credit = await getCreditById(creditId);
  if (!credit || credit.purchaser_user_id !== user.id) notFound();
  if (credit.status !== "pending") redirect(`/gift-cards/success?credit=${encodeURIComponent(credit.id)}`);

  const packageKey = isPackageKey(credit.package_key) ? credit.package_key : "signature";
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

  return (
    <main>
      <section>
        <div className="container" style={{ padding: "32px 0 64px", maxWidth: 720 }}>
          <PayPalGiftCardCheckout
            creditId={credit.id}
            clientId={clientId}
            packageKey={packageKey}
            recipientEmail={credit.recipient_email}
          />
        </div>
      </section>
    </main>
  );
}
