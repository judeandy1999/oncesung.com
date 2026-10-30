import type { Metadata } from "next";
import Link from "next/link";
import { AccountSidebar } from "@/components/AccountSidebar";
import { SentGiftsList } from "@/features/gift-cards/SentGiftsList";
import { getOwnProfile } from "@/lib/account/profile";
import { requireUser } from "@/lib/auth/require-user";
import { listSentCreditsForSession } from "@/lib/credits/queries";
import { isAdminConfigured, isAdminEmail } from "@/lib/orders/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gifts you sent",
  robots: { index: false, follow: false },
};

export default async function SentGiftsPage() {
  const user = await requireUser("/gift-cards/sent");
  const [profile, gifts] = await Promise.all([getOwnProfile(), listSentCreditsForSession()]);
  const name = profile?.fullName || user.email || "Your account";
  const email = profile?.email || user.email || "";
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const showAdmin = isAdminConfigured() && isAdminEmail(user.email);

  return (
    <main>
      <section style={{ padding: "28px 0 48px" }}>
        <div className="container orders-layout">
          <AccountSidebar name={name} email={email} initial={initial} active="gift-sent" showAdmin={showAdmin} />
          <div>
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
          </div>
        </div>
      </section>
    </main>
  );
}
