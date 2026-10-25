# Technology Stack

**Analysis Date:** 2026-10-25

## Languages

**Primary:**
- TypeScript 5.9.3 (locked) — application code under `src/`. `tsconfig.json` sets `"strict": true`, `"jsx": "react-jsx"`, `"moduleResolution": "bundler"`, `"noEmit": true`, and the path alias `@/*` → `./src/*`.
- SQL — hand-applied schema in `supabase/migrations/done/`. There is no `supabase/config.toml` and no ORM.

**Secondary:**
- CSS — Tailwind CSS 4 entry plus site styles. `src/app/globals.css` starts with `@import "tailwindcss"` and then imports `src/styles/oncesung.css`, `src/styles/affiliates.css`, `src/styles/page-extras.css`, and `src/styles/intake.css`.
- HTML strings — most marketing and checkout screens are static markup exported from `src/data/page-content.ts` (sourced from `src/data/page-html/`). Interactive account, intake, and requests screens ship legacy scripts in `src/features/account/account-script.ts`, `src/features/intake/intake-script.ts`, and `src/features/requests/requests-script.ts`.
- JavaScript (untyped legacy sources, ignored by ESLint) — `src/features/account/account.raw.js`, `src/features/intake/intake-core.raw.js`, `src/features/intake/intake-ui.raw.js`, `src/features/requests/requests.raw.js`.

## Runtime

**Environment:**
- Node.js. `package.json` has no `engines` field. Locked `next@16.4.2` requires `node >= 20.9.0`. Locked `@supabase/supabase-js@2.118.0` and `@supabase/storage-js@2.118.0` declare `node >= 22.0.0`. Dev types are `@types/node@20.19.43`. Use Node 22 or newer so the locked Supabase client matches its declared engine. No `.nvmrc` or `.node-version`.

**Package Manager:**
- npm
- Lockfile: present — `package-lock.json` (`lockfileVersion` 3). Package name in `package.json` is `vamossy-site` at `0.1.0`, `"private": true`. No `pnpm-lock.yaml` or `yarn.lock`.

## Frameworks

**Core:**
- Next.js 16.4.2 — App Router in `src/app/`. Scripts in `package.json`: `next dev`, `next build`, `next start`. Config file `next.config.ts` is an empty `NextConfig` object. Request interception is `src/proxy.ts` (default export `proxy` plus `config.matcher`). There is no `middleware.ts`.
- React 19.1.0 and `react-dom` 19.1.0 — UI. Auth forms use `useActionState` with server actions in `src/features/auth/actions.ts`.
- Tailwind CSS 4.3.3 with `@tailwindcss/postcss` 4.3.3 — `postcss.config.mjs` registers the plugin `"@tailwindcss/postcss"` only. Tailwind is a devDependency; layout styling is mostly the imported CSS class system, not utility-only markup.

**Testing:**
- Not detected. `package.json` has no test script and no Jest, Vitest, Playwright, or Testing Library dependency. No `*.test.*` or `*.spec.*` files.

