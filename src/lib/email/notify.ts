import "server-only";

import { sendEmail } from "@/lib/email/client";
import { isEmailConfigured, siteOriginForEmail } from "@/lib/email/config";
import type { SongDeliveryResult } from "@/lib/email/delivery-result";
import {
  orderPaidEmail,
  songReadyBuyerEmail,
  songReadyGiftEmail,
  welcomeEmail,
} from "@/lib/email/templates";
import type { PackageKey } from "@/lib/orders/catalog";
import { ensureGiftAccessToken } from "@/lib/orders/gift-access";
import type { SavedOrder } from "@/lib/orders/record";
import {
  contactEmailFromStory,
  contactNameFromStory,
  isGiftFromStory,
  recipientEmailFromStory,
} from "@/lib/orders/story";
import { createAdminClient } from "@/lib/supabase/admin";

export async function notifyWelcome(input: { email: string; name: string }) {
  const msg = welcomeEmail(input.name);
  await sendEmail({ to: input.email, ...msg });
}

export async function notifyOrderPaid(order: SavedOrder) {
  const contactEmail = contactEmailFromStory(order.story);
  const to = contactEmail || "";
  if (!to) return;

  const msg = orderPaidEmail({
    contactName: contactNameFromStory(order.story),
    packageKey: order.package_key as PackageKey,
    amountCents: order.amount_cents,
    recipientName: order.recipient_name,
    occasion: order.occasion,
    orderId: order.id,
  });
  await sendEmail({ to, ...msg });
}

async function buyerEmailForOrder(order: SavedOrder): Promise<string> {
  const fromStory = contactEmailFromStory(order.story);
  if (fromStory) return fromStory;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("email").eq("id", order.user_id).maybeSingle();
    return (data?.email ?? "").trim();
  } catch {
    return "";
  }
}

export async function notifySongReady(order: SavedOrder): Promise<SongDeliveryResult> {
  const issues: string[] = [];
  if (!isEmailConfigured()) {
    issues.push("RESEND_API_KEY is not set — no emails were sent.");
  }
  if (!order.song_storage_path) {
    issues.push("No song file on this order yet.");
    return { buyerSent: false, giftSent: false, giftUrl: null, issues };
  }

  const contactEmail = await buyerEmailForOrder(order);
  const contactName = contactNameFromStory(order.story);
  const buyerMsg = songReadyBuyerEmail({
    contactName,
    recipientName: order.recipient_name,
    orderId: order.id,
  });
  let buyerSent = false;
  if (contactEmail) {
    buyerSent = await sendEmail({ to: contactEmail, ...buyerMsg });
    if (!buyerSent && isEmailConfigured()) issues.push("Buyer email could not be sent.");
  } else {
    issues.push("No buyer email on the order (add contactEmail in checkout or use the account email).");
  }

  const isGift = isGiftFromStory(order.story);
  if (!isGift) {
    return { buyerSent, giftSent: false, giftUrl: null, issues };
  }

  const recipientEmail = recipientEmailFromStory(order.story);
  if (!recipientEmail) {
    issues.push("Gift order but no recipient email — add story.answers.recipientEmail in Supabase or re-enter checkout as a gift.");
    return { buyerSent, giftSent: false, giftUrl: null, issues };
  }

  const token = order.gift_access_token ?? (await ensureGiftAccessToken(order.id));
  if (!token) {
    issues.push(
      "Gift link token is missing. Run migration 20261030120000_order_gift_token.sql in Supabase, then click Resend delivery emails.",
    );
    return { buyerSent, giftSent: false, giftUrl: null, issues };
  }

  const origin = siteOriginForEmail();
  const giftUrl = `${origin}/gift/${token}`;
  const giftMsg = songReadyGiftEmail({
    recipientName: order.recipient_name,
    giverName: contactName,
    giftUrl,
  });
  const giftSent = await sendEmail({ to: recipientEmail, ...giftMsg });
  if (!giftSent && isEmailConfigured()) {
    issues.push("Gift recipient email could not be sent (check Resend domain and recipient address).");
  }

  return { buyerSent, giftSent, giftUrl, issues };
}
