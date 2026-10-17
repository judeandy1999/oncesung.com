import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_examples } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Song Examples",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_examples} />;
}
