import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_downloads } from "@/data/page-content";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Download your song",
  description: "Personalized songs for every occasion.",
};

export default async function Page() {
  await requireUser("/downloads");
  return <HtmlMain html={html_downloads} />;
}
