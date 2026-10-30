"use client";

import { useRef, useState } from "react";
import { Copy } from "lucide-react";
import { AdminGiftDelivery } from "@/features/admin/AdminGiftDelivery";
import { AdminSongUploadForm } from "@/features/admin/AdminSongUploadForm";
import { useToast } from "@/hooks/use-toast";
import type { StoryBriefSection } from "@/lib/orders/story";

function briefPlainText(sections: StoryBriefSection[]): string {
  return sections.map((section) => `${section.title}\n${section.body}`).join("\n\n");
}

export function AdminOrderPanel({
  orderId,
  title,
  meta,
  badge,
  briefSections,
  hasFile,
  giftDelivery,
}: {
  orderId: string;
  title: string;
  meta: string;
  badge: { label: string; green: boolean };
  briefSections: StoryBriefSection[];
  hasFile: boolean;
  giftDelivery?: {
    isGift: boolean;
    recipientEmail: string;
    giftUrl: string | null;
    tokenMissing: boolean;
  };
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);
  const hasBrief = briefSections.length > 0;
  const preview = briefSections[0]?.body.split("\n").slice(0, 3).join("\n") ?? "";

  const copyBrief = async () => {
    const text = briefPlainText(briefSections);
    if (!text) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      toast("Song brief copied to clipboard");
    } catch {
      toast("Could not copy — select the text and copy manually");
    } finally {
      setCopying(false);
    }
  };

  return (
    <article className="card pad" style={{ marginBottom: 16 }}>
      <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
          <div className="xs muted">{meta}</div>
        </div>
        <span className={badge.green ? "badge green" : "badge"}>{badge.label}</span>
      </div>

      <div className="row" style={{ marginTop: 12, flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={!hasBrief}
          onClick={() => dialogRef.current?.showModal()}
        >
          View song brief
        </button>
        {!hasBrief ? <span className="xs muted">No brief text was saved on this order.</span> : null}
      </div>

      {hasBrief && preview ? (
        <p className="small muted" style={{ whiteSpace: "pre-wrap", margin: "10px 0 0" }}>
          {preview}
          {briefSections[0]?.body.includes("\n") ? "\n…" : ""}
        </p>
      ) : null}

      <AdminSongUploadForm orderId={orderId} hasFile={hasFile} />

      {hasFile && giftDelivery ? (
        <AdminGiftDelivery
          orderId={orderId}
          isGift={giftDelivery.isGift}
          recipientEmail={giftDelivery.recipientEmail}
          giftUrl={giftDelivery.giftUrl}
          tokenMissing={giftDelivery.tokenMissing}
        />
      ) : null}

      <dialog ref={dialogRef} className="admin-brief-dialog">
        <form method="dialog">
          <div className="admin-brief-dialog-head row between">
            <h3 style={{ margin: 0, fontSize: 22 }}>Song brief</h3>
            <div className="row" style={{ gap: 6 }}>
              <button
                type="button"
                className="icon-btn"
                aria-label="Copy song brief to clipboard"
                title="Copy to clipboard"
                disabled={copying || !hasBrief}
                onClick={() => void copyBrief()}
              >
                <Copy size={18} strokeWidth={1.8} />
              </button>
              <button type="submit" className="btn btn-ghost btn-sm" aria-label="Close">
                Close
              </button>
            </div>
          </div>
          <div className="admin-brief-dialog-body">
            {briefSections.map((block) => (
              <div key={block.title} className="admin-brief-section">
                <b className="small">{block.title}</b>
                <div className="admin-brief-pre">{block.body.trim()}</div>
              </div>
            ))}
          </div>
        </form>
      </dialog>
    </article>
  );
}
