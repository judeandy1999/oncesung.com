import type { Metadata } from "next";
import { LegacyInteractivePage } from "@/components/LegacyInteractivePage";
import { ACCOUNT_HTML } from "@/features/account/account-html";
import { ACCOUNT_SCRIPT } from "@/features/account/account-script";
import { withAccountProfile } from "@/features/account/with-account-profile";
import { getOwnProfile } from "@/lib/account/profile";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "My Account",
  description: "Personalized songs for every occasion.",
};

export default async function AccountPage() {
  await requireUser("/account");
  const profile = (await getOwnProfile()) ?? { fullName: "", email: "" };
  return (
    <LegacyInteractivePage html={withAccountProfile(ACCOUNT_HTML, profile)} script={ACCOUNT_SCRIPT} label="account" />
  );
}
