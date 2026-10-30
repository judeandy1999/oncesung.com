import "server-only";

import { sendEmail } from "@/lib/email/client";
import { siteOriginForEmail } from "@/lib/email/config";
import { giftCreditReceivedEmail } from "@/lib/email/templates";
import type { SongCredit } from "@/lib/credits/record";
import { createNotification } from "@/lib/notifications/record";
import { packageByKey } from "@/lib/orders/catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export async function notifyGiftCreditPaid(credit: SongCredit, purchaserName: string): Promise<void> {
  const origin = siteOriginForEmail();
  const redeemUrl = `${origin}/redeem/${credit.claim_token}`;
  const pkg = packageByKey(credit.package_key);
  const msg = giftCreditReceivedEmail({
    recipientName: credit.recipient_name,
    purchaserName,
    packageName: pkg.name,
    redeemUrl,
    message: credit.personal_message,
  });
  await sendEmail({ to: credit.recipient_email, ...msg });

  if (credit.recipient_user_id) {
    await createNotification({
      userId: credit.recipient_user_id,
      kind: "gift_credit_received",
      title: "You received a song gift",
      body: `${purchaserName || "Someone"} sent you a ${pkg.name} song gift.`,
      href: `/redeem/${credit.claim_token}`,
    });
  }
}

export async function notifyGiftCreditClaimed(credit: SongCredit, userId: string): Promise<void> {
  const pkg = packageByKey(credit.package_key);
  await createNotification({
    userId,
    kind: "gift_credit_claimed",
    title: "Your song gift is ready to use",
    body: `Start your ${pkg.name} song — checkout is already covered.`,
    href: `/song-intake?credit=${credit.id}`,
  });
}

export async function purchaserDisplayName(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("full_name, email").eq("id", userId).maybeSingle();
  return (data?.full_name || data?.email || "").trim();
}
