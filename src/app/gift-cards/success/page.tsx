import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getCreditById } from "@/lib/credits/record";
import { siteOriginForEmail } from "@/lib/email/config";
import { packageByKey, isPackageKey } from "@/lib/orders/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gift card sent",
  robots: { index: false, follow: false },
};

export default async function GiftCardSuccessPage({ searchParams }: { searchParams: Promise<{ credit?: string }> }) {
  const { credit: creditId } = await searchParams;
  const user = await requireUser("/gift-cards#buy");
  if (!creditId || !z.string().uuid().safeParse(creditId).success) notFound();

  const credit = await getCreditById(creditId);
  if (!credit || credit.purchaser_user_id !== user.id) notFound();
  if (credit.status === "pending") notFound();

  const pkg = packageByKey(isPackageKey(credit.package_key) ? credit.package_key : "signature");
  const redeemUrl = `${siteOriginForEmail()}/redeem/${credit.claim_token}`;

  return (
    <main>
      <section>
        <div className="container" style={{ padding: "48px 0", maxWidth: 640 }}>
          <span className="badge green">Paid</span>
          <h1>Gift card sent</h1>
          <p className="muted">
            We emailed {credit.recipient_email} a link to claim their {pkg.name} song ({credit.recipient_name || "your recipient"}).
          </p>
          <p className="xs muted" style={{ wordBreak: "break-all" }}>
            Redeem link: {redeemUrl}
          </p>
          <div className="row" style={{ gap: 8, marginTop: 16 }}>
            <Link className="btn btn-primary" href={`/gift-cards/card/${encodeURIComponent(credit.id)}`}>
              Open digital card & QR
            </Link>
            <Link className="btn btn-outline" href="/gift-cards/sent">
              All gifts I sent
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
