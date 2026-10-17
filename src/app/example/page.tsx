import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_example } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Our First Year \u2014 Example",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_example} />;
}
