import "server-only";

import { getOrderById, markOrderPaid } from "@/lib/orders/record";
import { capturePayPalOrder } from "@/lib/paypal/client";

export async function finalizePayPalCapture(input: {
  orderId: string;
  paypalOrderId: string;
  userId: string;
}): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  const order = await getOrderById(input.orderId);
  if (!order || order.user_id !== input.userId) {
    return { ok: false, error: "That order could not be found." };
  }
  if (order.paypal_order_id && order.paypal_order_id !== input.paypalOrderId) {
    return { ok: false, error: "This payment does not match the order." };
  }

  try {
    const capture = await capturePayPalOrder(input.paypalOrderId);
    if (capture.customId && capture.customId !== order.id) {
      return { ok: false, error: "This payment does not match the order." };
    }
    const saved = await markOrderPaid({
      paypalOrderId: capture.paypalOrderId,
      captureId: capture.captureId,
      currency: capture.currency,
      value: capture.value,
      customId: order.id,
      captureStatus: capture.status,
    });
    if (!saved.ok) return { ok: false, error: saved.error };
    return { ok: true, orderId: saved.orderId };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "PayPal could not take the payment." };
  }
}

export function finalizeCaptureHttpStatus(error: string): number {
  if (error.includes("not be found")) return 404;
  if (error.includes("could not take")) return 502;
  return 409;
}
