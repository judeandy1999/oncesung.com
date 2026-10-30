import type { Metadata } from "next";
import Link from "next/link";
import { AccountAreaLayout } from "@/components/AccountAreaLayout";
import { SentGiftsList } from "@/features/gift-cards/SentGiftsList";
import { listSentCreditsForSession } from "@/lib/credits/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gifts you sent",
  robots: { index: false, follow: false },
};

export default async function SentGiftsPage() {
  const gifts = await listSentCreditsForSession();

  return (
    <AccountAreaLayout active="gift-sent" loginNext="/gift-cards/sent">
      <div className="row between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 38, margin: 0 }}>Gifts you sent</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Share the digital card or QR code after payment.
          </p>
        </div>
        <Link className="btn btn-primary" href="/gift-cards#buy">
          Buy another
        </Link>
      </div>
      <SentGiftsList gifts={gifts} />
    </AccountAreaLayout>
  );
}
