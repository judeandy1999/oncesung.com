export const PENDING_ORDER_COOKIE = "oncesung_pending_order";

export const pendingOrderCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
