import type { SupportChatOpenDetail } from "@/lib/support/types";
import { SUPPORT_CHAT_OPEN_EVENT } from "@/lib/support/types";

export function openSupportChat(detail: SupportChatOpenDetail = { kind: "general" }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SUPPORT_CHAT_OPEN_EVENT, { detail }));
}

export function paidSongInquiryMessage(songTitle: string) {
  const label = songTitle.trim() || "my song";
  return `Hi! I'd like to inquire about ${label}.`;
}
