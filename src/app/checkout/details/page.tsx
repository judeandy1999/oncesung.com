import type { Metadata } from "next";
import { cookies } from "next/headers";
import { sanitizeContactPrefill } from "@/features/checkout/contact-demo";
import { CheckoutDetailsForm } from "@/features/checkout/CheckoutDetailsForm";
import { GiftCreditsNotice } from "@/features/gift-cards/GiftCreditsNotice";
import { getOwnProfile } from "@/lib/account/profile";
import { requireUser } from "@/lib/auth/require-user";
import { listClaimedCreditsForSession } from "@/lib/credits/queries";
import { PENDING_ORDER_COOKIE } from "@/lib/orders/pending-order-cookie";

export const metadata: Metadata = {
  title: "Your details",
  description: "Personalized songs for every occasion.",
};

export default async function CheckoutDetailsPage() {
  await requireUser("/checkout/details");
  const [profile, credits] = await Promise.all([getOwnProfile(), listClaimedCreditsForSession()]);
  const prefill = sanitizeContactPrefill(profile?.email, profile?.fullName);
  const pendingOrderId = (await cookies()).get(PENDING_ORDER_COOKIE)?.value ?? null;
  return (
    <>
      {credits.length > 0 ? (
        <div className="container" style={{ paddingTop: 16 }}>
          <GiftCreditsNotice credits={credits} />
        </div>
      ) : null}
      <CheckoutDetailsForm
      accountName={prefill.fullName}
      accountEmail={prefill.email}
      pendingOrderId={pendingOrderId}
    />
    </>
  );
}
