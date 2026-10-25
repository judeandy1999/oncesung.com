"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatCents, isPackageKey, packageByKey, type PackageKey } from "@/lib/orders/catalog";
import { oncesungStore } from "@/lib/store";

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

export function PayPalCheckout({
  orderId,
  clientId,
  packageKey,
  recipientName,
  occasion,
}: {
  orderId: string;
  clientId: string;
  packageKey: PackageKey;
  recipientName: string;
  occasion: string;
}) {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const selected = packageByKey(packageKey);

  useEffect(() => {
    const stored = oncesungStore.get<string>("package");
    if (!isPackageKey(stored) || stored === packageKey) return;
    void fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageKey: stored }),
    }).then((response) => {
      if (response.ok) router.refresh();
    });
  }, [orderId, packageKey, router]);

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
          const response = await fetch("/api/paypal/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, packageKey }),
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
        const response = await fetch("/api/paypal/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paypalOrderId: data.orderID }),
        });
        const body = (await response.json()) as { error?: string };
        setBusy(false);
        if (!response.ok) {
          setMessage(body.error || "PayPal could not take the payment.");
          return;
        }
        router.push(`/order-confirmed?order=${encodeURIComponent(orderId)}`);
      },
      onCancel: () => {
        setBusy(false);
        setMessage("PayPal was closed before the payment finished. You have not been charged.");
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
  }, [orderId, packageKey, ready, router]);

  return (
    <div>
      <h1 style={{ fontSize: 42, marginTop: 0 }}>Secure payment</h1>
      <p className="muted">
        Pay with PayPal for your {selected.name} package ({formatCents(selected.amountCents)}).
        {recipientName ? ` Song for ${recipientName}.` : ""}
        {occasion ? ` ${occasion}.` : ""}
      </p>
      <div className="card pad-lg" style={{ marginTop: 16 }}>
        <b>PayPal</b>
        <p className="xs muted" style={{ margin: "8px 0 0" }}>
          Use the PayPal button below. PayPal may open a secure window to sign in and approve the payment.
        </p>
        {clientId ? (
          <div ref={containerRef} style={{ marginTop: 16, minHeight: 48 }} />
        ) : (
          <p style={{ marginTop: 16 }}>
            PayPal is not set up yet. Add the PayPal client id to the site settings, then restart the site.
          </p>
        )}
        {busy ? <p className="small">Waiting for PayPal…</p> : null}
        {message ? <p className="small">{message}</p> : null}
      </div>
      <div className="row between" style={{ marginTop: 18, flexWrap: "wrap", gap: 12 }}>
        <Link className="back" href="/checkout/review" style={{ display: "inline-flex" }}>
          <ArrowLeft size={16} strokeWidth={1.8} /> Package
        </Link>
        <Link className="back" href="/checkout/details" style={{ display: "inline-flex" }}>
          <ArrowLeft size={16} strokeWidth={1.8} /> Your details
        </Link>
      </div>
    </div>
  );
}
