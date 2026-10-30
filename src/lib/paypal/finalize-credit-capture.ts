import "server-only";

import { getCreditById, markCreditPaid } from "@/lib/credits/record";
import { notifyGiftCreditPaid, purchaserDisplayName } from "@/lib/email/notify-credit";
import { capturePayPalOrder } from "@/lib/paypal/client";

const CREDIT_PREFIX = "credit:";

export function creditIdFromCustomId(customId: string | null): string | null {
  if (!customId) return null;
  if (customId.startsWith(CREDIT_PREFIX)) return customId.slice(CREDIT_PREFIX.length);
  return null;
}

export async function finalizeCreditPayPalCapture(input: {
  creditId: string;
  paypalOrderId: string;
  userId: string;
}): Promise<{ ok: true; creditId: string } | { ok: false; error: string }> {
  const credit = await getCreditById(input.creditId);
  if (!credit || credit.purchaser_user_id !== input.userId) {
    return { ok: false, error: "That gift card could not be found." };
  }
  if (credit.paypal_order_id && credit.paypal_order_id !== input.paypalOrderId) {
    return { ok: false, error: "This payment does not match the gift card." };
  }

  try {
    const capture = await capturePayPalOrder(input.paypalOrderId);
    const fromCustom = creditIdFromCustomId(capture.customId);
    if (fromCustom && fromCustom !== credit.id) {
      return { ok: false, error: "This payment does not match the gift card." };
    }
    const saved = await markCreditPaid({
      creditId: credit.id,
      paypalOrderId: capture.paypalOrderId,
      captureId: capture.captureId,
      currency: capture.currency,
      value: capture.value,
      captureStatus: capture.status,
    });
    if (!saved.ok) return { ok: false, error: saved.error };

    const paid = await getCreditById(credit.id);
    if (paid && paid.status === "paid") {
      const name = await purchaserDisplayName(credit.purchaser_user_id);
      await notifyGiftCreditPaid(paid, name);
    }
    return { ok: true, creditId: saved.creditId };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "PayPal could not take the payment." };
  }
}
