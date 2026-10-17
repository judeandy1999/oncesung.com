import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_share } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Share your song",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_share} />;
}
