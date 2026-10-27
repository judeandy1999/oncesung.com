export type SupportInquiryKind = "general" | "paid_song";

export type SupportConversation = {
  id: string;
  user_id: string;
  kind: SupportInquiryKind;
  order_id: string | null;
  song_title: string;
  created_at: string;
  updated_at: string;
};

export type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_role: "customer" | "admin";
  body: string;
  created_at: string;
};

export type SupportChatOpenDetail = {
  kind: SupportInquiryKind;
  orderId?: string;
  songTitle?: string;
  suggestedMessage?: string;
};

export const SUPPORT_CHAT_OPEN_EVENT = "oncesung:support-chat-open";
