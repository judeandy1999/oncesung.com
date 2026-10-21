import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your Oncesung password.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const notice =
    params.error === "expired" ? "That reset link is invalid or has expired. Request a new one." : undefined;
  return <ForgotPasswordForm notice={notice} />;
}
