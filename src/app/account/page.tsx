import type { Metadata } from "next";
import { AccountAreaLayout } from "@/components/AccountAreaLayout";
import { LegacyInteractivePage } from "@/components/LegacyInteractivePage";
import { ACCOUNT_HTML } from "@/features/account/account-html";
import { ACCOUNT_SCRIPT } from "@/features/account/account-script";
import { withAccountProfile } from "@/features/account/with-account-profile";
import { getOwnProfile } from "@/lib/account/profile";
import { stripLegacyAccountShell } from "@/lib/account/legacy-shell";

export const metadata: Metadata = {
  title: "My Account",
  description: "Personalized songs for every occasion.",
};

export default async function AccountPage() {
  const profile = (await getOwnProfile()) ?? { fullName: "", email: "" };
  const html = withAccountProfile(stripLegacyAccountShell(ACCOUNT_HTML), profile);

  return (
    <AccountAreaLayout active="account" loginNext="/account">
      <LegacyInteractivePage html={html} script={ACCOUNT_SCRIPT} label="account" />
    </AccountAreaLayout>
  );
}
