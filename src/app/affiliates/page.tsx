import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Affiliate Partners",
  description: "The Oncesung partner program is opening soon.",
  robots: { index: false, follow: true },
};

export default function AffiliatesPage() {
  return (
    <ComingSoonPage
      title="Partner program"
      lead="Creators, bloggers, and wedding pros will soon be able to earn commission by sharing personalized songs with their audience."
      eyebrow="Opening soon"
    />
  );
}
