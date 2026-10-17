import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_home } from "@/data/page-content";

export const metadata: Metadata = {
  title: "Personalized songs for every occasion",
  description: "Personalized songs for every occasion.",
};

export default function Page() {
  return <HtmlMain html={html_home} />;
}
