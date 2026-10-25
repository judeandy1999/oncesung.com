# Codebase Structure

**Analysis Date:** 2026-10-25

## Directory Layout

```
oncesung.com/
├── src/
│   ├── proxy.ts                 # Request proxy (session + route gates)
│   ├── app/                     # App Router routes, layout, metadata, one API route
│   ├── components/              # Chrome, HTML mount, legacy mount
│   ├── features/                # Auth, checkout details, intake, account, requests, affiliates
│   ├── lib/                     # Supabase, auth helpers, store, routes, purchases
│   ├── data/                    # HTML catalog, readable HTML copies, unused mock orders
│   ├── hooks/                   # Toast context
│   ├── styles/                  # Design CSS imported by globals.css
│   └── types/                   # Re-exports mock order and checkout story types
├── supabase/migrations/done/    # profiles, purchases, purchased-songs bucket
├── public/examples/             # Example preview MP3s (not purchased files)
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json                # @/* → src/*
├── eslint.config.mjs
├── postcss.config.mjs
├── AGENTS.md
└── README.md
```

## Directory Purposes

**`src/app/`:**
- Purpose: URLs, root chrome, and metadata routes.
- Contains: One `page.tsx` per screen, `layout.tsx`, `globals.css`, `sitemap.ts`, `robots.ts`, `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `api/account/profile/route.ts`, `auth/callback/route.ts`.
- Key files: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/account/page.tsx`, `src/app/checkout/payment/page.tsx`, `src/app/song-intake/page.tsx`

**`src/components/`:**
- Purpose: Shared UI that is not a feature wizard.
- Contains: Header, footer, logo, HTML injector, legacy script host, site-wide DOM behaviors.
- Key files: `src/components/HtmlMain.tsx`, `src/components/LegacyInteractivePage.tsx`, `src/components/SiteInteractions.tsx`, `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx`, `src/components/Logo.tsx`

**`src/features/auth/`:**
- Purpose: Sign-in, registration, Google, password reset. Real server actions.
- Contains: `actions.ts`, `schema` consumers, form components, `AuthShell.tsx`, `GoogleSignIn.tsx`.
- Key files: `src/features/auth/actions.ts`, `src/features/auth/LoginForm.tsx`, `src/features/auth/RegisterForm.tsx`, `src/features/auth/ForgotPasswordForm.tsx`, `src/features/auth/ResetPasswordForm.tsx`

**`src/features/checkout/`:**
- Purpose: The one checkout step written as React.
- Contains: `CheckoutDetailsForm.tsx` only. Package, review, and payment screens are HTML pages.
- Key files: `src/features/checkout/CheckoutDetailsForm.tsx`

**`src/features/intake/`:**
- Purpose: Song questionnaire wizard.
- Contains: Shell string, compiled script string, readable `.raw.js`, and `shell.html`.
- Key files: `src/features/intake/shell.ts`, `src/features/intake/intake-script.ts`, `src/features/intake/intake-core.raw.js`, `src/features/intake/intake-ui.raw.js`

**`src/features/account/`:**
- Purpose: Account wizard HTML, script, and server-profile injection.
- Contains: `account-html.ts`, `account-script.ts`, `account.raw.js`, `with-account-profile.ts`.
- Key files: `src/features/account/with-account-profile.ts`, `src/features/account/account-script.ts`

**`src/features/requests/`:**
- Purpose: Revisions and remakes wizard, browser-local threads, package limits.
- Contains: `requests-html.ts`, `requests-script.ts`, `requests.raw.js`.
- Key files: `src/features/requests/requests-script.ts`

**`src/features/affiliates/`:**
- Purpose: Client enhancer for the static affiliates page (earnings math and application draft).
- Contains: `AffiliatesEnhancer.tsx`.
- Key files: `src/features/affiliates/AffiliatesEnhancer.tsx`

**`src/lib/`:**
- Purpose: Shared server and browser helpers with no UI.
- Contains: `supabase/`, `auth/`, `account/`, `store.ts`, `routes.ts`, `purchases.ts`, `run-legacy-script.ts`, `brand-mark.tsx`.
- Key files: `src/lib/store.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/lib/supabase/admin.ts`, `src/lib/auth/require-user.ts`, `src/lib/purchases.ts`, `src/lib/account/profile.ts`

