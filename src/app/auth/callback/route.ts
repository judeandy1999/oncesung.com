import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

function failedRedirect(url: URL, next: string) {
  const description = (url.searchParams.get("error_description") ?? "").toLowerCase();
  if (description.includes("already")) {
    return NextResponse.redirect(new URL("/login?error=google", url.origin));
  }

  const failed = next === "/auth/reset-password" ? "/forgot-password?error=expired" : "/login?error=link";
  return NextResponse.redirect(new URL(failed, url.origin));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code || url.searchParams.get("error")) {
    return failedRedirect(url, next);
  }

  const supabase = await createClient();
  const flowId = url.searchParams.get("sb_flow_id");
  const { data, error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  if (error || !data.user) return failedRedirect(url, next);

  const meta = data.user.user_metadata;
  const rawName = [meta?.full_name, meta?.name].find((value) => typeof value === "string" && value.trim());
  const fullName = typeof rawName === "string" ? rawName.trim().slice(0, 100) : "";
  if (fullName) {
    await supabase.from("profiles").update({ full_name: fullName }).eq("id", data.user.id).eq("full_name", "");
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
