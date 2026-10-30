import type { Metadata } from "next";
import { AccountAreaLayout } from "@/components/AccountAreaLayout";
import { LegacyInteractivePage } from "@/components/LegacyInteractivePage";
import { REQUESTS_HTML } from "@/features/requests/requests-html";
import { REQUESTS_SCRIPT } from "@/features/requests/requests-script";
import { stripLegacyAccountShell } from "@/lib/account/legacy-shell";

export const metadata: Metadata = {
  title: "Revisions & Remakes",
  description: "Personalized songs for every occasion.",
};

export default async function RequestsPage() {
  return (
    <AccountAreaLayout active="requests" loginNext="/requests">
      <LegacyInteractivePage
        html={stripLegacyAccountShell(REQUESTS_HTML)}
        script={REQUESTS_SCRIPT}
        label="requests"
      />
    </AccountAreaLayout>
  );
}
