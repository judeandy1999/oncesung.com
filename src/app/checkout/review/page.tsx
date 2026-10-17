import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_checkout_review } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Review your order",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_checkout_review} />;
}
