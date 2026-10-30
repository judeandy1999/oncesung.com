import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { GiftCardBuyForm } from "@/features/gift-cards/GiftCardBuyForm";
import { html_gift_cards } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Gift Cards",
  description: "Give a prepaid Oncesung song gift card.",
};

/** Hero + features from design HTML; live purchase form replaces the demo block at #buy. */
const heroAndFeatures = html_gift_cards.split('<section id="buy"')[0];

export default function GiftCardsPage() {
  return (
    <>
      <HtmlMain html={`${heroAndFeatures}</main>`} />
      <section id="buy" className="section-sm">
        <div className="container split" style={{ alignItems: "start" }}>
          <GiftCardBuyForm />
          <div>
            <h2>How it works</h2>
            <ol className="muted" style={{ paddingLeft: 20 }}>
              <li>You pay for Essential, Signature, or Concierge.</li>
              <li>They get an email and a site notification (if they already have an account).</li>
              <li>They claim the gift, create their song, and checkout without paying.</li>
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
