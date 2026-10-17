import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_affiliates } from "@/data/page-content";
import { AffiliatesEnhancer } from "@/features/affiliates/AffiliatesEnhancer";

export const metadata: Metadata = {
  title: "Affiliate Partners",
  description: "Partner with Oncesung. Earn commission by sharing personalized, AI-created songs with your audience.",
};

export default function Page() {
  return (
    <>
      <HtmlMain html={html_affiliates} />
      <AffiliatesEnhancer />
    </>
  );
}
