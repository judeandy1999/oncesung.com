import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_dashboard } from "@/data/page-content";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_dashboard} />;
}
