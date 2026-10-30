import type { OwnProfile } from "@/lib/account/profile";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Fills the static account page with the signed-in profile. */
export function withAccountProfile(html: string, profile: OwnProfile) {
  const name = escapeHtml(profile.fullName);
  const email = escapeHtml(profile.email);
  const initial = escapeHtml((profile.fullName || profile.email || "?").trim().charAt(0).toUpperCase() || "?");
  const payload = JSON.stringify({ name: profile.fullName, email: profile.email }).replace(/</g, "\\u003c");

  return `<script type="application/json" id="acct-server-profile">${payload}</script>${html}`
    .replace('data-acct-initial>?</span>', `data-acct-initial>${initial}</span>`)
    .replace("data-acct-name>Your account</b>", `data-acct-name>${name || "Your account"}</b>`)
    .replace('data-acct-email>Saved on this device</div>', `data-acct-email>${email || "Signed in"}</div>`)
    .replace(
      'id="pf-name" name="name" autocomplete="name" placeholder="Your name"',
      `id="pf-name" name="name" autocomplete="name" placeholder="Your name" value="${name}"`,
    )
    .replace(
      'id="pf-email" name="email" type="email" autocomplete="email" placeholder="you@example.com"',
      `id="pf-email" name="email" type="email" autocomplete="email" value="${email}" readonly`,
    )
    .replace(
      "Your account details and briefs are saved in this browser. Avoid saving them on a shared device.",
      "Your name and email come from your sign-in. Song briefs stay in this browser.",
    );
}
