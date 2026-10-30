import "server-only";

import {
  orderPaidEmail,
  songReadyBuyerEmail,
  songReadyGiftEmail,
  welcomeEmail,
} from "@/lib/email/templates";
import { siteOriginForEmail } from "@/lib/email/config";
import type { EmailPreviewItem } from "@/lib/email/preview-types";

export function emailPreviewSamples(): EmailPreviewItem[] {
  const origin = siteOriginForEmail();
  const welcome = welcomeEmail("Jess");
  const order = orderPaidEmail({
    contactName: "Gergely",
    packageKey: "signature",
    amountCents: 8900,
    recipientName: "Jess",
    occasion: "Anniversary",
    orderId: "00000000-0000-0000-0000-000000000001",
  });
  const ready = songReadyBuyerEmail({
    contactName: "Gergely",
    recipientName: "Jess",
    orderId: "00000000-0000-0000-0000-000000000001",
  });
  const gift = songReadyGiftEmail({
    recipientName: "Jess",
    giverName: "Gergely",
    giftUrl: `${origin}/gift/00000000-0000-0000-0000-000000000002`,
  });

  return [
    {
      id: "welcome",
      label: "Welcome",
      description: "After first sign-in (email or Google)",
      subject: welcome.subject,
      html: welcome.html,
    },
    {
      id: "order-paid",
      label: "Order confirmed",
      description: "After PayPal payment completes",
      subject: order.subject,
      html: order.html,
    },
    {
      id: "song-ready",
      label: "Song ready",
      description: "After admin uploads the finished file (buyer)",
      subject: ready.subject,
      html: ready.html,
    },
    {
      id: "gift",
      label: "Gift delivery",
      description: "Same upload, gift orders — sent to recipient",
      subject: gift.subject,
      html: gift.html,
    },
  ];
}
