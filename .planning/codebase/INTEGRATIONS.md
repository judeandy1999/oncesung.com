# External Integrations

**Analysis Date:** 2026-10-25

## APIs & External Services

**Auth (live):**
- Supabase Auth — email/password sign-up, sign-in, sign-out, email confirmation, and password reset, plus Google OAuth.
  - SDK/Client: `@supabase/supabase-js` 2.118.0 and `@supabase/ssr` 0.12.7
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Server actions: `src/features/auth/actions.ts` (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`, `signOut`, `signInWithOAuth`)
  - Browser Google button: `src/features/auth/GoogleSignIn.tsx` posts to `googleSignInAction`, which sets `redirectTo` to `{origin}/auth/callback?next=…` and `queryParams.prompt=select_account`
  - Code exchange: `GET` `src/app/auth/callback/route.ts` calls `exchangeCodeForSession`, then may update `public.profiles.full_name` from user metadata
  - Session gate: `src/proxy.ts` → `updateSession` in `src/lib/supabase/middleware.ts`. Protected paths: `/account`, `/dashboard`, `/downloads`, `/song-player`, `/requests`. Guest-only: `/login`, `/register`, `/forgot-password`. Page-level guard: `requireUser` in `src/lib/auth/require-user.ts`
  - Google client credentials are not in this repository. They are configured on the Supabase project.

**Database API (live, narrow):**
- Supabase PostgREST via the same JS client.
  - Profile read: `getOwnProfile()` in `src/lib/account/profile.ts` selects `full_name, email` from `profiles`.
  - Profile name write: `POST` `src/app/api/account/profile/route.ts` updates `profiles.full_name` for the signed-in user. Zod body `{ fullName }` max 100 characters. The account page script in `src/features/account/account-script.ts` calls this endpoint. Phone stays in `localStorage` key `oncesung:profile` and is not a database column.
  - Purchase read helper: `listOwnPurchases()` in `src/lib/purchases.ts` selects `id, song_slug, order_reference, created_at` from `purchases`. No page or route calls it.

**Payments and billing (stubbed UI, no provider):**
- PayPal — visual option only. Markup in `src/data/page-html/checkout_payment.html` (`data-method="paypal"`), rendered by `src/app/checkout/payment/page.tsx`. `src/components/SiteInteractions.tsx` (`[data-paymethods]`) shows `#wallet-note` with the label “PayPal”. Submit does not redirect to PayPal. No PayPal JS SDK, REST client, client id, order id, or webhook handler exists.
- Card — same payment form, `data-method="card"` (default). Inputs `#cc-number`, `#cc-exp`, and a CVC field are required on the HTML form and formatted in `SiteInteractions`. Submit is cancelled before any request. Card data is not sent to a server route.
- Google Pay and Apple Pay — same form, `data-method="gpay"` and `data-method="apple"`. Same wallet note, no wallet SDK and no redirect.
- What the pay button does: the form has `data-demo` and `data-next="/order-confirmed"`. The handler in `src/components/SiteInteractions.tsx` (comment: “Demo forms — no real payment/email/auth”) calls `preventDefault`, toasts `Demo only — no payment was processed.` when the next path contains `order-confirmed`, then `router.push`. `/order-confirmed` (`src/app/order-confirmed/page.tsx` plus `html_order_confirmed`) is a static confirmation screen. It does not insert `public.purchases` and does not call `createAdminClient()`.
- Stripe — not present. No package, no `STRIPE_` env var, no Checkout Session or webhook route.
- Subscriptions — not present. No recurring price, billing portal, invoice table, or subscription status. The word “subscriber” appears only in affiliate marketing copy in `src/data/page-html/affiliates.html` (“no fixed subscriber minimum”), meaning audience size.
- Plans that do exist are one-time packages, stored in the browser:
  - `essential` — $49 — “48-hour delivery” in `src/lib/store.ts` `PACKAGES`
  - `signature` — $89 — default from `resolvePackage()`
  - `concierge` — $149
  - Display copy for the same three prices is in `src/data/page-html/pricing.html`, linked from `src/app/pricing/page.tsx`. Choosing a package sets localStorage `oncesung:package` via `[data-package]` clicks in `src/components/SiteInteractions.tsx`. Checkout totals (`[data-subtotal]`, `[data-total]`) equal the package price. No tax, discount, or currency conversion.
- Checkout details (real form, local persistence only): `src/features/checkout/CheckoutDetailsForm.tsx` validates with Zod and `react-hook-form`, writes `oncesung:details`, then `router.push("/checkout/payment")`. Not an external API.
- Gift cards — stub. `src/app/gift-cards/page.tsx` renders `html_gift_cards`. The buy form in `src/data/page-html/gift_cards.html` is `data-demo="Gift card added — continue to checkout to send it."` with chips `$49 · Essential`, `$89 · Signature`, `$149 · Concierge`. Submit only toasts. No gift-card table, code, balance, or redemption route.
- Referrals — stub. `src/app/referral/page.tsx` renders `html_referral`. A button copies the literal string `https://oncesung.com/r/GERGELY20` (`data-copy` in `src/data/page-html/referral.html`). Copy promises 20% off for both sides. There is no `/r/` route, referral table, or discount application in checkout.
- Affiliates — local draft, not an affiliate network. `src/app/affiliates/page.tsx` renders `html_affiliates` and mounts `src/features/affiliates/AffiliatesEnhancer.tsx`. The page eyebrow says the partner program is opening soon. The form says applications are not sent. Submit stores `oncesung-affiliate-draft-v1` in `localStorage` or downloads a `.txt` file. The calculator multiplies orders × package price × 0.25 (Essential $49, Signature $89, Concierge $149). Proposed terms in the HTML: 25% of eligible net song sales, 30-day last-click window, monthly USD payouts, $50 cleared minimum, 30-day refund hold. No affiliate platform SDK, tracking pixel, or payout API.
- Refunds — copy only. `src/app/guarantee/page.tsx` renders `html_guarantee` (“money-back guarantee”). No refund API.
- Orders and downloads — static. `src/app/dashboard/page.tsx` renders `html_dashboard` after `requireUser`. `src/app/downloads/page.tsx` renders `html_downloads` after `requireUser`. Download controls use `data-toast` (`Download starts when your real files are connected`, `Preparing your ZIP…`) and never fetch a file. `MOCK_ORDERS` in `src/data/mock-orders.ts` is not imported. `listOwnPurchases()` is not used to fill either page.
- Support email form — stub. FAQ aside form in `src/data/page-html/faq.html` is `data-demo` and toasts that a message was sent. No mailer is called.
- Transactional email preview — stub page. `src/app/email-confirmation/page.tsx` renders `html_email_confirmation`, a static inbox mock. Real auth mail is sent by Supabase Auth, not by this page.

**Fonts and metadata images (build-time / Next):**
- Google fonts through `next/font/google` in `src/app/layout.tsx` (Inter, DM Serif Display, Caveat). Fetched at build time by Next, not via a runtime font API in app code.
- Open Graph and icons are generated in-process with `next/og` (`src/app/opengraph-image.tsx`, `src/lib/brand-mark.tsx`). No external image CDN.

**Audio (same-origin static files):**
- Example songs play from `public/examples/*.mp3`. `src/components/SiteInteractions.tsx` sets `audio.src` from `data-audio`. These files are public previews. The purchases migration says not to upload them into the private bucket.

## Data Storage

**Databases:**
- Supabase Postgres (hosted). No ORM. Tables are created by SQL meant to be pasted into the Supabase SQL editor, in order:
  - `supabase/migrations/done/20261021120000_profiles.sql` — `public.profiles` (`id` → `auth.users`, `email`, `full_name` ≤ 100, timestamps). Trigger `handle_new_user` inserts a row on `auth.users` insert. RLS: authenticated users may select and update only their own row; update grant is limited to `full_name`.
  - `supabase/migrations/done/20261021120100_purchases.sql` — `public.purchases` (`id`, `user_id`, `song_slug`, `order_reference`, `created_at`, unique on user + slug + order reference). RLS: authenticated select own rows only. Grants do not include insert. Comment states inserts happen later with the service role so a user cannot grant themselves a song. No application code inserts rows.
  - `supabase/migrations/done/20261021120200_purchased_songs_bucket.sql` — storage bucket, below.
- Connection: `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the user-scoped client (`src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`). `SUPABASE_SERVICE_ROLE_KEY` is only referenced by the unused `createAdminClient()` in `src/lib/supabase/admin.ts` (`persistSession: false`, `autoRefreshToken: false`).
- Client: `@supabase/supabase-js`. Cookie session via `@supabase/ssr` `createServerClient` / `createBrowserClient`.

**File Storage:**
- Supabase Storage bucket `purchased-songs` — defined in SQL only. Private (`public = false`), 50 MB limit (`52428800`), MIME types `audio/mpeg`, `audio/wav`, `audio/x-wav`, `audio/wave`. No read policy for `anon` or `authenticated`. Comment says a later server route should check `public.purchases` and create a short-lived signed URL with the service role. That route does not exist. No `storage.from` or `createSignedUrl` call exists under `src/`.
- Local filesystem for public previews: `public/examples/*.mp3` (16 tracks) plus stock SVGs in `public/`. Served by Next as static files.

**Browser persistence (not a server):**
- `oncesungStore` in `src/lib/store.ts` uses `localStorage` keys prefixed `oncesung:` (falls back to `sessionStorage` on read). Used for package selection and checkout details.
- Song intake and account briefs use additional `localStorage` / `sessionStorage` keys (`oncesung:briefs`, `oncesung:story`, `oncesung:brief`, `oncesung:edit-brief`, `oncesung-song-intake-v1`) inside the legacy scripts. They are not synced to Supabase.
- Affiliate application drafts: `oncesung-affiliate-draft-v1` in `src/features/affiliates/AffiliatesEnhancer.tsx`.

**Caching:**
- None. No Redis, no `unstable_cache`, no CDN config in repo.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (GoTrue), with Google as an OAuth provider configured outside this repo.
  - Implementation: cookie session through `@supabase/ssr`. Server reads `cookies()` from `next/headers` in `src/lib/supabase/server.ts`. The proxy refreshes the session on matched requests.
  - Email confirmation redirect: `{origin}/auth/callback?next=/account` from `registerAction`.
  - Password reset redirect: `{origin}/auth/callback?next=/auth/reset-password` from `forgotPasswordAction`. Reset form is `src/features/auth/ResetPasswordForm.tsx` on `src/app/auth/reset-password/page.tsx`.
  - Origin for those links: `getSiteOrigin()` in `src/lib/auth/origin.ts`.
  - Validation: Zod schemas in `src/lib/auth/schema.ts` (email, password 8–72 characters, name 2–100).
  - Duplicate-account and rate-limit responses are mapped to generic messages in `src/features/auth/actions.ts`. Failed callback redirects to `/login?error=google`, `/login?error=link`, or `/forgot-password?error=expired`.
  - Profile row is created by the database trigger, not by the Next app. The callback only fills an empty `full_name` after Google (or other metadata) sign-in.

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, Datadog, or similar import. Next’s optional `@opentelemetry/api` peer is not installed.

**Logs:**
- No application logger. Auth and profile routes return user-facing strings. Supabase client errors on `listOwnPurchases()` are swallowed and return `[]`. Layout user lookup failures in `src/app/layout.tsx` set `email` to `null`.

## CI/CD & Deployment

**Hosting:**
- Not pinned in the repo. `.gitignore` lists `.vercel`. No `vercel.json`, Dockerfile, or host config. Intended public origin in code is `https://www.oncesung.com` (`metadataBase` in `src/app/layout.tsx`) with a non-www fallback in `src/app/robots.ts` and `src/app/sitemap.ts`.
- `src/app/robots.ts` allows all user agents and points at `{base}/sitemap.xml`. `src/app/sitemap.ts` lists marketing, checkout, account, and player routes, including `/checkout/payment` and `/order-confirmed`.

**CI Pipeline:**
- None. No `.github/workflows` and no other CI config.

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` — required for any Supabase call. Missing URL/anon key throws from `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`. The proxy treats a missing pair as “no session” and continues.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — same as above.
- `SUPABASE_SERVICE_ROLE_KEY` — required only if `createAdminClient()` is called. Nothing calls it today. Do not expose it to client components; `src/lib/supabase/admin.ts` imports `server-only`.
- `NEXT_PUBLIC_SITE_URL` — required for correct auth email links and canonical URLs off localhost. Optional locally because `getSiteOrigin()` falls back to the request host on localhost only.

**Not present (do not assume they exist):**
- No `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or similar names are read in `src/`.

**Secrets location:**
- `.gitignore` ignores `.env*`. No `.env.example` is committed. Do not commit service-role keys. Google OAuth secrets belong in the Supabase dashboard, not in Next env, unless a future direct Google integration is added.

## Webhooks & Callbacks

**Incoming:**
- None for payments. No `src/app/api/**/webhook` route. The only JSON API route is `POST /api/account/profile` (`src/app/api/account/profile/route.ts`), which updates the signed-in profile name.
- Auth callback (not a billing webhook): `GET /auth/callback` in `src/app/auth/callback/route.ts`. Query params: `code`, optional `next`, optional `sb_flow_id`, optional `error` / `error_description`. Exchanges the Supabase auth code for a session cookie, then redirects.

**Outgoing:**
- Supabase Auth HTTPS API (sign-in, sign-up, OAuth start, password reset, session exchange) from the server actions and the callback route.
- Browser redirect to the Google OAuth URL returned by `signInWithOAuth` (`redirect(data.url)` in `src/features/auth/actions.ts`).
- No outbound calls to PayPal, Stripe, a mail provider, or an affiliate network.

## Exists vs stubbed (payments, plans, billing)

| Surface | Status | Where |
|---------|--------|--------|
| One-time package catalog ($49 / $89 / $149) | Exists as data and pricing UI. Selection stored in `localStorage` (`oncesung:package`). Not a billing product id. | `src/lib/store.ts`, `src/data/page-html/pricing.html`, `src/components/SiteInteractions.tsx` |
| Checkout details | Exists as a validated React form. Saved locally, not in Supabase. | `src/features/checkout/CheckoutDetailsForm.tsx` |
| Card, PayPal, Google Pay, Apple Pay | Stub UI. No SDK, no charge, no redirect. Submit toasts and opens `/order-confirmed`. | `src/data/page-html/checkout_payment.html`, `src/components/SiteInteractions.tsx` |
| Order confirmation | Static page. Does not create an order. | `src/app/order-confirmed/page.tsx` |
| `public.purchases` | Schema and RLS exist. No insert path. Read helper has no callers. | `supabase/migrations/done/20261021120100_purchases.sql`, `src/lib/purchases.ts` |
| Service-role client | Factory exists. Unused. | `src/lib/supabase/admin.ts` |
| Purchased-song files | Private bucket defined. No upload and no signed-URL route. Downloads page toasts only. | `supabase/migrations/done/20261021120200_purchased_songs_bucket.sql`, `src/app/downloads/page.tsx` |
| Subscriptions / invoices | Not implemented. | — |
| Gift cards | Marketing form. Toast only. | `src/data/page-html/gift_cards.html` |
| Referrals | Hard-coded copy link. No redemption. | `src/data/page-html/referral.html` |
| Affiliates and payouts | Calculator and on-device draft. Applications are not submitted. | `src/features/affiliates/AffiliatesEnhancer.tsx`, `src/data/page-html/affiliates.html` |
| Refunds | Guarantee copy only. | `src/data/page-html/guarantee.html` |
| Auth email (confirm, reset) | Live, sent by Supabase Auth. | `src/features/auth/actions.ts` |
| “Confirmation email” page | Static preview, not a mail send. | `src/app/email-confirmation/page.tsx` |
| Profiles | Live. Trigger on sign-up; name editable via `POST /api/account/profile`. | `supabase/migrations/done/20261021120000_profiles.sql`, `src/app/api/account/profile/route.ts` |

When adding a processor, keep charges off the demo form. `form[data-demo]` must not be the PayPal or card submit path. Record a paid order with the service role into `public.purchases` (the table grants no insert to `authenticated`). Serve files from `purchased-songs` with a short-lived signed URL after that row exists. Do not treat `PACKAGES` prices as processor price ids until a provider product is created.

---

*Integration audit: 2026-10-25*
