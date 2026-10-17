import type { Metadata } from "next";
import { LegacyInteractivePage } from "@/components/LegacyInteractivePage";
import { REQUESTS_HTML } from "@/features/requests/requests-html";
import { REQUESTS_SCRIPT } from "@/features/requests/requests-script";

export const metadata: Metadata = {
  title: "Revisions & Remakes",
  description: "Personalized songs for every occasion.",
};

export default function RequestsPage() {
  return (
    <LegacyInteractivePage html={REQUESTS_HTML} script={REQUESTS_SCRIPT} label="requests" />
  );
}
