import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DigitalGiftCard } from "@/features/gift-cards/DigitalGiftCard";
import { requireUser } from "@/lib/auth/require-user";
import { getCreditById } from "@/lib/credits/record";
import { qrDataUrlForLink } from "@/lib/credits/qr";
import { redeemUrlForClaimToken } from "@/lib/credits/redeem-url";
import { isPackageKey } from "@/lib/orders/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Share your gift card",
  robots: { index: false, follow: false },
};

export default async function DigitalGiftCardPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/gift-cards/sent");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const credit = await getCreditById(id);
  if (!credit || credit.purchaser_user_id !== user.id) notFound();

  const packageKey = isPackageKey(credit.package_key) ? credit.package_key : "signature";
  const showShare = credit.status !== "pending" && credit.status !== "cancelled";
  const redeemUrl = showShare ? redeemUrlForClaimToken(credit.claim_token) : "";
  const qrDataUrl = showShare ? await qrDataUrlForLink(redeemUrl) : null;

  return (
    <main>
      <section style={{ padding: "32px 0 64px" }}>
        <div className="container" style={{ maxWidth: 520 }}>
          <Link className="back xs" href="/gift-cards/sent">
            ← Gifts you sent
          </Link>
          <DigitalGiftCard
            creditId={credit.id}
            packageKey={packageKey}
            amountCents={credit.amount_cents}
            recipientName={credit.recipient_name}
            recipientEmail={credit.recipient_email}
            message={credit.personal_message}
            redeemUrl={redeemUrl}
            qrDataUrl={qrDataUrl}
            status={credit.status}
            showShare={showShare}
          />
        </div>
      </section>
    </main>
  );
}
