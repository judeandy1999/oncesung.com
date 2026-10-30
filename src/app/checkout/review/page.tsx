import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { GiftCreditsNotice } from "@/features/gift-cards/GiftCreditsNotice";
import { html_checkout_review } from "@/data/page-content";
import { requireUser } from "@/lib/auth/require-user";
import { listClaimedCreditsForSession } from "@/lib/credits/queries";

export const metadata: Metadata = {
  title: "Review your order",
  description: "Personalized songs for every occasion.",
};

export default async function CheckoutReviewPage() {
  await requireUser("/checkout/review");
  const credits = await listClaimedCreditsForSession();

  return (
    <>
      {credits.length > 0 ? (
        <div className="container" style={{ paddingTop: 20, paddingBottom: 0 }}>
          <GiftCreditsNotice credits={credits} />
        </div>
      ) : null}
      <HtmlMain html={html_checkout_review} />
    </>
  );
}
