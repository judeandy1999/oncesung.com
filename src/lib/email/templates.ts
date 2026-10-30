import "server-only";

import { formatCents, packageByKey, type PackageKey } from "@/lib/orders/catalog";
import { siteOriginForEmail } from "@/lib/email/config";

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:Georgia,'Times New Roman',serif;color:#281830;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e8e4ef;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px;">
          <div style="font-size:22px;font-weight:700;color:#281830;">Oncesung</div>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;font-size:16px;line-height:1.55;">
          ${body}
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#6b6574;">&copy; Oncesung</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0 8px;"><a href="${href}" style="display:inline-block;background:#c45c4a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;">${label}</a></p>`;
}

export function welcomeEmail(name: string) {
  const origin = siteOriginForEmail();
  const greeting = name.trim() ? `Hi ${escapeHtml(name.trim())},` : "Hi there,";
  const html = layout(`
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 16px;">Welcome to Oncesung. Your account is ready — when you are, start a song and we will turn your story into music.</p>
    ${button(`${origin}/song-intake`, "Create a song")}
    <p style="margin:16px 0 0;font-size:14px;color:#6b6574;">Questions? Reply to this email or visit our FAQ on the site.</p>
  `);
  const text = `${greeting}\n\nWelcome to Oncesung. Start a song at ${origin}/song-intake`;
  return { subject: "Welcome to Oncesung", html, text };
}

export function orderPaidEmail(input: {
  contactName: string;
  packageKey: PackageKey;
  amountCents: number;
  recipientName: string;
  occasion: string;
  orderId: string;
}) {
  const origin = siteOriginForEmail();
  const pkg = packageByKey(input.packageKey);
  const forLine = input.recipientName
    ? `Song for ${input.recipientName}${input.occasion ? ` · ${input.occasion}` : ""}`
    : "Your custom song";
  const greeting = input.contactName.trim() ? `Hi ${escapeHtml(input.contactName.trim())},` : "Hi there,";
  const html = layout(`
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 16px;">Thank you — your payment is confirmed.</p>
    <p style="margin:0 0 8px;"><strong>${escapeHtml(forLine)}</strong></p>
    <p style="margin:0 0 16px;font-size:14px;color:#6b6574;">${escapeHtml(pkg.name)} · ${formatCents(input.amountCents)}</p>
    <p style="margin:0 0 16px;">Our songwriters are on it. You can track progress anytime on My Orders.</p>
    ${button(`${origin}/dashboard`, "View My Orders")}
  `);
  const text = `${greeting}\n\nPayment confirmed: ${forLine}. ${pkg.name} · ${formatCents(input.amountCents)}.\nTrack your order: ${origin}/dashboard`;
  return { subject: "Your Oncesung order is confirmed", html, text };
}

export function songReadyBuyerEmail(input: {
  contactName: string;
  recipientName: string;
  orderId: string;
}) {
  const origin = siteOriginForEmail();
  const greeting = input.contactName.trim() ? `Hi ${escapeHtml(input.contactName.trim())},` : "Hi there,";
  const forLine = input.recipientName ? `the song for ${escapeHtml(input.recipientName)}` : "your song";
  const html = layout(`
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 16px;">Great news — ${forLine} is ready. Listen and download it from My Orders.</p>
    ${button(`${origin}/dashboard`, "Open My Orders")}
  `);
  const text = `${greeting}\n\nYour song is ready. Open My Orders: ${origin}/dashboard`;
  return { subject: "Your song is ready on Oncesung", html, text };
}

export function songReadyGiftEmail(input: {
  recipientName: string;
  giverName: string;
  giftUrl: string;
}) {
  const name = input.recipientName.trim() ? escapeHtml(input.recipientName.trim()) : "there";
  const from = input.giverName.trim() ? escapeHtml(input.giverName.trim()) : "Someone special";
  const html = layout(`
    <p style="margin:0 0 16px;">Hi ${name},</p>
    <p style="margin:0 0 16px;">${from} made you a custom song on Oncesung. Press play below — you can listen and download whenever you like.</p>
    ${button(input.giftUrl, "Listen to your song")}
    <p style="margin:16px 0 0;font-size:14px;color:#6b6574;">This link is private. Please do not share it publicly.</p>
  `);
  const text = `Hi ${input.recipientName || "there"},\n\n${input.giverName || "Someone"} sent you a custom song. Listen here: ${input.giftUrl}`;
  return { subject: "You received a custom song", html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
