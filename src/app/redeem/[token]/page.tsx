import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { RedeemGiftClient } from "@/features/redeem/RedeemGiftClient";
import { getCreditByClaimToken } from "@/lib/credits/record";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isPackageKey } from "@/lib/orders/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claim your song gift",
  robots: { index: false, follow: false },
};

export default async function RedeemGiftPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.string().uuid().safeParse(token).success) notFound();

  const credit = await getCreditByClaimToken(token);
  if (!credit || credit.status === "pending" || credit.status === "cancelled") notFound();
  if (credit.status === "consumed") {
    return (
      <main>
        <section>
          <div className="container" style={{ padding: "48px 0" }}>
            <div className="card pad-lg" style={{ maxWidth: 560, margin: "0 auto" }}>
              <h1>This gift was already used</h1>
              <p className="muted">The song from this gift card has already been created.</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let purchaserLabel = "Someone special";
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", credit.purchaser_user_id)
      .maybeSingle();
    purchaserLabel = (profile?.full_name || profile?.email || purchaserLabel).trim();
  } catch {
    /* optional */
  }

  const packageKey = isPackageKey(credit.package_key) ? credit.package_key : "signature";
  const alreadyClaimed =
    credit.status === "claimed" && Boolean(user && credit.recipient_user_id === user.id);

  return (
    <main>
      <section>
        <div className="container" style={{ padding: "48px 0" }}>
          <RedeemGiftClient
            token={token}
            packageKey={packageKey}
            recipientName={credit.recipient_name}
            recipientEmail={credit.recipient_email}
            purchaserLabel={purchaserLabel}
            message={credit.personal_message}
            signedIn={Boolean(user)}
            signedInEmail={user?.email ?? null}
            alreadyClaimed={alreadyClaimed}
            creditId={credit.status === "claimed" ? credit.id : null}
          />
        </div>
      </section>
    </main>
  );
}
