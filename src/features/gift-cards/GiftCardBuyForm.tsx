"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { PACKAGE_KEYS, packageByKey, type PackageKey } from "@/lib/orders/catalog";

const AMOUNTS: PackageKey[] = [...PACKAGE_KEYS];

export function GiftCardBuyForm() {
  const router = useRouter();
  const [packageKey, setPackageKey] = useState<PackageKey>("signature");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageKey,
          recipientName,
          recipientEmail,
          personalMessage,
        }),
      });
      const body = (await response.json()) as { id?: string; error?: string };
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/gift-cards#buy")}`);
        return;
      }
      if (!response.ok || !body.id) {
        setError(body.error || "Could not continue to payment.");
        return;
      }
      router.push(`/gift-cards/pay?credit=${encodeURIComponent(body.id)}`);
    } catch {
      setError("Could not continue to payment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card pad-lg" onSubmit={(event) => void onSubmit(event)}>
      <h2>Choose your gift card</h2>
      <label className="lbl">Amount</label>
      <p className="xs muted" style={{ margin: "-2px 0 10px" }}>
        Each card covers one song package in full.
      </p>
      <div className="chips" style={{ marginBottom: 16 }}>
        {AMOUNTS.map((key) => {
          const pkg = packageByKey(key);
          const label = `$${Math.round(pkg.amountCents / 100)} · ${pkg.name}`;
          return (
            <button
              key={key}
              type="button"
              className={`chip${packageKey === key ? " on" : ""}`}
              onClick={() => setPackageKey(key)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="grid g2">
        <div className="field">
          <label className="lbl">Recipient&apos;s name</label>
          <input
            className="input"
            placeholder="e.g. Jess"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="lbl">
            Recipient&apos;s email <span className="req">*</span>
          </label>
          <input
            className="input"
            type="email"
            required
            placeholder="name@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label className="lbl">Personal message</label>
        <textarea
          className="textarea"
          maxLength={500}
          placeholder="Write something from the heart…"
          value={personalMessage}
          onChange={(e) => setPersonalMessage(e.target.value)}
        />
      </div>
      {error ? (
        <p className="small" style={{ color: "var(--coral-ink)" }}>
          {error}
        </p>
      ) : null}
      <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
        {busy ? "Continuing…" : "Continue to PayPal"}{" "}
        <ArrowRight size={16} strokeWidth={1.8} />
      </button>
    </form>
  );
}
