import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_referral } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Refer a Friend",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_referral} />;
}
