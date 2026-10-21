import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_dashboard } from "@/data/page-content";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Personalized songs for every occasion.",
};

export default async function Page() {
  await requireUser("/dashboard");
  return <HtmlMain html={html_dashboard} />;
}
