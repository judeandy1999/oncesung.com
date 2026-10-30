import "server-only";

import { Resend } from "resend";
import { emailFromAddress, isEmailConfigured } from "@/lib/email/config";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY!.trim());
  return resend;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) return false;
  const to = input.to.trim();
  if (!to) return false;

  const { error } = await client.emails.send({
    from: emailFromAddress(),
    to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  if (error) {
    console.error("Email send failed");
    return false;
  }
  return true;
}
