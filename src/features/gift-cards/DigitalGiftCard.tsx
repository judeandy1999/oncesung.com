"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCents, packageByKey, type PackageKey } from "@/lib/orders/catalog";
import { sentGiftStatusLabel } from "@/features/gift-cards/sent-gift-status";

export function DigitalGiftCard({
  creditId,
  packageKey,
  amountCents,
  recipientName,
  recipientEmail,
  message,
  redeemUrl,
  qrDataUrl,
  status,
  showShare,
}: {
  creditId: string;
  packageKey: PackageKey;
  amountCents: number;
  recipientName: string;
  recipientEmail: string;
  message: string;
  redeemUrl: string;
  qrDataUrl: string | null;
  status: string;
  showShare: boolean;
}) {
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);
  const pkg = packageByKey(packageKey);

  const copyLink = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(redeemUrl);
      toast("Redeem link copied");
    } catch {
      toast("Could not copy — select the link and copy manually");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="digital-gift-card-wrap">
      <article className="digital-gift-card">
        <div className="digital-gift-card-inner">
          <div className="logo" style={{ fontSize: 22 }}>
            Oncesung
          </div>
          <p className="digital-gift-card-eyebrow">Song gift</p>
          <h1 className="digital-gift-card-title">
            {recipientName ? `For ${recipientName}` : "A custom song"}
          </h1>
          <p className="digital-gift-card-package">
            {pkg.name} · {formatCents(amountCents)}
          </p>
          {message ? <p className="digital-gift-card-message">“{message}”</p> : null}
          <p className="digital-gift-card-to xs muted">To: {recipientEmail}</p>
          {showShare && qrDataUrl ? (
            <div className="digital-gift-card-qr">
              {/* eslint-disable-next-line @next/next/no-img-element -- QR data URL from server */}
              <img src={qrDataUrl} alt="QR code to claim this song gift" width={280} height={280} />
              <p className="xs muted">Scan to claim and create the song</p>
            </div>
          ) : (
            <p className="small muted" style={{ marginTop: 20 }}>
              Complete payment to unlock the shareable card and QR code.
            </p>
          )}
        </div>
        <div className="digital-gift-card-ribbon" aria-hidden />
      </article>

      <div className="row" style={{ marginTop: 16, flexWrap: "wrap", gap: 8 }}>
        <span className="badge">{sentGiftStatusLabel(status)}</span>
        {showShare ? (
          <>
            <button type="button" className="btn btn-outline btn-sm" disabled={copying} onClick={() => void copyLink()}>
              <Copy size={16} strokeWidth={1.8} /> Copy link
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>
              <Printer size={16} strokeWidth={1.8} /> Print / save PDF
            </button>
          </>
        ) : (
          <Link className="btn btn-primary btn-sm" href={`/gift-cards/pay?credit=${encodeURIComponent(creditId)}`}>
            Finish payment
          </Link>
        )}
      </div>
      {showShare ? (
        <p className="xs muted" style={{ marginTop: 10, wordBreak: "break-all" }}>
          {redeemUrl}
        </p>
      ) : null}
    </div>
  );
}
