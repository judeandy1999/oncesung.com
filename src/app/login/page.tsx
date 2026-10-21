import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/LoginForm";
import { safeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Oncesung account.",
};

const NOTICES: Record<string, string> = {
  link: "That sign-in link is invalid or has expired. Try again.",
  google: "An account with that email already exists. Sign in with email, or use the same method you used before.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const notice = params.error ? NOTICES[params.error] : undefined;
  return <LoginForm nextPath={nextPath} notice={notice} />;
}
