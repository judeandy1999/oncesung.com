import Link from "next/link";
import { formatCents, packageByKey, type PackageKey } from "@/lib/orders/catalog";

export function CheckoutPaymentSummary({
  packageKey,
  recipientName,
  occasion,
}: {
  packageKey: PackageKey;
  recipientName: string;
  occasion: string;
}) {
  const pkg = packageByKey(packageKey);
  const total = formatCents(pkg.amountCents);

  return (
    <aside>
      <div className="card pad">
        <div className="row between">
          <b>Order summary</b>
          <Link className="link small" href="/checkout/review">
            Change package
          </Link>
        </div>
        <div className="row" style={{ flexWrap: "nowrap", margin: "12px 0" }}>
          <div className="ph sunset ph-sq" style={{ width: 64, flex: "none" }} aria-hidden />
          <div>
            <b className="small">{pkg.name} Package</b>
            <div>{total}</div>
            <div className="xs muted">{pkg.delivery}</div>
            {recipientName ? (
              <div className="xs muted" style={{ marginTop: 4 }}>
                For {recipientName}
                {occasion ? ` · ${occasion}` : ""}
              </div>
            ) : null}
          </div>
        </div>
        <div className="divider" style={{ margin: "10px 0" }} />
        <div className="sum-row">
          <span>Subtotal</span>
          <span>{total}</span>
        </div>
        <div className="sum-row">
          <span className="muted">Tax (estimated)</span>
          <span>$0.00</span>
        </div>
        <div className="sum-row total">
          <span>Total (USD)</span>
          <span>{total}</span>
        </div>
      </div>
      <p className="xs muted" style={{ marginTop: 14 }}>
        You chose this package on the review step. To pick a different one, use Change package — then return here to pay.
      </p>
    </aside>
  );
}
