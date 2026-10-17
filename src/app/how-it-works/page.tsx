import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_how_it_works } from "@/data/page-content";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_how_it_works} />;
}
