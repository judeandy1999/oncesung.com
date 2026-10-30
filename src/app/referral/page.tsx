import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Refer a Friend",
  description: "Referral rewards are coming soon.",
  robots: { index: false, follow: true },
};

export default function ReferralPage() {
  return (
    <ComingSoonPage
      title="Refer a friend"
      lead="Share Oncesung with someone you love and earn rewards when they order — this program isn’t live yet."
    />
  );
}
