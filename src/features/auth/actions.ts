"use server";

import { redirect } from "next/navigation";
import { getSiteOrigin } from "@/lib/auth/origin";
import { safeNextPath } from "@/lib/auth/redirect";
import {
  fieldErrors,
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
  type FieldErrors,
} from "@/lib/auth/schema";
import { notifyWelcome } from "@/lib/email/notify";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = {
  error?: string;
  success?: string;
  fields?: FieldErrors;
};

function sameSiteMessage(error: { message: string; status?: number; code?: string }) {
  const message = error.message.toLowerCase();
  return (
    error.status === 429 ||
    error.code === "over_request_rate_limit" ||
    message.includes("rate limit")
  );
}

function isDuplicateAccount(error: { message: string; code?: string }) {
  const message = error.message.toLowerCase();
  return (
    error.code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("user already exists")
  );
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    if (sameSiteMessage(error)) return { error: "Too many attempts. Wait a minute and try again." };
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Confirm your email before signing in. Check your inbox for the link." };
    }
    const invalid =
      error.code === "invalid_credentials" || error.message.toLowerCase().includes("invalid login");
    if (invalid) return { error: "Email or password is incorrect." };
    return { error: "Could not sign in. Try again in a moment." };
  }

  redirect(safeNextPath(parsed.data.next));
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };

  const origin = await getSiteOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/account`,
    },
  });

  if (error) {
    if (sameSiteMessage(error)) return { error: "Too many attempts. Wait a minute and try again." };
    if (isDuplicateAccount(error)) {
      return { success: "Check your email to confirm your account." };
    }
    return { error: "Could not create the account. Try again." };
  }

  if (data.session && data.user?.email) {
    const welcome = await notifyWelcome({
      email: data.user.email,
      name: parsed.data.fullName,
    });
    if (welcome.ok) {
      try {
        const admin = createAdminClient();
        await admin.auth.admin.updateUserById(data.user.id, {
          user_metadata: { ...(data.user.user_metadata ?? {}), welcome_email_sent: true },
        });
      } catch {
        /* metadata update is best-effort */
      }
    }
    redirect("/account");
  }
  return { success: "Check your email to confirm your account." };
}

export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };

  const origin = await getSiteOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });

  if (error && sameSiteMessage(error)) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }

  return { success: "If an account exists for that email, we sent a reset link." };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (sameSiteMessage(error)) return { error: "Too many attempts. Wait a minute and try again." };
    return { error: "Could not update your password. Request a new reset link." };
  }

  redirect("/account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function googleSignInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const requested = formData.get("next");
  const next = safeNextPath(typeof requested === "string" ? requested : null);
  const origin = await getSiteOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return { error: "Could not start Google sign-in. Try again." };
  }

  redirect(data.url);
}
