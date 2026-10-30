import Link from "next/link";
import { formatCents, packageByKey, type PackageKey } from "@/lib/orders/catalog";
import type { ClaimedCreditSummary } from "@/lib/credits/queries";

export function GiftCreditsNotice({
  credits,
  highlightPackageKey,
}: {
  credits: ClaimedCreditSummary[];
  highlightPackageKey?: PackageKey | null;
}) {
  if (credits.length === 0) return null;

  return (
    <div className="notice" style={{ marginBottom: 20, borderColor: "var(--coral)" }}>
      <b className="small">Song gift credit on your account</b>
      <ul className="small muted" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
        {credits.map((credit) => {
          const pkg = packageByKey(credit.package_key);
          const matches = highlightPackageKey && highlightPackageKey === credit.package_key;
          return (
            <li key={credit.id} style={{ marginBottom: 4 }}>
              <strong style={{ color: "var(--ink)" }}>{pkg.name}</strong> ({formatCents(pkg.amountCents)})
              {matches ? " — matches this order; use it on the payment step." : " — choose this package to use it."}
            </li>
          );
        })}
      </ul>
      <p className="xs muted" style={{ margin: "8px 0 0" }}>
        You will not pay with PayPal when you apply the credit on{" "}
        <Link href="/checkout/payment">payment</Link>.{" "}
        <Link href={`/song-intake?credit=${encodeURIComponent(credits[0].id)}`}>Continue your song</Link>
      </p>
    </div>
  );
}
