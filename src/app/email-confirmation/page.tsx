import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_email_confirmation } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Confirmation email",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_email_confirmation} />;
}
