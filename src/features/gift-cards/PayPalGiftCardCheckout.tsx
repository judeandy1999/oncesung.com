"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatCents, packageByKey, type PackageKey } from "@/lib/orders/catalog";

type PayPalButtons = {
  close: () => void;
  render: (element: HTMLElement) => Promise<void> | void;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: () => void;
        onCancel?: () => void;
      }) => PayPalButtons;
    };
  }
}

export function PayPalGiftCardCheckout({
  creditId,
  clientId,
  packageKey,
  recipientEmail,
}: {
  creditId: string;
  clientId: string;
  packageKey: PackageKey;
  recipientEmail: string;
}) {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const selected = packageByKey(packageKey);

  useEffect(() => {
    if (!clientId) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
    const markReady = () => setReady(true);
    if (existing) {
      if (window.paypal) markReady();
      else existing.addEventListener("load", markReady, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&disable-funding=card,credit,venmo`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = markReady;
    script.onerror = () => setMessage("PayPal could not be loaded.");
    document.body.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!ready || !container || !window.paypal) return;
    container.innerHTML = "";
    let buttons: PayPalButtons | null = null;
    let cancelled = false;
    buttons = window.paypal.Buttons({
      createOrder: async () => {
        setMessage("");
        setBusy(true);
        try {
          const response = await fetch("/api/paypal/credits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creditId }),
          });
          const body = (await response.json()) as { id?: string; error?: string };
          if (!response.ok || !body.id) throw new Error(body.error || "Could not start PayPal.");
          return body.id;
        } catch (err) {
          setMessage(err instanceof Error ? err.message : "Could not start PayPal.");
          throw err;
        } finally {
          setBusy(false);
        }
      },
      onApprove: async (data) => {
        setBusy(true);
        const response = await fetch("/api/paypal/capture-credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creditId, paypalOrderId: data.orderID }),
        });
        const body = (await response.json()) as { error?: string };
        setBusy(false);
        if (!response.ok) {
          setMessage(body.error || "PayPal could not take the payment.");
          return;
        }
        router.push(`/gift-cards/success?credit=${encodeURIComponent(creditId)}`);
      },
      onCancel: () => {
        setBusy(false);
        setMessage("PayPal was closed before the payment finished.");
      },
      onError: () => {
        setBusy(false);
        setMessage("PayPal could not take the payment.");
      },
    });
    void Promise.resolve(buttons.render(container)).catch(() => {
      if (!cancelled) setMessage("PayPal could not be loaded.");
    });
    return () => {
      cancelled = true;
      buttons?.close();
      container.innerHTML = "";
    };
  }, [creditId, ready, router]);

  return (
    <div>
      <h1 style={{ fontSize: 42, marginTop: 0 }}>Pay for the gift card</h1>
      <p className="muted">
        {selected.name} ({formatCents(selected.amountCents)}) for {recipientEmail}. After payment, they get an email
        to claim and create their song — no payment at checkout.
      </p>
      <div className="card pad-lg" style={{ marginTop: 16 }}>
        <b>PayPal</b>
        <div ref={containerRef} style={{ marginTop: 16, minHeight: 48 }} />
        {busy ? <p className="small">Waiting for PayPal…</p> : null}
        {message ? <p className="small">{message}</p> : null}
      </div>
      <Link className="back" href="/gift-cards#buy" style={{ display: "inline-flex", marginTop: 18 }}>
        <ArrowLeft size={16} strokeWidth={1.8} /> Back
      </Link>
    </div>
  );
}
