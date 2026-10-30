import "server-only";

import { sendEmail } from "@/lib/email/client";
import { siteOriginForEmail } from "@/lib/email/config";
import {
  orderPaidEmail,
  songReadyBuyerEmail,
  songReadyGiftEmail,
  welcomeEmail,
} from "@/lib/email/templates";
import type { PackageKey } from "@/lib/orders/catalog";
import {
  contactEmailFromStory,
  contactNameFromStory,
  isGiftFromStory,
  recipientEmailFromStory,
} from "@/lib/orders/story";
import type { SavedOrder } from "@/lib/orders/record";

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

export async function notifySongReady(order: SavedOrder & { gift_access_token: string | null }) {
  const contactEmail = contactEmailFromStory(order.story);
  const contactName = contactNameFromStory(order.story);
  const buyerMsg = songReadyBuyerEmail({
    contactName,
    recipientName: order.recipient_name,
    orderId: order.id,
  });
  if (contactEmail) {
    await sendEmail({ to: contactEmail, ...buyerMsg });
  }

  if (!isGiftFromStory(order.story)) return;
  const recipientEmail = recipientEmailFromStory(order.story);
  if (!recipientEmail || !order.gift_access_token) return;

  const origin = siteOriginForEmail();
  const giftUrl = `${origin}/gift/${order.gift_access_token}`;
  const giftMsg = songReadyGiftEmail({
    recipientName: order.recipient_name,
    giverName: contactName,
    giftUrl,
  });
  await sendEmail({ to: recipientEmail, ...giftMsg });
}
