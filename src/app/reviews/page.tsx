import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_reviews } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Our Promise",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_reviews} />;
}
