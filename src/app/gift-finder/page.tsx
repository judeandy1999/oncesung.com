import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_gift_finder } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Gift Finder Quiz",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_gift_finder} />;
}