**`src/data/`:**
- Purpose: Screen HTML. Runtime pages import `page-content.ts`. `page-html/` is the line-broken source copy and is not imported.
- Contains: `page-content.ts`, `page-html/*.html`, `mock-orders.ts`.
- Key files: `src/data/page-content.ts`, `src/data/page-html/pricing.html`, `src/data/page-html/checkout_payment.html`, `src/data/page-html/dashboard.html`, `src/data/mock-orders.ts`

**`src/styles/`:**
- Purpose: Design-system CSS. Tailwind is loaded from `src/app/globals.css`, which also imports these files.
- Contains: `oncesung.css`, `page-extras.css`, `intake.css`, `affiliates.css`.
- Key files: `src/styles/oncesung.css`, `src/app/globals.css`

**`src/hooks/`:**
- Purpose: Client React hooks.
- Contains: `use-toast.tsx` only.
- Key files: `src/hooks/use-toast.tsx`

**`src/types/`:**
- Purpose: Shared types that pages and features can import from `@/types`.
- Contains: `index.ts` re-exporting `MockOrder` and declaring `PackageKey` and `CheckoutStory`. `PackageKey` is also declared in `src/lib/store.ts`.
- Key files: `src/types/index.ts`

**`supabase/migrations/done/`:**
- Purpose: SQL applied on a Supabase project, in filename order.
- Contains: Profile trigger and RLS, purchases table and RLS, private storage bucket.
- Key files: `supabase/migrations/done/20261021120000_profiles.sql`, `supabase/migrations/done/20261021120100_purchases.sql`, `supabase/migrations/done/20261021120200_purchased_songs_bucket.sql`

**`public/`:**
- Purpose: Static files served as-is. Example songs live under `public/examples/*.mp3` and are referenced by `data-audio` in the HTML. Purchased audio does not belong here. The bucket comment in the storage migration says to keep previews on the website and uploads in `purchased-songs`.
- Contains: MP3 previews and default SVG placeholders.
- Key files: `public/examples/our-first-year.mp3`

## Key File Locations

**Entry Points:**
- `src/proxy.ts`: Session refresh and auth redirects for matched requests.
- `src/app/layout.tsx`: Root UI and the signed-in email passed to chrome.
- `src/app/page.tsx`: Home. Pattern for every static marketing page.
- `src/app/auth/callback/route.ts`: OAuth and email-link return.
- `src/app/api/account/profile/route.ts`: The only JSON API. Updates the signed-in profile name.
- `src/app/sitemap.ts`: Public path list. Keep it aligned with real routes.
- `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/app/opengraph-image.tsx`: Generated brand images via `src/lib/brand-mark.tsx`.

**Configuration:**
- `package.json`: Scripts `dev`, `build`, `start`, `lint`, `typecheck`.
- `next.config.ts`: Empty Next config object.
- `tsconfig.json`: Path alias `@/*` → `./src/*`.
- `eslint.config.mjs`: `eslint-config-next` core-web-vitals and TypeScript. Ignores `src/features/**/*.raw.js` and `src/data/page-html/**`.
- `postcss.config.mjs`: `@tailwindcss/postcss`.
- `src/app/globals.css`: Tailwind import plus `src/styles/*`.
- Environment variables read by code (no env file is part of the source tree): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Core Logic:**
- `src/lib/store.ts`: Package catalog and browser JSON store. This is the runtime price list.
- `src/components/SiteInteractions.tsx`: Package selection, order summary fill, demo payment submit, audio, quiz, dashboard tabs.
- `src/lib/run-legacy-script.ts`: Rewrites wizard navigations to App Router paths and mirrors `oncesung:` session keys into `localStorage`.
- `src/features/intake/intake-script.ts`: Brief model, validation, checkout handoff.
- `src/features/auth/actions.ts`: All auth mutations.
- `src/lib/supabase/middleware.ts`: `PROTECTED` and guest-only path lists.
- `src/lib/purchases.ts`: Read path for paid songs. No page imports it yet.
- `src/lib/supabase/admin.ts`: Service-role client for a future payment confirmation route and signed download URLs.

