import Link from "next/link";
import { formatCents, packageByKey } from "@/lib/orders/catalog";
import type { SentCreditSummary } from "@/lib/credits/queries";
import { sentGiftStatusLabel } from "@/features/gift-cards/sent-gift-status";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SentGiftsList({ gifts }: { gifts: SentCreditSummary[] }) {
  if (gifts.length === 0) {
    return (
      <div className="card pad">
        <h2 style={{ marginTop: 0 }}>No gifts sent yet</h2>
        <p className="muted">When you buy a gift card, it will show up here with a digital card and QR code to share.</p>
        <Link className="btn btn-primary" href="/gift-cards#buy">
          Buy a gift card
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {gifts.map((gift) => {
        const pkg = packageByKey(gift.package_key);
        const canShare = gift.status !== "pending";
        return (
          <article key={gift.id} className="card pad row between" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <b>{gift.recipient_name || gift.recipient_email}</b>
              <div className="xs muted">
                {pkg.name} · {formatCents(gift.amount_cents)} · Sent {formatDate(gift.paid_at ?? gift.created_at)}
              </div>
              <div className="xs muted">{gift.recipient_email}</div>
              <span className="badge" style={{ marginTop: 8 }}>
                {sentGiftStatusLabel(gift.status)}
              </span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              {gift.status === "pending" ? (
                <Link className="btn btn-primary btn-sm" href={`/gift-cards/pay?credit=${encodeURIComponent(gift.id)}`}>
                  Pay now
                </Link>
              ) : null}
              {canShare ? (
                <Link className="btn btn-outline btn-sm" href={`/gift-cards/card/${encodeURIComponent(gift.id)}`}>
                  Digital card & QR
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
