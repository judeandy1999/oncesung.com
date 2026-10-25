"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OrderProgressTrack } from "@/features/orders/OrderProgressTrack";
import {
  estimatedDeliveryDate,
  formatShortDate,
  orderFulfillment,
  orderProgressSteps,
  orderReference,
} from "@/features/orders/order-progress";
import { formatCents, packageByKey, type PackageKey } from "@/lib/orders/catalog";

export type DashboardOrder = {
  id: string;
  package_key: PackageKey;
  amount_cents: number;
  recipient_name: string;
  occasion: string;
  paid_at: string | null;
  song_storage_path: string | null;
};

type Tab = "all" | "progress" | "done";

export function MyOrdersList({ orders }: { orders: DashboardOrder[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    let progress = 0;
    let done = 0;
    for (const order of orders) {
      if (order.song_storage_path) done += 1;
      else progress += 1;
    }
    return { all: orders.length, progress, done };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const fulfillment = orderFulfillment(Boolean(order.song_storage_path));
      if (tab === "progress" && fulfillment !== "in_progress") return false;
      if (tab === "done" && fulfillment !== "completed") return false;
      if (!q) return true;
      const hay = [
        order.recipient_name,
        order.occasion,
        orderReference(order.id),
        packageByKey(order.package_key).name,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, query, tab]);

  if (orders.length === 0) {
    return (
      <div className="card pad">
        <h2>No paid songs yet</h2>
        <p className="muted">When you pay for a song with PayPal, it will show up here with progress tracking.</p>
        <Link className="btn btn-primary" href="/song-intake">
          Create a New Song
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="row between" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 38, margin: 0 }}>My Orders</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Track your songs, request revisions, and download your files.
          </p>
        </div>
        <input
          className="input"
          style={{ maxWidth: 260 }}
          placeholder="Search your orders…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search orders"
        />
      </div>

      <div className="tabs" style={{ margin: "18px 0" }} role="tablist" aria-label="Filter orders">
        {(
          [
            ["all", "All Orders", counts.all],
            ["progress", "In Progress", counts.progress],
            ["done", "Completed", counts.done],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`tab chip${tab === key ? " on" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
            {count > 0 ? <span className="count">{count}</span> : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card pad">
          <p className="muted" style={{ margin: 0 }}>
            No orders match this filter.
          </p>
        </div>
      ) : (
        filtered.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))
      )}
    </>
  );
}

function OrderCard({ order }: { order: DashboardOrder }) {
  const pkg = packageByKey(order.package_key);
  const ready = Boolean(order.song_storage_path);
  const title = order.recipient_name ? order.recipient_name : "Your song";
  const steps = orderProgressSteps({ paidAt: order.paid_at, hasSongFile: ready });
  const est = estimatedDeliveryDate(order.paid_at, order.package_key);

  if (ready) {
    return (
      <article className="card pad-sm row between" data-status="done" style={{ marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
          <div className="ph gold" style={{ width: 90, flex: "none" }} aria-hidden />
          <div>
            <b>{title}</b>
            <div className="xs muted">
              Order #{orderReference(order.id)} · {order.occasion || "Song"}
            </div>
            <div className="xs muted">{pkg.name} · Delivered {formatShortDate(order.paid_at)}</div>
          </div>
        </div>
        <span className="badge green">Completed</span>
        <div style={{ width: "100%" }}>
          <OrderProgressTrack steps={steps} />
          <audio controls preload="none" src={`/api/orders/${order.id}/audio`} style={{ width: "100%", marginTop: 8 }} />
          <a className="btn btn-outline btn-sm" href={`/api/orders/${order.id}/audio?download=1`} style={{ marginTop: 8 }}>
            Listen &amp; Download
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className="card pad" data-status="progress" style={{ marginBottom: 12 }}>
      <div className="row between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
          <div className="ph sunset" style={{ width: 150, flex: "none" }} aria-hidden />
          <div>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <div className="xs muted">
              Order #{orderReference(order.id)} · {order.occasion || "Song"}
            </div>
            <div className="xs muted">
              {pkg.name} · <b style={{ color: "var(--ink)" }}>Paid {formatShortDate(order.paid_at)}</b>
            </div>
            <div className="xs muted">{formatCents(order.amount_cents)}</div>
          </div>
        </div>
        <span className="badge">In progress</span>
      </div>

      <OrderProgressTrack steps={steps} />

      <div className="grid" style={{ gridTemplateColumns: "1fr 200px", gap: 12 }}>
        <div className="notice">
          <div>
            <b className="small">We&apos;re creating your song!</b>
            <div className="xs muted">
              Our team is producing your song from your story. The first version is typically ready within{" "}
              {pkg.delivery.replace("-hour delivery", " hours")}.
            </div>
          </div>
        </div>
        <div className="card pad-sm center">
          <div className="xs muted">Estimated delivery</div>
          <b>{est}</b>
          <div className="xs muted">({pkg.delivery})</div>
        </div>
      </div>

      <p className="xs muted" style={{ marginBottom: 0 }}>
        Need changes after delivery? Use{" "}
        <Link className="link" href="/requests">
          Revisions &amp; Remakes
        </Link>
        .
      </p>
    </article>
  );
}