**Checkout and account screens:**
- `src/app/pricing/page.tsx`: Package marketing. Links carry `data-package` and `href="/checkout/package"`.
- `src/app/checkout/package/page.tsx`: Package picker HTML. Continue link goes to `/song-intake`.
- `src/app/song-intake/page.tsx`: Brief wizard.
- `src/app/checkout/review/page.tsx`: Story plus package summary. Next link is `/checkout/details`.
- `src/app/checkout/details/page.tsx`: React details form.
- `src/app/checkout/payment/page.tsx`: Demo card form. Next path is `/order-confirmed`.
- `src/app/order-confirmed/page.tsx`: Static confirmation. No order write.
- `src/app/account/page.tsx`: Protected account wizard.
- `src/app/dashboard/page.tsx`: Protected static “My Orders” HTML.
- `src/app/downloads/page.tsx`: Protected static download screen. Buttons toast instead of fetching storage.
- `src/app/song-player/page.tsx`: Protected static player HTML.
- `src/app/requests/page.tsx`: Protected revisions wizard.
- `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/forgot-password/page.tsx`, `src/app/auth/reset-password/page.tsx`: Auth screens.

**Testing:**
- No test directory, no `*.test.*` or `*.spec.*` files, and no test runner in `package.json`.

## Naming Conventions

**Files:**
- Routes: `src/app/<kebab-segment>/page.tsx`. Nested checkout is `src/app/checkout/<step>/page.tsx`.
- React components: PascalCase filename matching the export (`CheckoutDetailsForm.tsx`, `SiteHeader.tsx`, `HtmlMain.tsx`).
- Feature barrels are not used. Import the module file directly (`@/features/auth/actions`).
- HTML runtime exports: `html_<snake>` in `src/data/page-content.ts` (`html_checkout_payment`, `html_song_player`, `html_home`).
- Readable HTML copies: `src/data/page-html/<snake-or-kebab>.html`. Some names are duplicated with a double underscore (`checkout__payment.html` beside `checkout_payment.html`, `song_player.html` beside `song-player.html`). Treat the `page-content.ts` export as the one a route loads.
- Legacy sources: `*.raw.js` next to the string module that pages import (`account.raw.js` vs `account-script.ts`).
- SQL: `supabase/migrations/done/<YYYYMMDDHHMMSS>_<name>.sql`.
- Library modules: kebab or single word under `src/lib/` (`require-user.ts`, `purchases.ts`, `store.ts`).

**Directories:**
- URL segments are kebab-case (`song-intake`, `forgot-password`, `gift-finder`, `order-confirmed`).
- Feature folders are singular nouns (`auth`, `checkout`, `intake`, `account`, `requests`, `affiliates`).
- Supabase helpers live in `src/lib/supabase/`. Auth helpers live in `src/lib/auth/`. Profile reads live in `src/lib/account/`.

**Symbols:**
- Package ids are the string union `essential` | `signature` | `concierge` (`PackageKey` in `src/lib/store.ts`).
- Browser keys are either `oncesung:<name>` via `oncesungStore` (`package`, `story`, `details`) or a full key written by a legacy script (`oncesung:briefs`, `oncesung:brief`, `oncesung:requests`, `oncesung:profile`, `oncesung:edit-brief`, `oncesung-song-intake-v1`, `oncesung-affiliate-draft-v1`).
- Server actions are named `*Action` or `signOut` and live in `src/features/auth/actions.ts` with `"use server"`.
- DOM hooks use `data-*` (`data-package`, `data-pkg`, `data-pkg-group`, `data-show`, `data-demo`, `data-next`, `data-toast`, `data-audio`, `data-select`).

## Where to Add New Code

**New marketing or static screen:**
- Primary code: add `export const html_<snake>` to `src/data/page-content.ts`. Keep a readable copy in `src/data/page-html/<name>.html` if you maintain that folder.
- Route: `src/app/<kebab>/page.tsx` that returns `<HtmlMain html={html_<snake>} />` and exports `metadata`. Copy `src/app/pricing/page.tsx`.
- Navigation: add the legacy filename, if any, to `HTML_TO_PATH` in `src/lib/routes.ts`. Add the path to the `routes` array in `src/app/sitemap.ts`. Add a header or footer link in `src/lib/routes.ts` (`NAV_LINKS` or `MOBILE_EXTRA_LINKS`) or `src/components/SiteFooter.tsx` when the screen should be discoverable.
- Behavior: prefer `data-*` hooks already implemented in `src/components/SiteInteractions.tsx`. If the behavior is local to one page, add a client enhancer beside the page the way `src/app/affiliates/page.tsx` renders `AffiliatesEnhancer`.

