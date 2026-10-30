"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents, packageByKey, type PackageKey } from "@/lib/orders/catalog";

export function RedeemGiftClient({
  token,
  packageKey,
  recipientName,
  recipientEmail,
  purchaserLabel,
  message,
  signedIn,
  signedInEmail,
  alreadyClaimed,
  creditId,
}: {
  token: string;
  packageKey: PackageKey;
  recipientName: string;
  recipientEmail: string;
  purchaserLabel: string;
  message: string;
  signedIn: boolean;
  signedInEmail: string | null;
  alreadyClaimed: boolean;
  creditId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pkg = packageByKey(packageKey);
  const loginNext = `/redeem/${token}`;

  const claim = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/credits/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json()) as { creditId?: string; error?: string };
      if (!response.ok) {
        setError(body.error || "Could not claim this gift.");
        return;
      }
      router.push(`/song-intake?credit=${encodeURIComponent(body.creditId ?? creditId ?? "")}`);
      router.refresh();
    } catch {
      setError("Could not claim this gift.");
    } finally {
      setBusy(false);
    }
  };

  const emailMatches =
    signedInEmail && recipientEmail && signedInEmail.toLowerCase() === recipientEmail.toLowerCase();

  return (
    <div className="card pad-lg" style={{ maxWidth: 560, margin: "0 auto" }}>
      <span className="badge green">Song gift</span>
      <h1 style={{ marginTop: 12 }}>
        {recipientName ? `${recipientName}, you` : "You"} received a {pkg.name} song
      </h1>
      <p className="muted">
        {purchaserLabel || "Someone"} sent you a custom song on Oncesung ({formatCents(pkg.amountCents)} value).
      </p>
      {message ? (
        <p className="small" style={{ fontStyle: "italic" }}>
          “{message}”
        </p>
      ) : null}
      {!signedIn ? (
        <>
          <p className="small">Sign in or create an account with {recipientEmail} to claim this gift.</p>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(loginNext)}`}>
              Sign in
            </Link>
            <Link className="btn btn-outline" href={`/register?next=${encodeURIComponent(loginNext)}`}>
              Create account
            </Link>
          </div>
        </>
      ) : !emailMatches ? (
        <>
          <p className="small" style={{ color: "var(--coral-ink)" }}>
            This gift was sent to {recipientEmail}. You are signed in as {signedInEmail}. Switch accounts to claim.
          </p>
          <Link className="btn btn-outline btn-sm" href={`/login?next=${encodeURIComponent(loginNext)}`}>
            Sign in with another email
          </Link>
        </>
      ) : alreadyClaimed && creditId ? (
        <>
          <p className="small">This gift is on your account. Start your song whenever you are ready.</p>
          <Link className="btn btn-primary" href={`/song-intake?credit=${encodeURIComponent(creditId)}`}>
            Create your song
          </Link>
        </>
      ) : (
        <>
          <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={() => void claim()}>
            {busy ? "Claiming…" : "Claim gift & start your song"}
          </button>
          {error ? (
            <p className="small" style={{ color: "var(--coral-ink)", marginTop: 8 }}>
              {error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
