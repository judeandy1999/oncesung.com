/**
 * Labeled mock data for dashboard / downloads UI.
 * Not backed by a real order API.
 */
export type MockOrderStatus = "in_progress" | "ready" | "completed";

export type MockOrder = {
  id: string;
  title: string;
  status: MockOrderStatus;
  packageName: string;
  updatedLabel: string;
};

/** MOCK — local demo orders only */
export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "OS-1042",
    title: "Our First Year",
    status: "ready",
    packageName: "Signature",
    updatedLabel: "Ready to review",
  },
  {
    id: "OS-1038",
    title: "Happy Birthday, Liam",
    status: "in_progress",
    packageName: "Essential",
    updatedLabel: "In production",
  },
  {
    id: "OS-1021",
    title: "Thank You, Mom",
    status: "completed",
    packageName: "Concierge",
    updatedLabel: "Delivered",
  },
];
