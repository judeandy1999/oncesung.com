import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_gift_cards } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Gift Cards",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_gift_cards} />;
}
