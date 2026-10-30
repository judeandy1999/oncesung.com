"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatCents, packageByKey, type PackageKey } from "@/lib/orders/catalog";

export function GiftCreditPayment({
  orderId,
  packageKey,
  credits,
}: {
  orderId: string;
  packageKey: PackageKey;
  credits: { id: string; package_key: PackageKey }[];
}) {
  const router = useRouter();
  const [creditId, setCreditId] = useState(credits[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const pkg = packageByKey(packageKey);
  const matching = credits.filter((c) => c.package_key === packageKey);

  if (matching.length === 0) return null;

  const applyCredit = async () => {
    if (!creditId) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/redeem-credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditId }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(body.error || "Could not use the gift credit.");
        return;
      }
      router.push(`/order-confirmed?order=${encodeURIComponent(orderId)}`);
    } catch {
      setMessage("Could not use the gift credit.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card pad-lg" style={{ marginBottom: 16, borderColor: "var(--coral)" }}>
      <b>Song gift credit</b>
      <p className="xs muted" style={{ margin: "8px 0 0" }}>
        You have a {pkg.name} gift ({formatCents(pkg.amountCents)}). Use it for this order — no PayPal needed.
      </p>
      {matching.length > 1 ? (
        <div className="field" style={{ marginTop: 12 }}>
          <label className="lbl xs">Choose credit</label>
          <select className="select" value={creditId} onChange={(e) => setCreditId(e.target.value)}>
            {matching.map((c) => (
              <option key={c.id} value={c.id}>
                Gift credit · {packageByKey(c.package_key).name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 12 }}
        disabled={busy || !creditId}
        onClick={() => void applyCredit()}
      >
        {busy ? "Applying…" : "Use gift credit"}
      </button>
      {message ? <p className="small" style={{ marginTop: 8 }}>{message}</p> : null}
      <p className="xs muted" style={{ marginTop: 8 }}>
        Or pay with PayPal below if you prefer not to use the gift.
      </p>
      <Link className="back xs" href="/dashboard" style={{ display: "inline-flex", marginTop: 8 }}>
        <ArrowLeft size={14} /> View gifts
      </Link>
    </div>
  );
}
