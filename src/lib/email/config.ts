import "server-only";

export function emailFromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || "Oncesung <hello@oncesung.com>";
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function siteOriginForEmail(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.oncesung.com";
}
