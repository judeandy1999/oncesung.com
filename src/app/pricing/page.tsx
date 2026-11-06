import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_pricing } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Oncesung pricing: Essential $49, Signature $89, Concierge $149. Personalized songs written from your story.",
};

export default function Page() {
  return <HtmlMain html={html_pricing} />;
}
