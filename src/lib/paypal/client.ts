import "server-only";

const SANDBOX = "https://api-m.sandbox.paypal.com";
const LIVE = "https://api-m.paypal.com";

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

export function paypalApiBase(): string {
  return process.env.PAYPAL_ENV === "live" ? LIVE : SANDBOX;
}

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
}

function credentials(): { clientId: string; secret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials are missing");
  return { clientId, secret };
}

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const { clientId, secret } = credentials();
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("PayPal login failed");
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("PayPal login failed");
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 300) * 1000,
  };
  return json.access_token;
}

async function paypalFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  return fetch(`${paypalApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function createPayPalOrder(input: { orderId: string; value: string; description: string }): Promise<string> {
  const response = await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: input.orderId,
          description: input.description,
          amount: { currency_code: "USD", value: input.value },
        },
      ],
    }),
  });
  if (!response.ok) throw new Error("PayPal could not start the payment");
  const json = (await response.json()) as { id?: string };
  if (!json.id) throw new Error("PayPal could not start the payment");
  return json.id;
}

export type PayPalCapture = {
  paypalOrderId: string;
  captureId: string;
  currency: string;
  value: string;
  customId: string | null;
  status: string;
};

export async function getPayPalOrder(paypalOrderId: string): Promise<PayPalCapture> {
  const response = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`);
  const json = (await response.json()) as PayPalOrderBody;
  if (!response.ok) throw new Error("PayPal could not confirm the payment");
  return readCapture(paypalOrderId, json, json.status ?? "");
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCapture> {
  const response = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
  });
  const json = (await response.json()) as PayPalOrderBody;
  if (!response.ok) {
    const already = json.details?.some((detail) => detail.issue === "ORDER_ALREADY_CAPTURED");
    if (already) return getPayPalOrder(paypalOrderId);
    throw new Error("PayPal could not take the payment");
  }
  return readCapture(paypalOrderId, json, json.status ?? "");
}

type PayPalOrderBody = {
  id?: string;
  status?: string;
  details?: { issue?: string }[];
  purchase_units?: {
    custom_id?: string;
    payments?: {
      captures?: { id?: string; status?: string; amount?: { currency_code?: string; value?: string }; custom_id?: string }[];
    };
  }[];
};

function readCapture(fallbackOrderId: string, json: PayPalOrderBody, status: string): PayPalCapture {
  const unit = json.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (!capture?.id || !capture.amount?.value || !capture.amount.currency_code) {
    throw new Error("PayPal did not confirm the payment");
  }
  return {
    paypalOrderId: json.id || fallbackOrderId,
    captureId: capture.id,
    currency: capture.amount.currency_code,
    value: capture.amount.value,
    customId: capture.custom_id || unit?.custom_id || null,
    status: capture.status || status,
  };
}

const PAYPAL_CERT_HOSTS = new Set(["api.paypal.com", "api.sandbox.paypal.com", "api-m.paypal.com", "api-m.sandbox.paypal.com"]);

export function paypalCertUrlAllowed(certUrl: string): boolean {
  try {
    const url = new URL(certUrl);
    return url.protocol === "https:" && PAYPAL_CERT_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export async function verifyPayPalWebhook(input: {
  event: unknown;
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || !paypalCertUrlAllowed(input.certUrl)) return false;
  const response = await paypalFetch("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: input.authAlgo,
      cert_url: input.certUrl,
      transmission_id: input.transmissionId,
      transmission_sig: input.transmissionSig,
      transmission_time: input.transmissionTime,
      webhook_id: webhookId,
      webhook_event: input.event,
    }),
  });
  if (!response.ok) return false;
  const json = (await response.json()) as { verification_status?: string };
  return json.verification_status === "SUCCESS";
}
