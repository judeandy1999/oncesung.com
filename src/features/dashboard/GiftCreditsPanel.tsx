import Link from "next/link";
import { formatCents, packageByKey } from "@/lib/orders/catalog";
import type { ClaimedCreditSummary } from "@/lib/credits/queries";

export function GiftCreditsPanel({ credits }: { credits: ClaimedCreditSummary[] }) {
  if (credits.length === 0) return null;

  return (
    <div className="card pad" style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0, fontSize: 22 }}>Song gift credits</h2>
      <p className="muted small">These cover checkout in full for the package shown.</p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {credits.map((credit) => {
          const pkg = packageByKey(credit.package_key);
          return (
            <li key={credit.id} style={{ marginBottom: 10 }}>
              <b>{pkg.name}</b> · {formatCents(pkg.amountCents)}
              {credit.recipient_name ? ` · For ${credit.recipient_name}` : ""}
              <div style={{ marginTop: 6 }}>
                <Link className="btn btn-primary btn-sm" href={`/song-intake?credit=${encodeURIComponent(credit.id)}`}>
                  Create song with this credit
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
