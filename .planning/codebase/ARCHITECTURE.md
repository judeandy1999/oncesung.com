<!-- refreshed: 2026-10-25 -->
# Architecture

**Analysis Date:** 2026-10-25

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Browser                                                                   │
│  src/app/layout.tsx  header, footer, toast, signed-in email               │
├────────────────────────────┬───────────────────────┬─────────────────────┤
│ Marketing HTML             │ React features        │ Legacy wizards      │
│ src/components/HtmlMain.tsx│ src/features/auth/    │ LegacyInteractive   │
│ src/data/page-content.ts   │ src/features/checkout/│ Page.tsx            │
│ src/components/            │ AffiliatesEnhancer    │ intake, account,    │
│   SiteInteractions.tsx     │                       │ requests            │
└─────────────┬──────────────┴──────────┬────────────┴──────────┬──────────┘
              │ click / form            │ server actions        │ eval script
              ▼                         ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Request proxy  src/proxy.ts → src/lib/supabase/middleware.ts              │
│ Refreshes the Supabase session cookie and redirects protected routes     │
└─────────────┬───────────────────────────────┬────────────────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────────┐   ┌────────────────────────────────────────┐
│ Browser storage             │   │ Supabase                                │
│ oncesungStore / localStorage│   │ auth.users, public.profiles,            │
│ package, story, brief,      │   │ public.purchases (select-only),         │
│ details, requests, phone    │   │ storage bucket purchased-songs          │
└─────────────────────────────┘   └────────────────────────────────────────┘
```

Oncesung is a Next.js App Router site. Most screens are design-ZIP HTML injected as a string. A single client behavior layer wires clicks, audio, package selection, and the demo payment form. Three wizards (song intake, account, revisions) run imperative scripts through `new Function`. Accounts are real Supabase Auth users. Song packages, the creative brief, checkout contact fields, and revision threads stay in the browser. Paying for a song does not create an order or a `purchases` row.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Fonts, metadata, header/footer, toast provider, signed-in email | `src/app/layout.tsx` |
| Request proxy | Session refresh and route gates on every non-static request | `src/proxy.ts` |
| Session gate | Cookie client, protected and guest-only redirects | `src/lib/supabase/middleware.ts` |
| HTML page body | Inject rewritten marketing HTML | `src/components/HtmlMain.tsx` |
| Page HTML catalog | One exported string per marketing and checkout screen | `src/data/page-content.ts` |
| Site behaviors | Audio, filters, package picker, story fill, demo forms | `src/components/SiteInteractions.tsx` |
| Browser store | `oncesung:` localStorage JSON, with sessionStorage fallback on read | `src/lib/store.ts` |
| Package catalog | Essential $49, Signature $89, Concierge $149 | `src/lib/store.ts` |
| Legacy mount | Inject HTML, run one script, clear on unmount | `src/components/LegacyInteractivePage.tsx` |
| Script runner | Patch storage, rewrite `.html` navigations, `new Function` | `src/lib/run-legacy-script.ts` |
| Song intake | Five-step brief, local draft, handoff to checkout review | `src/features/intake/intake-script.ts`, `src/features/intake/shell.ts` |
| Checkout details | React Hook Form contact step, writes `details`, routes to payment | `src/features/checkout/CheckoutDetailsForm.tsx` |
| Auth actions | Email, Google, reset, sign-out | `src/features/auth/actions.ts` |
| Auth callback | Exchange the Supabase code and backfill an empty profile name | `src/app/auth/callback/route.ts` |
| Account page | Require a user, inject profile into legacy HTML | `src/app/account/page.tsx`, `src/features/account/with-account-profile.ts` |
| Profile API | Authenticated `full_name` update | `src/app/api/account/profile/route.ts` |
| Profile read | `profiles` row, else auth metadata | `src/lib/account/profile.ts` |
| Purchase read | Own `purchases` rows; no caller yet | `src/lib/purchases.ts` |
| Service-role client | Bypass RLS for future server inserts and signed URLs | `src/lib/supabase/admin.ts` |
| Route map | Legacy HTML filenames to App Router paths | `src/lib/routes.ts` |
| Orders UI data | Static dashboard cards inside HTML; `MOCK_ORDERS` is unused by pages | `src/data/page-html/dashboard.html`, `src/data/mock-orders.ts` |

## Pattern Overview

**Overall:** HTML-shell App Router with a browser commerce state machine and a Supabase account boundary.

**Key Characteristics:**
- A route file in `src/app/<route>/page.tsx` is a thin server component. Marketing routes return `<HtmlMain html={html_…} />`.
- Interactive marketing behavior is not React state. `SiteInteractions` in `src/components/SiteInteractions.tsx` queries the DOM on every pathname change.
- Wizards that cannot be expressed as static HTML mount through `LegacyInteractivePage` and a string script.
- Auth, profile name, and the future purchase ledger are server-side. The creative brief and the chosen package are client-side.
- Checkout payment is a demo. `form[data-demo]` never charges a card and never writes `public.purchases`.

## Layers

**Presentation (App Router pages):**
- Purpose: One URL per screen, metadata, and the correct mount (HTML, React form, or legacy wizard).
- Location: `src/app/`
- Contains: `page.tsx` route modules, `layout.tsx`, `sitemap.ts`, `robots.ts`, icon routes, one API route, the auth callback.
- Depends on: `src/data/page-content.ts`, `src/features/`, `src/components/`, `src/lib/auth/require-user.ts`
- Used by: The browser and the request proxy.

**Client behavior:**
- Purpose: Make injected HTML interactive and keep checkout progress on the device.
- Location: `src/components/SiteInteractions.tsx`, `src/lib/store.ts`, `src/components/LegacyInteractivePage.tsx`, `src/lib/run-legacy-script.ts`
- Contains: DOM listeners, `oncesungStore`, script evaluation.
- Depends on: DOM produced by `HtmlMain` or a legacy shell.
- Used by: Every page under the root layout, because `SiteInteractions` is mounted once in `src/app/layout.tsx`.

**Account and checkout features:**
- Purpose: Typed React for auth and the details step; string HTML/JS for intake, account, and requests.
- Location: `src/features/auth/`, `src/features/checkout/`, `src/features/account/`, `src/features/intake/`, `src/features/requests/`, `src/features/affiliates/`
- Contains: Server actions, forms, HTML string exports, script string exports.
- Depends on: `src/lib/supabase/server.ts`, `src/lib/auth/schema.ts`, `src/lib/store.ts`
- Used by: The matching `src/app/**/page.tsx` files.

**Server data access:**
- Purpose: Cookie-bound Supabase client, service-role client, profile and purchase reads.
- Location: `src/lib/supabase/`, `src/lib/account/profile.ts`, `src/lib/purchases.ts`
- Contains: `createClient` helpers and row types.
- Depends on: `@supabase/ssr` and `@supabase/supabase-js`
- Used by: Layout, auth actions, callback, profile API, `requireUser`. `listOwnPurchases` and `createAdminClient` are ready for a later payment route and have no callers.

**Database:**
- Purpose: One profile per auth user, a purchase ledger the user can only read, a private audio bucket.
- Location: `supabase/migrations/done/`
- Contains: `20261021120000_profiles.sql`, `20261021120100_purchases.sql`, `20261021120200_purchased_songs_bucket.sql`
- Depends on: Supabase Auth (`auth.users`) and Storage.
- Used by: The server client under the anon key plus RLS. Inserts into `purchases` are specified for the service role only.

## Data Flow

### Primary request path (marketing page)

1. `src/proxy.ts` calls `updateSession` in `src/lib/supabase/middleware.ts`. A signed-out visitor continues. A signed-in visitor on `/login`, `/register`, or `/forgot-password` is sent to `next` or `/account`.
2. `src/app/layout.tsx` calls `createClient` from `src/lib/supabase/server.ts`, reads `auth.getUser()`, and passes `email` into `SiteHeader` and `SiteFooter`.
3. The route, for example `src/app/page.tsx`, renders `HtmlMain` with `html_home` from `src/data/page-content.ts`.
4. `SiteInteractions` rewrites leftover `.html` links through `hrefFromHtml` in `src/lib/routes.ts` and attaches audio, accordions, and toasts.

### Package, brief, and payment

Packages are the three fixed products in `PACKAGES` inside `src/lib/store.ts`: `essential` (49), `signature` (89), `concierge` (149). There is no subscription plan. The same prices are also hardcoded in `src/data/page-content.ts` (source HTML in `src/data/page-html/pricing.html` and `src/data/page-html/checkout_package.html`). Change a price in both places.

Navigation order:

1. **Choose a package.** On `/pricing`, a link with `data-package="essential|signature|concierge"` is handled in `SiteInteractions`. The click handler calls `oncesungStore.set("package", key)` before the link goes to `/checkout/package`. On `/checkout/package`, the `[data-pkg-group]` control writes the same key. Its continue link goes to `/song-intake`. `resolvePackage` in `src/lib/store.ts` defaults a missing or unknown key to `signature`.
2. **Write the brief.** `src/app/song-intake/page.tsx` mounts `INTAKE_SHELL` plus `INTAKE_SCRIPT`. The script keeps the draft at localStorage key `oncesung-song-intake-v1` when the visitor checks “remember”. “Continue to checkout” calls `saveToAccount()`, writes `oncesung:story` and `oncesung:brief` through `sessionStorage.setItem`, and navigates to `checkout-review.html`. `rewriteLegacyNavInSource` in `src/lib/run-legacy-script.ts` turns that into `/checkout/review` and mirrors `oncesung:` session writes into `localStorage`.
3. **Review.** `src/app/checkout/review/page.tsx` renders `html_checkout_review`. `SiteInteractions` fills `[data-pkg-name]`, `[data-pkg-price]`, `[data-pkg-features]`, and `[data-total]` from `PACKAGES`, and fills `[data-show]` nodes from `oncesungStore.get("story")`. The in-page package switch writes `package` again. The next link is `/checkout/details`. The static stepper on this screen labels the current step “Package”; the visitor has already left the package page.
4. **Details.** `src/app/checkout/details/page.tsx` renders `CheckoutDetailsForm`. Submit validates with Zod, `oncesungStore.set("details", values)`, and `router.push("/checkout/payment")`. The form’s initial values are the sample contact in that file until a saved `details` object exists. This step does not read the Supabase profile.
5. **Payment.** `src/app/checkout/payment/page.tsx` renders `html_checkout_payment`. The form is `data-demo` with `data-next="/order-confirmed"`. `SiteInteractions` prevents the submit, toasts `Demo only — no payment was processed.`, and `router.push`es the next path. Card formatting stays in the browser. No route reads the card fields. The markup in `src/data/page-html/checkout_payment.html` states that a live provider must be used and that card data must not be posted to this app.
6. **Confirmed screen.** `src/app/order-confirmed/page.tsx` is static HTML. It does not insert `public.purchases`. `listOwnPurchases` in `src/lib/purchases.ts` therefore stays empty after this flow. `createAdminClient` in `src/lib/supabase/admin.ts` is the intended writer (service role bypasses RLS) and has no caller.

`public.purchases` (`supabase/migrations/done/20261021120100_purchases.sql`) stores `user_id`, `song_slug`, and `order_reference`. Authenticated users may `select` their own rows only. The private `purchased-songs` bucket (`supabase/migrations/done/20261021120200_purchased_songs_bucket.sql`) has no browser read policy. A later server route is expected to check `purchases`, then mint a signed URL. `/downloads` and `/dashboard` do not do that. They render fixed HTML from `src/data/page-content.ts`. Download buttons use `data-toast` and do not fetch storage.

Revision allowances follow the chosen package inside the requests script, not the database: Essential is 1 minor revision and 0 remakes; Signature and Concierge are 3 and 3 (`LIMITS` in `src/features/requests/requests-script.ts`). Those counts are enforced only against `oncesung:requests` in localStorage.

### Account and sign-in

1. Guest hits a protected path. `PROTECTED` in `src/lib/supabase/middleware.ts` is `/account`, `/dashboard`, `/downloads`, `/song-player`, `/requests`. The proxy redirects to `/login?next=<path>`. Checkout paths are public.
2. `src/app/login/page.tsx` passes `safeNextPath` into `LoginForm`. `loginAction` in `src/features/auth/actions.ts` validates with `loginSchema` (`src/lib/auth/schema.ts`) and calls `signInWithPassword`. Success `redirect`s to the safe next path, default `/account` (`src/lib/auth/redirect.ts`).
3. `registerAction` calls `signUp` with `full_name` metadata and `emailRedirectTo` `${origin}/auth/callback?next=/account`. `getSiteOrigin` in `src/lib/auth/origin.ts` prefers `NEXT_PUBLIC_SITE_URL`. A session already present redirects to `/account`; otherwise the form shows the confirm-email message. `googleSignInAction` starts Google OAuth and redirects to the provider URL.
4. `src/app/auth/callback/route.ts` `exchangeCodeForSession`s the `code`. On success it updates `profiles.full_name` only when the current name is empty, then redirects to `next`.
5. The SQL trigger `handle_new_user` in `supabase/migrations/done/20261021120000_profiles.sql` inserts `public.profiles` (`id`, `email`, `full_name`) for every new `auth.users` row. RLS allows the owner to select the row and update `full_name` only.
6. `src/app/account/page.tsx` calls `requireUser("/account")` and `getOwnProfile()`. `withAccountProfile` injects a JSON script tag and fills the name, email, and avatar initial in `ACCOUNT_HTML`. `LegacyInteractivePage` runs `ACCOUNT_SCRIPT`.
7. The account script prefers that server payload for name and email. Saving the form `POST`s `{ fullName }` to `src/app/api/account/profile/route.ts`, which updates `profiles.full_name`. Phone is written to localStorage key `oncesung:profile` and is not a database column. Email is read-only in the form.
8. “Save to my account” and checkout from intake prepend an entry on `oncesung:briefs` (max 50) in localStorage. The account script renders those cards. “Order this song” copies a summary into `oncesung:story` and `oncesung:brief` and sends the browser to `/checkout/review`. “Edit answers” stashes `oncesung:edit-brief` and opens `/song-intake`.
9. Sign-out is the server action `signOut` in the header and footer. It calls `supabase.auth.signOut()` and redirects to `/`.

`src/lib/supabase/client.ts` (browser anon client) is unused. All auth calls use the cookie server client in `src/lib/supabase/server.ts`.

### Orders, player, downloads, requests

1. `/dashboard`, `/downloads`, `/song-player`, and `/requests` each call `requireUser` with their own path, matching `PROTECTED`.
2. Dashboard, downloads, and song player render static HTML (`html_dashboard`, `html_downloads`, `html_song_player`). Order titles on the dashboard are design copy (for example “Our First Year”), not `MOCK_ORDERS` and not `purchases`. `src/data/mock-orders.ts` is re-exported from `src/types/index.ts` and is not read by a page.
3. `/requests` mounts `REQUESTS_HTML` and `REQUESTS_SCRIPT`. Songs listed in the form come from `oncesung:briefs`. Threads persist to `oncesung:requests`. Nothing is sent to Supabase.

**State management:**
- Server session: Supabase auth cookies, refreshed in `src/lib/supabase/middleware.ts`. Server Components call `getUser()` and swallow cookie writes (`src/lib/supabase/server.ts`).
- Commerce and creative state: `oncesungStore` keys `package`, `story`, `details`, plus raw keys `oncesung:brief`, `oncesung:briefs`, `oncesung:profile` (phone), `oncesung:requests`, `oncesung:edit-brief`, and `oncesung-song-intake-v1`.
- UI toast: React context in `src/hooks/use-toast.tsx`. Intake and account scripts also create their own DOM toasts.
- Affiliate application draft: `oncesung-affiliate-draft-v1` in `src/features/affiliates/AffiliatesEnhancer.tsx`. The earnings widget multiplies orders by the selected package price by 25% in the browser. Submit does not call an API.

## Key Abstractions

**HtmlMain page:**
- Purpose: A marketing or checkout screen whose body is a string.
- Examples: `src/app/page.tsx`, `src/app/pricing/page.tsx`, `src/app/checkout/review/page.tsx`, `src/app/checkout/payment/page.tsx`, `src/app/order-confirmed/page.tsx`
- Pattern: Import `html_<snake>` from `src/data/page-content.ts`. Export `metadata`. Return `<HtmlMain html={…} />`. Add behavior with `data-*` hooks that `SiteInteractions` already understands, or a sibling client enhancer like `AffiliatesEnhancer`.

**LegacyInteractivePage:**
- Purpose: HTML plus an imperative script that must run after the nodes exist.
- Examples: `src/app/song-intake/page.tsx`, `src/app/account/page.tsx`, `src/app/requests/page.tsx`
- Pattern: Pass `html`, `script`, and a stable `label`. The effect sets `innerHTML`, then `runLegacyScript`. Cleanup calls `clearLegacyLabel(label)`.

**oncesungStore:**
- Purpose: JSON documents for checkout progress that must survive a full navigation.
- Examples: `src/lib/store.ts`, `src/components/SiteInteractions.tsx`, `src/features/checkout/CheckoutDetailsForm.tsx`
- Pattern: `oncesungStore.set(key, value)` writes `localStorage["oncesung:" + key]`. `get` reads localStorage, then sessionStorage. Do not store card numbers or passwords here.

**requireUser:**
- Purpose: Server-component gate that matches the proxy.
- Examples: `src/lib/auth/require-user.ts`, `src/app/account/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/downloads/page.tsx`, `src/app/song-player/page.tsx`, `src/app/requests/page.tsx`
- Pattern: `await requireUser("/the-path")` redirects to `/login?next=` when `getUser()` is empty.

**Cookie Supabase client:**
- Purpose: User-scoped reads and auth mutations under RLS.
- Examples: `src/lib/supabase/server.ts`, `src/features/auth/actions.ts`, `src/lib/account/profile.ts`, `src/lib/purchases.ts`
- Pattern: `const supabase = await createClient()` inside a server action, route handler, or server component. Use `createAdminClient` only on the server, and only for writes the user is not allowed to make (purchase inserts, signed download URLs).

**Song brief:**
- Purpose: The creative interview, schema `oncesung-song-brief/3`, produced by `pack()` inside `src/features/intake/intake-script.ts`.
- Examples: Intake script, account script (`oncesung:briefs`), requests script (song titles from briefs).
- Pattern: The object is browser-local. Checkout review receives a shortened `story` (`occasion`, `recipient`, `relationship`, `date`, `genre`, `mood`, `moments`, `details`), typed loosely as `CheckoutStory` in `src/types/index.ts`. The full brief JSON is `oncesung:brief`.

## Entry Points

**Request proxy:**
- Location: `src/proxy.ts`
- Triggers: Every request except `_next/static`, `_next/image`, `favicon.ico`, and static image/audio extensions (matcher in that file).
- Responsibilities: Delegate to `updateSession`. If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, the proxy continues with no auth redirect.

**Root layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render.
- Responsibilities: Fonts, default metadata (`NEXT_PUBLIC_SITE_URL` or `https://www.oncesung.com`), chrome, toast, one session read for the header email.

