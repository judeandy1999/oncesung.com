import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_checkout_payment } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Secure payment",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_checkout_payment} />;
}
