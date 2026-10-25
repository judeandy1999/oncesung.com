/** Strip legacy marketing-template contact values from forms and profile prefill. */
export function isDemoContact(email?: string | null, fullName?: string | null): boolean {
  const e = (email ?? "").trim().toLowerCase();
  const n = (fullName ?? "").trim().toLowerCase();
  if (!e && !n) return false;
  if (e === "gergely@example.com") return true;
  if (/^gergely(\s|\.|$)/.test(n) && (!e || e.endsWith("@example.com"))) return true;
  return false;
}

export function sanitizeContactPrefill(email?: string | null, fullName?: string | null) {
  if (isDemoContact(email, fullName)) return { email: "", fullName: "" };
  return { email: email?.trim() ?? "", fullName: fullName?.trim() ?? "" };
}