**App pages:**
- Location: `src/app/**/page.tsx`
- Triggers: Navigation.
- Responsibilities: Metadata plus one of the three mount styles above. Protected pages also call `requireUser`.

**Auth callback:**
- Location: `src/app/auth/callback/route.ts`
- Triggers: Supabase email and Google redirect with `code` and optional `next`.
- Responsibilities: Session exchange, empty-name profile backfill, redirect. Failures go to `/login?error=link`, `/login?error=google`, or `/forgot-password?error=expired`.

**Profile API:**
- Location: `src/app/api/account/profile/route.ts`
- Triggers: Account script `fetch("/api/account/profile", { method: "POST" })`.
- Responsibilities: Zod-check `fullName` (max 100), require a user, update `profiles.full_name`.

**Metadata routes:**
- Location: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/app/opengraph-image.tsx`
- Triggers: Crawlers and browsers requesting icons or `sitemap.xml`.
- Responsibilities: Public URL list and brand images from `src/lib/brand-mark.tsx`.

## Architectural Constraints

- **Threading:** Node handles each request on the server runtime. There are no worker threads. Legacy scripts and `SiteInteractions` run on the browser main thread. `runLegacyScript` is synchronous.
- **Global state:** `ranLabels` in `src/lib/run-legacy-script.ts` remembers which wizard script already ran in the tab. `window.__oncesungStoragePatched` wraps `sessionStorage.setItem` so `oncesung:` keys also land in `localStorage`. Checkout keys in `localStorage` are shared across tabs. Server modules do not keep a Supabase singleton; `createClient` and `createAdminClient` build a client per call.
- **Circular imports:** Not detected. Pages import features and `src/data/page-content.ts`. Features import `src/lib/`. `src/lib/` does not import `src/app/` or `src/features/`.
- **Proxy plus page gate:** A protected URL needs both an entry in `PROTECTED` (`src/lib/supabase/middleware.ts`) and `requireUser` in the page. The proxy redirects before render and refreshes cookies. `requireUser` is the server-component check.
- **RLS write boundary:** The browser and the anon server client cannot insert `purchases` or change `profiles.email`. Purchase inserts and signed URLs belong in a server route that calls `createAdminClient`.
- **Package price has two sources:** Runtime totals use `PACKAGES` in `src/lib/store.ts`. The visible price cards are HTML strings. Requests limits are a third copy in `src/features/requests/requests-script.ts`.
- **Wizard scripts are strings:** `src/features/intake/intake-core.raw.js`, `src/features/intake/intake-ui.raw.js`, `src/features/account/account.raw.js`, and `src/features/requests/requests.raw.js` are the readable sources. The running code is the template string in `intake-script.ts`, `account-script.ts`, and `requests-script.ts`. `rewriteLegacyNavInSource` only rewrites those strings at runtime. Edit the string the page imports, or the page will not change.
- **HTML files are not the runtime catalog:** Routes import `src/data/page-content.ts`. Files in `src/data/page-html/` are the readable copies, including duplicate names (`checkout_review.html` and `checkout__review.html`). A page will not pick up an edit that lands only in `page-html/`.
- **Checkout is unsigned:** Package, story, details, and the demo payment form do not require a session. Account briefs are per browser, not per `auth.users` id.
- **Next.js 16 proxy file:** Session interception lives in `src/proxy.ts` (default export `proxy` plus `config.matcher`), not in a `middleware.ts` file.

## Anti-Patterns

### Recording a sale from the demo payment form

**What happens:** `SiteInteractions` treats `form[data-demo]` as navigation. The payment form’s `data-next` is `/order-confirmed`. The handler toasts that no payment was processed.
**Why it's wrong:** `/order-confirmed`, `/dashboard`, and `/downloads` then look like a finished order while `public.purchases` is unchanged. `listOwnPurchases` is the read path and is unused.
**Do this instead:** Keep the demo toast until a provider confirms payment on the server. Insert with `createAdminClient` from `src/lib/supabase/admin.ts` using `song_slug` and `order_reference`. Read with `listOwnPurchases` from `src/lib/purchases.ts`. Leave card fields in the provider’s frame. The note in `src/data/page-html/checkout_payment.html` forbids posting card data to this app.

### Treating localStorage briefs as the user record

**What happens:** Intake, account, and requests persist the song brief, phone, and revision threads in `localStorage`. `withAccountProfile` in `src/features/account/with-account-profile.ts` tells the visitor that song briefs stay in this browser. `profiles` has only `full_name` and `email`.
**Why it's wrong:** A second device, a cleared browser, or a different user on the same browser shows a different “account” than `auth.users`.
**Do this instead:** Use Supabase for anything that must follow the signed-in user. Keep `oncesung-song-intake-v1` and `oncesungStore` for in-progress drafts on one device.

### Adding a protected screen without the proxy list

**What happens:** `requireUser` redirects inside the server component. The proxy list is separate.
**Why it's wrong:** Cookie refresh and the early redirect both live in `updateSession`. A page that only calls `requireUser` still works after render starts, and a path added only to `PROTECTED` renders the page module for a signed-in user with no extra check.
**Do this instead:** Add the path to `PROTECTED` in `src/lib/supabase/middleware.ts` and call `requireUser("/that-path")` at the top of the page, as `src/app/account/page.tsx` does.

### Importing `page-html` or `.raw.js` from a route

**What happens:** Those files are source copies. ESLint ignores `src/data/page-html/**` and `src/features/**/*.raw.js` (`eslint.config.mjs`). No page imports them.
**Why it's wrong:** The running HTML is `src/data/page-content.ts`. The running wizard is the `*_SCRIPT` / `*_HTML` string.
**Do this instead:** Change the exported string the page imports, and keep the readable copy in sync when you touch it.

### Re-running a legacy script without clearing its label

**What happens:** `runLegacyScript` returns immediately when `label` is already in `ranLabels`.
**Why it's wrong:** A second mount would inject HTML and then skip the listeners.
**Do this instead:** Mount wizards only through `LegacyInteractivePage`, which calls `clearLegacyLabel` on cleanup.

### Calling the browser Supabase client for account writes

**What happens:** `src/lib/supabase/client.ts` exists and is unused. RLS grants the signed-in user `select` on `profiles` and `purchases`, and `update` of `full_name` only.
**Why it's wrong:** A browser insert into `purchases` fails and would be the wrong trust boundary even if a policy were opened. The migration comment says a user must not be able to grant themselves a song.
**Do this instead:** Profile name updates go through `src/app/api/account/profile/route.ts` or a server action using `src/lib/supabase/server.ts`. Purchase grants go through `createAdminClient` after payment verification.

## Error Handling

**Strategy:** Auth and the profile API return safe messages. Missing session redirects. Legacy and demo UI use toasts and inline status text. Database errors on optional reads become empty data.

**Patterns:**
- Server actions in `src/features/auth/actions.ts` return `AuthState` (`error`, `success`, `fields`) from Zod via `fieldErrors`, or `redirect` on success. Rate limits become “Too many attempts…”. Duplicate sign-up returns the same confirm-email success string as a new account. `signInWithPassword` failures become “Email or password is incorrect.” or the confirm-email message. Other auth failures are generic.
- `safeNextPath` rejects protocol-relative, external, and auth-page next values so redirects stay in the app (`src/lib/auth/redirect.ts`).
- `GET` `src/app/auth/callback/route.ts` redirects to a login or forgot-password error query when `code` is missing or `exchangeCodeForSession` fails.
- `POST` `src/app/api/account/profile/route.ts` returns JSON `{ error }` with status 400 or 401, or `{ fullName }` on success.
- `getOwnProfile` and `listOwnPurchases` return `null` or `[]` when the user is signed out or the query errors.
- `src/app/layout.tsx` catches `getUser()` failures and renders the signed-out header.
- `requireUser` uses `redirect`, which throws the Next navigation error.
- `runLegacyScript` logs `console.error("[oncesung] legacy script failed: …")` and removes the label so a later mount can retry.
- Demo forms and `data-toast` buttons surface copy through `useToast`. They are not error reports.

## Cross-Cutting Concerns

**Logging:** `console.error` in `src/lib/run-legacy-script.ts` only. No error-tracking SDK and no request logger.

**Validation:** Zod in `src/lib/auth/schema.ts` (login, register, forgot, reset), Zod in `src/app/api/account/profile/route.ts` (`fullName` max 100, matching the SQL check on `profiles.full_name`), and Zod plus React Hook Form in `src/features/checkout/CheckoutDetailsForm.tsx`. Intake required-field checks live inside `INTAKE_SCRIPT` (`requirements()`), not Zod.

**Authentication:** Supabase Auth via `@supabase/ssr` cookie client. Email/password, Google OAuth, and password reset. Protected prefixes are listed in `src/lib/supabase/middleware.ts`. Guest-only pages bounce signed-in users. The service-role key is read only by `createAdminClient`, which imports `server-only`.

---

*Architecture analysis: 2026-10-25*
