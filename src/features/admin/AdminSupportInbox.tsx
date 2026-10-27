"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { SupportInquiryKind, SupportMessage } from "@/lib/support/types";

type InboxTab = "paid_song" | "general";

type AdminConversationRow = {
  id: string;
  kind: SupportInquiryKind;
  song_title: string;
  order_id: string | null;
  updated_at: string;
  customer_name: string;
  customer_email: string | null;
  last_message: string | null;
  last_message_at: string;
  last_sender_role: string | null;
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function previewLabel(row: AdminConversationRow) {
  if (row.kind === "paid_song") {
    return row.song_title ? `Song: ${row.song_title}` : "Paid song inquiry";
  }
  return "General inquiry";
}

export function AdminSupportInbox() {
  const [tab, setTab] = useState<InboxTab>("paid_song");
  const [conversations, setConversations] = useState<AdminConversationRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const switchTab = (next: InboxTab) => {
    if (next === tab) return;
    setTab(next);
    setSelectedId(null);
    setMessages([]);
    setDraft("");
  };

  const loadList = useCallback(async () => {
    setListError(null);
    const res = await fetch(`/api/admin/support/conversations?kind=${tab}`);
    const body = (await res.json()) as { conversations?: AdminConversationRow[]; error?: string };
    if (!res.ok) {
      setListError(body.error || "Could not load inquiries.");
      setConversations([]);
      return;
    }
    setConversations(body.conversations ?? []);
  }, [tab]);

  const loadThread = useCallback(async (id: string) => {
    setThreadError(null);
    const res = await fetch(`/api/admin/support/conversations/${id}/messages`);
    const body = (await res.json()) as { messages?: SupportMessage[]; error?: string };
    if (!res.ok) {
      setThreadError(body.error || "Could not load messages.");
      setMessages([]);
      return;
    }
    setMessages(body.messages ?? []);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  useEffect(() => {
    const run = () => void loadList();
    const kickoff = window.setTimeout(run, 0);
    const timer = window.setInterval(run, 8000);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
    };
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) return;
    const id = selectedId;
    const run = () => void loadThread(id);
    const kickoff = window.setTimeout(run, 0);
    const timer = window.setInterval(run, 4000);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
    };
  }, [loadThread, selectedId]);

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    const body = draft.trim();
    if (!body) return;

    setSending(true);
    setThreadError(null);
    const res = await fetch(`/api/admin/support/conversations/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const json = (await res.json()) as { message?: SupportMessage; error?: string };
    setSending(false);

    if (!res.ok || !json.message) {
      setThreadError(json.error || "Could not send reply.");
      return;
    }
    setDraft("");
    setMessages((prev) => [...prev, json.message!]);
    void loadList();
  };

  return (
    <div className="admin-inbox">
      <div className="tabs" role="tablist" aria-label="Inquiry type">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "paid_song"}
          className={`tab chip${tab === "paid_song" ? " on" : ""}`}
          onClick={() => switchTab("paid_song")}
        >
          Paid song inquiries
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "general"}
          className={`tab chip${tab === "general" ? " on" : ""}`}
          onClick={() => switchTab("general")}
        >
          General inquiries
        </button>
      </div>

      {listError ? <p className="form-error">{listError}</p> : null}

      <div className="admin-inbox-grid">
        <div className="admin-inbox-list card pad-sm">
          {conversations.length === 0 ? (
            <p className="xs muted" style={{ margin: 0 }}>
              No {tab === "paid_song" ? "paid song" : "general"} inquiries yet.
            </p>
          ) : (
            conversations.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`admin-inbox-item${row.id === selectedId ? " on" : ""}`}
                onClick={() => setSelectedId(row.id)}
              >
                <div className="row between" style={{ gap: 8, alignItems: "flex-start" }}>
                  <b className="small">{row.customer_name}</b>
                  <span className="xs muted">{formatWhen(row.last_message_at)}</span>
                </div>
                <div className="xs muted">{row.customer_email || "No email"}</div>
                <div className="xs" style={{ marginTop: 4 }}>
                  {previewLabel(row)}
                </div>
                {row.last_message ? (
                  <div className="xs muted" style={{ marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.last_sender_role === "admin" ? "You: " : ""}
                    {row.last_message}
                  </div>
                ) : null}
              </button>
            ))
          )}
        </div>

        <div className="admin-inbox-thread card pad-sm">
          {!selected ? (
            <p className="muted" style={{ margin: 0 }}>
              Select a conversation to read and reply.
            </p>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{selected.customer_name}</h2>
                <div className="xs muted">{selected.customer_email}</div>
                <div className="xs muted">{previewLabel(selected)}</div>
              </div>
              <div className="admin-inbox-messages" ref={scrollRef}>
                {messages.length === 0 ? (
                  <p className="xs muted">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`support-chat-bubble${msg.sender_role === "admin" ? " mine" : " theirs"}`}
                    >
                      <div>{msg.body}</div>
                      <time className="xs muted">{formatWhen(msg.created_at)}</time>
                    </div>
                  ))
                )}
              </div>
              {threadError ? <p className="form-error">{threadError}</p> : null}
              <form className="support-chat-compose" onSubmit={sendReply}>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Reply to customer…"
                  value={draft}
                  maxLength={4000}
                  disabled={sending}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !draft.trim()}>
                  Send reply
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
