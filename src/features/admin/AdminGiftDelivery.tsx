"use client";

import { useState } from "react";
import { Copy, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminGiftDelivery({
  orderId,
  isGift,
  recipientEmail,
  giftUrl,
  tokenMissing,
}: {
  orderId: string;
  isGift: boolean;
  recipientEmail: string;
  giftUrl: string | null;
  tokenMissing: boolean;
}) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const copyLink = async () => {
    if (!giftUrl) return;
    try {
      await navigator.clipboard.writeText(giftUrl);
      toast("Gift link copied");
    } catch {
      toast("Could not copy — select the link and copy manually");
    }
  };

  const resend = async () => {
    setSending(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/resend-delivery`, {
        method: "POST",
        credentials: "same-origin",
        redirect: "follow",
      });
      if (response.redirected) {
        window.location.assign(response.url);
        return;
      }
      toast("Could not resend emails. Try again.");
    } catch {
      toast("Could not resend emails. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="notice" style={{ marginTop: 14 }}>
      <b className="small">Delivery</b>
      {!isGift ? (
        <p className="xs muted" style={{ margin: "6px 0 0" }}>
          Not marked as a gift — buyer listens from My Orders after you send the ready email.
        </p>
      ) : (
        <>
          <p className="xs muted" style={{ margin: "6px 0 0" }}>
            Recipient email: {recipientEmail || "— not saved on this order —"}
          </p>
          {tokenMissing ? (
            <p className="xs" style={{ color: "var(--coral-ink)", margin: "8px 0 0" }}>
              Gift link is not ready. Run the <code>gift_access_token</code> migration in Supabase, then resend.
            </p>
          ) : giftUrl ? (
            <p className="xs muted" style={{ margin: "8px 0 0", wordBreak: "break-all" }}>
              Private link: {giftUrl}
            </p>
          ) : null}
        </>
      )}
      <div className="row" style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}>
        {isGift && giftUrl ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => void copyLink()}
          >
            <Copy size={16} strokeWidth={1.8} /> Copy gift link
          </button>
        ) : null}
        <button type="button" className="btn btn-ghost btn-sm" disabled={sending} onClick={() => void resend()}>
          <Mail size={16} strokeWidth={1.8} /> {sending ? "Sending…" : "Resend delivery emails"}
        </button>
      </div>
    </div>
  );
}
