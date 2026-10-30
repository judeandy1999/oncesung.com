"use client";

import { useMemo, useState } from "react";
import type { EmailPreviewItem } from "@/lib/email/preview-types";

type WidthMode = "desktop" | "mobile";

export function EmailPreviewGallery({ items }: { items: EmailPreviewItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [widthMode, setWidthMode] = useState<WidthMode>("desktop");

  const active = useMemo(() => items.find((item) => item.id === activeId) ?? items[0], [activeId, items]);

  if (!active) return null;

  const frameWidth = widthMode === "mobile" ? 320 : 560;

  return (
    <div className="row" style={{ alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
      <aside className="card pad" style={{ flex: "1 1 220px", maxWidth: 280 }}>
        <b style={{ display: "block", marginBottom: 12 }}>Live templates</b>
        <p className="xs muted" style={{ marginBottom: 14 }}>
          These match what Resend sends. The{" "}
          <a href="/email-confirmation">confirmation page mock</a> is a separate, richer design.
        </p>
        <nav style={{ display: "grid", gap: 6 }}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`btn btn-sm ${item.id === active.id ? "btn-primary" : "btn-ghost"}`}
              style={{ justifyContent: "flex-start", textAlign: "left" }}
              onClick={() => setActiveId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div style={{ flex: "2 1 360px", minWidth: 0 }}>
        <div className="row between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22 }}>{active.label}</h2>
            <p className="xs muted" style={{ margin: "4px 0 0" }}>
              {active.description}
            </p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className={`btn btn-sm ${widthMode === "desktop" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setWidthMode("desktop")}
            >
              Desktop
            </button>
            <button
              type="button"
              className={`btn btn-sm ${widthMode === "mobile" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setWidthMode("mobile")}
            >
              Mobile
            </button>
          </div>
        </div>

        <div className="card pad" style={{ marginBottom: 12 }}>
          <div className="xs muted">Subject</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>{active.subject}</div>
        </div>

        <div
          style={{
            margin: "0 auto",
            width: "100%",
            maxWidth: frameWidth + 32,
            border: "1px solid var(--line)",
            borderRadius: 14,
            overflow: "hidden",
            background: "#f6f7fb",
            boxShadow: "0 8px 28px rgba(40,22,48,.08)",
          }}
        >
          <iframe
            title={`${active.label} email preview`}
            srcDoc={active.html}
            style={{
              display: "block",
              width: "100%",
              height: 520,
              border: 0,
              background: "#f6f7fb",
            }}
          />
        </div>
      </div>
    </div>
  );
}