**Build/Dev:**
- TypeScript 5.9.3 — `npm run typecheck` runs `tsc --noEmit`.
- ESLint 9.39.5 with `eslint-config-next` 16.4.2 — `eslint.config.mjs` spreads `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. `npm run lint` runs `eslint .`. Ignores include `src/features/**/*.raw.js` and `src/data/page-html/**`.
- `next/font/google` — Inter, DM Serif Display, and Caveat in `src/app/layout.tsx`. CSS variables `--font-inter`, `--font-dm-serif`, `--font-caveat` map onto `--sans`, `--serif`, and `--script` in `src/app/globals.css`.
- `next/og` `ImageResponse` — `src/app/opengraph-image.tsx`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/lib/brand-mark.tsx`.

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.118.0 — Auth, Postgres queries, and (via the client) Storage. Server cookie client is `@supabase/ssr` 0.12.7 in `src/lib/supabase/server.ts` and `src/lib/supabase/middleware.ts`. Browser client is `src/lib/supabase/client.ts`. Service-role factory is `src/lib/supabase/admin.ts` and is not imported anywhere else.
- `zod` 3.25.76 — auth field schemas in `src/lib/auth/schema.ts` and the profile body schema in `src/app/api/account/profile/route.ts`.
- `react-hook-form` 7.90.0 and `@hookform/resolvers` 5.9.2 — checkout details form only, `src/features/checkout/CheckoutDetailsForm.tsx`, resolved with `zodResolver`.
- `server-only` 0.0.1 — imported by `src/lib/supabase/admin.ts` and `src/lib/purchases.ts` so those modules cannot be bundled for the browser.
- `lucide-react` 1.59.0 — icons on the React checkout details form (`src/features/checkout/CheckoutDetailsForm.tsx`). Most other icons are inline SVG in the HTML strings.

**Payments, plans, and billing (no SDK):**
- There is no PayPal, Stripe, Apple Pay, or Google Pay package in `package.json` or `package-lock.json`. No payment, subscription, or webhook environment variable is read anywhere under `src/`.
- Sellable plans are one-time song packages, not subscriptions. Canonical prices live in `PACKAGES` in `src/lib/store.ts` and are repeated in `src/data/page-html/pricing.html`: Essential $49, Signature $89 (default), Concierge $149. `resolvePackage()` falls back to `"signature"`.
- Package choice is browser state. `src/components/SiteInteractions.tsx` writes `oncesung:package` through `oncesungStore.set` when a `[data-package]` link or `[data-pkg-group]` control is used, then fills `[data-pkg-name]`, `[data-pkg-price]`, `[data-total]`, and related nodes.
- Checkout payment is a stub. `src/app/checkout/payment/page.tsx` renders `html_checkout_payment` from `src/data/page-content.ts` (markup in `src/data/page-html/checkout_payment.html`). The form is `form[data-demo]` with `data-next="/order-confirmed"`. `src/components/SiteInteractions.tsx` prevents submit, toasts `Demo only — no payment was processed.`, and calls `router.push`. Card, PayPal, Google Pay, and Apple Pay are visual options only (`data-method="card"|"paypal"|"gpay"|"apple"`). Selecting a wallet toggles `#wallet-note` (“You'll be redirected to …”). Nothing redirects to PayPal or a wallet. `#cc-number` and `#cc-exp` are formatted in the browser and are not posted.
- Buyer details on `src/app/checkout/details/page.tsx` are saved with `oncesungStore.set("details", …)` in `src/features/checkout/CheckoutDetailsForm.tsx` (localStorage key `oncesung:details`) and then routed to `/checkout/payment`. The form default values are demo data (`Gergely`, `gergely@example.com`). They are not written to Supabase.
- Gift cards, referrals, affiliates, and the money-back guarantee page are marketing or local-only UI. See INTEGRATIONS.md for the exists-versus-stubbed split.
- Purchase entitlement schema exists and is unused by the app: `public.purchases` in `supabase/migrations/done/20261021120100_purchases.sql`, reader `listOwnPurchases()` in `src/lib/purchases.ts` (no callers), and private Storage bucket `purchased-songs` in `supabase/migrations/done/20261021120200_purchased_songs_bucket.sql`. `src/data/mock-orders.ts` (`MOCK_ORDERS`) is also unused; dashboard and downloads pages render static HTML.

**Infrastructure:**
- No Redis, queue, email SDK, analytics SDK, or error-tracking SDK.
- Static example audio is served from `public/examples/*.mp3` (16 files). Download buttons on the downloads page do not point at those files.

## Configuration

**Environment:**
- Read at runtime. Names only; no committed example file was found. `.gitignore` ignores `.env*`.
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL. Required by `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/admin.ts`. `src/lib/supabase/middleware.ts` skips session refresh when it is missing.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key. Same call sites as the URL, except the admin client.
- `SUPABASE_SERVICE_ROLE_KEY` — service role key for `createAdminClient()` in `src/lib/supabase/admin.ts`. That function is unused, so a missing key does not affect current pages. The purchases migration comment says future inserts and signed URLs must use this key.
- `NEXT_PUBLIC_SITE_URL` — absolute site origin. `src/app/layout.tsx` falls back to `https://www.oncesung.com`. `src/app/robots.ts` and `src/app/sitemap.ts` fall back to `https://oncesung.com` (no `www`). `src/lib/auth/origin.ts` prefers this value for Supabase email links; if unset, it allows only `localhost` / `127.0.0.1` and otherwise returns `http://localhost:3000`.
- Google OAuth client id and secret are not in this repo. `googleSignInAction` in `src/features/auth/actions.ts` calls `supabase.auth.signInWithOAuth({ provider: "google" })`. Provider credentials live in the Supabase project.

**Build:**
- `next.config.ts` — empty Next config.
- `tsconfig.json` — compiler options above. Includes `next-env.d.ts` (gitignored) and `.next` type roots.
- `postcss.config.mjs` — Tailwind PostCSS plugin.
- `eslint.config.mjs` — Next core-web-vitals plus TypeScript.
- `src/proxy.ts` — matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and static extensions `svg`, `png`, `jpg`, `jpeg`, `gif`, `webp`, `ico`, `mp3`, `wav`.
- No `vercel.json`, no Dockerfile, no GitHub Actions workflow.

## Platform Requirements

**Development:**
- Node 22 or newer (satisfies Next `>=20.9.0` and locked Supabase `>=22`).
- npm install from `package-lock.json`.
- A Supabase project with the three SQL files in `supabase/migrations/done/` applied in filename order (comments say to run them in the Supabase SQL editor). Google provider enabled in that project if Google sign-in is used.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set for auth. `NEXT_PUBLIC_SITE_URL` set when email confirmation and password-reset links must leave localhost.
- Commands: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run build`.

**Production:**
- `next build` then `next start`, or a Next.js host. `.gitignore` ignores `.vercel`, and `public/vercel.svg` is the stock Next asset. No deployment manifest is committed.
- Public site identity in code is Oncesung (`SITE_NAME` in `src/lib/routes.ts`). Metadata base defaults to `https://www.oncesung.com`.
- Same Supabase env vars as development. Service-role key is only needed once purchase inserts or signed download URLs are implemented.
- No payment provider account is wired. Checkout cannot charge a card or PayPal until a processor is added.

---

*Stack analysis: 2026-10-25*
