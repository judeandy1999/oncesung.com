"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  body: string;
  href: string;
};

export function NotificationBanner() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    void fetch("/api/notifications")
      .then((r) => r.json())
      .then((body: { notifications?: Notification[] }) => setItems(body.notifications ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
      {items.map((item) => (
        <Link key={item.id} href={item.href || "/dashboard"} className="notice row between" style={{ textDecoration: "none" }}>
          <div>
            <b className="small">{item.title}</b>
            {item.body ? <div className="xs muted">{item.body}</div> : null}
          </div>
          <span className="xs">Open →</span>
        </Link>
      ))}
    </div>
  );
}
