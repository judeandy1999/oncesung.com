import "server-only";

import { Resend } from "resend";
import { emailFromAddress, isEmailConfigured } from "@/lib/email/config";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY!.trim());
  return resend;
}

export type SendEmailResult = { ok: true } | { ok: false; reason: string };

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult> {
  const client = getResend();
  if (!client) return { ok: false, reason: "RESEND_API_KEY is not set." };
  const to = input.to.trim();
  if (!to) return { ok: false, reason: "No recipient address." };

  const { error } = await client.emails.send({
    from: emailFromAddress(),
    to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  if (error) {
    console.error("Email send failed", error.message);
    return { ok: false, reason: error.message || "Resend rejected the message." };
  }
  return { ok: true };
}
