"use client";

import { useState } from "react";
import {
  ADMIN_TEST_TRANSACTION_PREFIX,
  isGoogleAdsGtagReady,
  pushPurchaseConversion,
} from "@/lib/analytics/push-purchase";
import { isAdsConversionAllowed } from "@/lib/analytics/consent";

export function AdminAdsConversionTest() {
  const [log, setLog] = useState<string[]>([]);
  const [value, setValue] = useState("0");
  const [busy, setBusy] = useState(false);

  function append(message: string) {
    setLog((prev) => [message, ...prev].slice(0, 8));
  }

  async function fireTest() {
    setBusy(true);
    const parsed = Number.parseFloat(value);
    const amount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    const transactionId = `${ADMIN_TEST_TRANSACTION_PREFIX}${crypto.randomUUID()}`;

    append(`Trying ${transactionId} · ${amount} USD…`);

    if (!isAdsConversionAllowed()) {
      append("Blocked: accept marketing cookies (Accept all) first.");
      setBusy(false);
      return;
    }

    const started = Date.now();
    const tryOnce = () =>
      pushPurchaseConversion({
        transactionId,
        value: amount,
        currency: "USD",
      });

    if (tryOnce()) {
      append("Conversion pushed. Check Tag Assistant → Hits sent (AW tag).");
      setBusy(false);
      return;
    }

    if (!isGoogleAdsGtagReady()) {
      append("Waiting for AW gtag to load…");
    }

    const timer = setInterval(() => {
      if (tryOnce()) {
        clearInterval(timer);
        append("Conversion pushed after gtag loaded.");
        setBusy(false);
        return;
      }
      if (Date.now() - started > 20000) {
        clearInterval(timer);
        append("Timed out. Confirm GoogleAdsTag is deployed and cookies granted.");
        setBusy(false);
      }
    }, 400);
  }

  return (
    <div className="card pad-lg" style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 22, margin: "0 0 8px" }}>Test Purchase conversion (admin)</h2>
      <p className="small muted">
        Fires the same <code>gtag(&apos;event&apos;, &apos;conversion&apos;, …)</code> as{" "}
        <code>/order-confirmed</code> without PayPal. Use for Google Ads tag verification only.
      </p>
      <ol className="small muted" style={{ margin: "12px 0", paddingLeft: 18 }}>
        <li>Accept <b>all</b> cookies on the site first.</li>
        <li>Use Tag Assistant on this page when you click the button.</li>
        <li>Google may take 24–48h to mark the action verified in Ads.</li>
      </ol>
      <label className="lbl" htmlFor="admin-conv-value">
        Test value (USD)
      </label>
      <input
        id="admin-conv-value"
        className="input"
        type="number"
        min={0}
        step={0.01}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ maxWidth: 160, marginBottom: 12 }}
      />
      <p className="xs muted" style={{ margin: "0 0 12px" }}>
        0 is allowed here for admin tests. If Google ignores zero-value hits, try 1.00.
      </p>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void fireTest()}>
        {busy ? "Sending…" : "Fire test conversion"}
      </button>
      {log.length > 0 ? (
        <ul className="small" style={{ marginTop: 16, paddingLeft: 18 }}>
          {log.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
