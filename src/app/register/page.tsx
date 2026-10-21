import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { safeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create an Oncesung account.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <RegisterForm nextPath={safeNextPath(params.next)} />;
}