**New step in the song purchase flow:**
- Package catalog and prices: `PACKAGES` in `src/lib/store.ts`, then the matching price cards in `src/data/page-content.ts` (pricing and checkout HTML).
- Revision counts for that package: `LIMITS` in `src/features/requests/requests-script.ts`.
- A React step: `src/features/checkout/<Name>.tsx` and a `page.tsx` under `src/app/checkout/<step>/`. Persist with `oncesungStore` until a server order exists. Follow `CheckoutDetailsForm` for client validation and `router.push`.
- A real charge: new server route under `src/app/api/` (or a server action) that verifies the provider, then `createAdminClient()` and insert into `purchases`. Do not extend `form[data-demo]` in `src/components/SiteInteractions.tsx` into a card-number POST. Surface paid songs with `listOwnPurchases()` from `src/lib/purchases.ts` inside the server page that replaces the static HTML in `src/app/dashboard/page.tsx` and `src/app/downloads/page.tsx`.
- Signed download: server route only, using `src/lib/supabase/admin.ts` and the `purchased-songs` bucket. Gate it with `requireUser` and a `purchases` row. Keep preview MP3s in `public/examples/`.

**New signed-in screen:**
- Page: `src/app/<kebab>/page.tsx` calling `await requireUser("/<kebab>")` from `src/lib/auth/require-user.ts`.
- Proxy: add the same path to `PROTECTED` in `src/lib/supabase/middleware.ts`.
- Profile fields that belong to the user: extend `public.profiles` with a new migration under `supabase/migrations/done/`, and read or update through `src/lib/supabase/server.ts` (RLS). Name updates already go through `src/app/api/account/profile/route.ts`.
- Data that is only a draft on this device: `oncesungStore` or a `oncesung:` localStorage key, and say so in the UI the way `withAccountProfile` does for briefs.

**New legacy wizard:**
- Implementation: `src/features/<name>/<name>-html.ts` and `<name>-script.ts` string exports. Put the readable script in `<name>.raw.js` and keep the string in sync.
- Route: mount with `LegacyInteractivePage` from `src/components/LegacyInteractivePage.tsx` and a unique `label`, as `src/app/requests/page.tsx` does.
- In-script navigation: keep using the replacements in `rewriteLegacyNavInSource` (`src/lib/run-legacy-script.ts`) or add a replacement there. Point links at App Router paths (`/checkout/review`), not `checkout-review.html`.

**New auth method or auth copy:**
- Validation: `src/lib/auth/schema.ts`.
- Mutation: `src/features/auth/actions.ts`.
- Form UI: a component next to `LoginForm.tsx`, wrapped in `AuthShell`.
- Page: `src/app/<path>/page.tsx`. If it must be guest-only, add the path in `isGuestOnly` inside `src/lib/supabase/middleware.ts`.
- Redirect targets: `safeNextPath` in `src/lib/auth/redirect.ts`. Email link origin: `getSiteOrigin` in `src/lib/auth/origin.ts`.

**Utilities:**
- Shared helpers: `src/lib/<topic>.ts`. Server-only modules start with `import "server-only"` (`src/lib/purchases.ts`, `src/lib/supabase/admin.ts`).
- Cross-page types: `src/types/index.ts`.

**Tests:**
- There is no test home yet. Colocate a future test next to the module or under a top-level `src/` test folder once a runner exists. Today, `npm run typecheck` and `npm run lint` are the checks in `package.json`.

## Special Directories

**`src/data/page-html/`:**
- Purpose: Readable HTML for screens compiled into `src/data/page-content.ts`.
- Generated: No. Hand-maintained copies. Not imported by routes.
- Committed: Yes.

**`src/features/**/*.raw.js`:**
- Purpose: Readable wizard scripts. The evaluated source is the neighboring `*-script.ts` string.
- Generated: No.
- Committed: Yes. Ignored by ESLint.

**`supabase/migrations/done/`:**
- Purpose: Applied SQL. The profile migration comment says to run files in the Supabase SQL Editor in filename order on a new project.
- Generated: No.
- Committed: Yes.

**`public/examples/`:**
- Purpose: Public preview audio for the examples and player UI.
- Generated: No.
- Committed: Yes.

**`.next/`:**
- Purpose: Next build output.
- Generated: Yes.
- Committed: No (standard Next output; do not edit).

**`node_modules/`:**
- Purpose: Installed dependencies.
- Generated: Yes.
- Committed: No.

---

*Structure analysis: 2026-10-25*
