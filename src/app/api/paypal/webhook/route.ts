import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders/record";
import { verifyPayPalWebhook } from "@/lib/paypal/client";

type CaptureResource = {
  id?: string;
  status?: string;
  custom_id?: string;
  amount?: { currency_code?: string; value?: string };
  supplementary_data?: { related_ids?: { order_id?: string } };
  purchase_units?: {
    custom_id?: string;
    payments?: {
      captures?: { id?: string; status?: string; amount?: { currency_code?: string; value?: string }; custom_id?: string }[];
    };
  }[];
};

function fromCapture(resource: CaptureResource, paypalOrderId: string | undefined) {
  if (!resource.id || !resource.amount?.value || !resource.amount.currency_code || !paypalOrderId) return null;
  return {
    paypalOrderId,
    captureId: resource.id,
    currency: resource.amount.currency_code,
    value: resource.amount.value,
    customId: resource.custom_id ?? null,
    captureStatus: resource.status ?? "",
  };
}

function fromOrder(resource: CaptureResource) {
  const unit = resource.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (!resource.id || !capture?.id || !capture.amount?.value || !capture.amount.currency_code) return null;
  return {
    paypalOrderId: resource.id,
    captureId: capture.id,
    currency: capture.amount.currency_code,
    value: capture.amount.value,
    customId: capture.custom_id || unit?.custom_id || null,
    captureStatus: capture.status || resource.status || "",
  };
}

export async function POST(request: Request) {
  const raw = await request.text();
  let event: { event_type?: string; resource?: CaptureResource };
  try {
    event = JSON.parse(raw) as { event_type?: string; resource?: CaptureResource };
  } catch {
    return NextResponse.json({ error: "Invalid webhook." }, { status: 400 });
  }

  const verified = await verifyPayPalWebhook({
    event: JSON.parse(raw) as unknown,
    authAlgo: request.headers.get("paypal-auth-algo") ?? "",
    certUrl: request.headers.get("paypal-cert-url") ?? "",
    transmissionId: request.headers.get("paypal-transmission-id") ?? "",
    transmissionSig: request.headers.get("paypal-transmission-sig") ?? "",
    transmissionTime: request.headers.get("paypal-transmission-time") ?? "",
  });
  if (!verified) return NextResponse.json({ error: "Webhook was not verified." }, { status: 401 });

  const resource = event.resource;
  const payment =
    event.event_type === "PAYMENT.CAPTURE.COMPLETED" && resource
      ? fromCapture(resource, resource.supplementary_data?.related_ids?.order_id)
      : event.event_type === "CHECKOUT.ORDER.COMPLETED" && resource
        ? fromOrder(resource)
        : null;
  if (!payment) return NextResponse.json({ ok: true });

  const saved = await markOrderPaid(payment);
  if (!saved.ok) {
    console.error("PayPal webhook did not update the order", saved.error);
    return NextResponse.json({ error: saved.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
