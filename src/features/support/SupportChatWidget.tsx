"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SupportChatOpenDetail, SupportConversation, SupportMessage } from "@/lib/support/types";
import { SUPPORT_CHAT_OPEN_EVENT } from "@/lib/support/types";

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return "";
  }
}

function panelTitle(conversation: SupportConversation | null) {
  if (!conversation) return "Message us";
  if (conversation.kind === "paid_song" && conversation.song_title) {
    return conversation.song_title;
  }
  return "General inquiry";
}

export function SupportChatWidget({ userId, isAdmin }: { userId: string | null; isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hidden =
    isAdmin || pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register");

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("support_messages")
      .select("id, conversation_id, sender_role, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (loadError) {
      setError("Could not load messages.");
      return;
    }
    setMessages((data ?? []) as SupportMessage[]);
    requestAnimationFrame(scrollToBottom);
  }, [scrollToBottom]);

  const openConversation = useCallback(
    async (detail: SupportChatOpenDetail) => {
      if (!userId) {
        setOpen(true);
        return;
      }

      setLoading(true);
      setError(null);
      setMessages([]);
      setConversation(null);
      try {
        const res = await fetch("/api/support/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: detail.kind,
            orderId: detail.orderId,
            songTitle: detail.songTitle,
          }),
        });
        const body = (await res.json()) as { conversation?: SupportConversation; error?: string };
        if (!res.ok || !body.conversation) {
          setError(body.error || "Could not open chat.");
          setOpen(true);
          return;
        }
        setConversation(body.conversation);
        if (detail.suggestedMessage) setDraft(detail.suggestedMessage);
        setOpen(true);
        await loadMessages(body.conversation.id);
      } catch {
        setError("Could not open chat.");
        setOpen(true);
      } finally {
        setLoading(false);
      }
    },
    [loadMessages, userId],
  );

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<SupportChatOpenDetail>).detail ?? { kind: "general" };
      void openConversation(detail);
    };
    window.addEventListener(SUPPORT_CHAT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SUPPORT_CHAT_OPEN_EVENT, onOpen);
  }, [openConversation]);

  useEffect(() => {
    if (!conversation?.id || !userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`support:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const row = payload.new as SupportMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
          requestAnimationFrame(scrollToBottom);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversation?.id, scrollToBottom, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !conversation || !userId) return;

    setSending(true);
    setError(null);
    const supabase = createClient();
    const { data, error: sendError } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversation.id,
        sender_role: "customer",
        body,
      })
      .select("id, conversation_id, sender_role, body, created_at")
      .single();

    setSending(false);
    if (sendError || !data) {
      setError("Could not send your message.");
      return;
    }
    setDraft("");
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as SupportMessage]));
  };

  if (hidden) return null;

  const loginNext = encodeURIComponent(pathname || "/");

  return (
    <div className="support-chat-root" aria-live="polite">
      {open ? (
        <div className="support-chat-panel" role="dialog" aria-label="Support chat">
          <header className="support-chat-head">
            <div>
              <strong>{panelTitle(conversation)}</strong>
              <div className="xs muted">
                {conversation?.kind === "paid_song" ? "Paid song inquiry" : "We typically reply within a few hours"}
              </div>
            </div>
            <button type="button" className="icon-btn" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X size={18} strokeWidth={1.8} />
            </button>
          </header>

          {!userId ? (
            <div className="support-chat-guest pad">
              <p className="small" style={{ marginTop: 0 }}>
                Sign in to message our team about your order or a question.
              </p>
              <Link className="btn btn-primary btn-sm btn-block" href={`/login?next=${loginNext}`}>
                Log in to chat
              </Link>
              <Link className="btn btn-ghost btn-sm btn-block" href={`/register?next=${loginNext}`}>
                Create an account
              </Link>
            </div>
          ) : (
            <>
              <div className="support-chat-messages" ref={scrollRef}>
                {loading && messages.length === 0 ? (
                  <p className="xs muted center">Loading…</p>
                ) : null}
                {!loading && messages.length === 0 ? (
                  <p className="xs muted">Say hello — we&apos;re here to help with your song.</p>
                ) : null}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`support-chat-bubble${msg.sender_role === "customer" ? " mine" : " theirs"}`}
                  >
                    <div>{msg.body}</div>
                    <time className="xs muted">{formatTime(msg.created_at)}</time>
                  </div>
                ))}
              </div>
              {error ? <p className="support-chat-error xs">{error}</p> : null}
              <form className="support-chat-compose" onSubmit={sendMessage}>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Type your message…"
                  value={draft}
                  maxLength={4000}
                  disabled={!conversation || sending}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!conversation || sending || !draft.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        className="support-chat-fab"
        aria-expanded={open}
        aria-label={open ? "Close support chat" : "Open support chat"}
        onClick={() => {
          if (open) setOpen(false);
          else void openConversation({ kind: "general" });
        }}
      >
        {open ? <X size={22} strokeWidth={2} /> : <MessageCircle size={24} strokeWidth={1.8} />}
      </button>
    </div>
  );
}
