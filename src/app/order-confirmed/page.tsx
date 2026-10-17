import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_order_confirmed } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_order_confirmed} />;
}
