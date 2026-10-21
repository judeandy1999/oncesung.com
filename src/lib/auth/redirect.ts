const FALLBACK = "/account";

/** Relative in-app path only. Blocks protocol-relative and external redirects. */
export function safeNextPath(value: string | null | undefined, fallback = FALLBACK) {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\") || value.includes("://") || value.includes("\0")) return fallback;
  const path = value.split("#")[0] ?? value;
  if (path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/forgot-password")) {
    return fallback;
  }
  return value;
}
