export type { MockOrder, MockOrderStatus } from "@/data/mock-orders";

export type PackageKey = "essential" | "signature" | "concierge";

export type CheckoutStory = {
  occasion?: string;
  recipient?: string;
  relationship?: string;
  date?: string;
  genre?: string;
  mood?: string;
  moments?: string;
  details?: string;
};
