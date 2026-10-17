import type { Metadata } from "next";
import { LegacyInteractivePage } from "@/components/LegacyInteractivePage";
import { ACCOUNT_HTML } from "@/features/account/account-html";
import { ACCOUNT_SCRIPT } from "@/features/account/account-script";

export const metadata: Metadata = {
  title: "My Account",
  description: "Personalized songs for every occasion.",
};

export default function AccountPage() {
  return (
    <LegacyInteractivePage html={ACCOUNT_HTML} script={ACCOUNT_SCRIPT} label="account" />
  );
}
