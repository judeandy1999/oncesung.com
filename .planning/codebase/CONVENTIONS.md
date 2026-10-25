# Coding Conventions

**Analysis Date:** 2026-10-25

## Naming Patterns

**Files:**

- React components: PascalCase, one component family per file. Examples: `src/features/auth/LoginForm.tsx`, `src/components/SiteHeader.tsx`, `src/features/checkout/CheckoutDetailsForm.tsx`.
- Non-component modules: kebab-case. Examples: `src/lib/run-legacy-script.ts`, `src/features/account/with-account-profile.ts`, `src/lib/auth/require-user.ts`, `src/hooks/use-toast.tsx`.
- App Router routes: kebab-case directories, file name fixed by Next.js. Examples: `src/app/forgot-password/page.tsx`, `src/app/checkout/details/page.tsx`, `src/app/api/account/profile/route.ts`, `src/app/auth/callback/route.ts`.
- Request interception lives in `src/proxy.ts` (default export `proxy`). Do not add `middleware.ts`.
- Generated marketing HTML is `src/data/page-content.ts`. Feature HTML/scripts that are still edited as strings are `*-html.ts` and `*-script.ts` under `src/features/<feature>/`.
- Legacy script sources `src/features/**/*.raw.js` are not imported. Runtime code uses the string constants. Do not wire `.raw.js` into the app.
- SQL migrations: `supabase/migrations/done/<YYYYMMDDHHMMSS>_<snake_name>.sql`.

**Functions:**

- camelCase. Verb-first for actions and queries: `loginAction`, `getOwnProfile`, `listOwnPurchases`, `requireUser`, `safeNextPath`, `hrefFromHtml`, `withAccountProfile`, `resolvePackage`.
- React components and providers: PascalCase, named function declarations. `LoginForm`, `AuthShell`, `ToastProvider`, `HtmlMain`.
- Hooks: `use` prefix. `useToast` in `src/hooks/use-toast.tsx`.
- Server Action names end in `Action` when they are form actions (`loginAction`, `googleSignInAction`). `signOut` is the exception: it is a form action with no return state.
- Module-private helpers stay unexported and camelCase: `sameSiteMessage` in `src/features/auth/actions.ts`, `metadataName` in `src/lib/account/profile.ts`, `escapeHtml` in `src/features/account/with-account-profile.ts`, `isProtected` in `src/lib/supabase/middleware.ts`.
- Prefix unused parameters with `_`. Server actions take `useActionState`'s previous state as `_prev`.

**Variables:**

- camelCase for locals and props: `nextPath`, `fullName`, `pending`.
- Module constants that are configuration or copy: SCREAMING_SNAKE. `HTML_TO_PATH`, `NAV_LINKS`, `SITE_NAME`, `MOCK_ORDERS`, `ACCOUNT_HTML`, `INTAKE_SCRIPT`, `PROTECTED` (the last is module-private in `src/lib/supabase/middleware.ts`).
- The browser store object is camelCase: `oncesungStore` in `src/lib/store.ts`.
- Storage keys use the prefix `oncesung:` plus a short name (`oncesung:story`, `oncesung:briefs`, `oncesung:package`). Older keys without a colon stay as-is when touching existing data: `oncesung-song-intake-v1` in `src/features/intake/intake-script.ts`, `oncesung-affiliate-draft-v1` in `src/features/affiliates/AffiliatesEnhancer.tsx`.
- Booleans read as predicates: `signedIn`, `pending`, `remember`. Coerce with `Boolean(...)` when the source is `string | null`.

**Types:**

- PascalCase `type` aliases. The codebase uses `type`, not `interface`. Examples: `AuthState`, `OwnProfile`, `Purchase`, `FieldErrors`, `FormValues`, `CheckoutStory`, `MockOrder`.
- String unions for closed sets: `PackageKey = "essential" | "signature" | "concierge"` in both `src/lib/store.ts` and `src/types/index.ts`. Status unions use snake_case members matching stored values: `MockOrderStatus = "in_progress" | "ready" | "completed"` in `src/data/mock-orders.ts`.
- Props types are inline on the function when they are used once. Extract a named type only when it is reused or the component takes several fields (`Props` in `src/components/LegacyInteractivePage.tsx`).
- Database rows stay snake_case in TypeScript when they mirror Postgres: `Purchase.song_slug`, `Purchase.order_reference`, `Purchase.created_at` in `src/lib/purchases.ts`. App-facing models are camelCase: `OwnProfile.fullName`. Map at the query boundary (`full_name` → `fullName` in `src/lib/account/profile.ts`).
- Zod schemas are camelCase consts ending in `Schema`: `loginSchema`, `emailSchema`, `bodySchema`. Infer form types with `z.infer<typeof schema>` (`FormValues` in `src/features/checkout/CheckoutDetailsForm.tsx`).

**Page component names:**

- Default-export the page function. Marketing pages that only render HTML use `Page` (`src/app/page.tsx`, `src/app/pricing/page.tsx`). Pages with their own behavior use a specific name: `LoginPage`, `AccountPage`, `RequestsPage`, `SongIntakePage`, `CheckoutDetailsPage`, `RootLayout`.

## Code Style

**Formatting:**

- No Prettier config and no format script. Match the existing TypeScript style:
  - 2-space indent
  - Double quotes
  - Semicolons
  - Trailing commas in multiline literals, arguments, and type members
  - Line length is soft; wrap JSX props and object fields when a line stops scanning cleanly, as in `src/features/auth/LoginForm.tsx`
- In JSX text, escape apostrophes as `&apos;` (`We&apos;ll` in `src/features/checkout/CheckoutDetailsForm.tsx`).
- `tsconfig.json` is `strict: true`, `jsx: react-jsx`, `moduleResolution: bundler`, `noEmit: true`, `allowJs: true`. Do not loosen strictness for a new file.
- Target is ES2017. Optional chaining and nullish coalescing are already used; prefer `??` for defaults (`data.user?.email ?? null` in `src/app/layout.tsx`). Older helpers still use `||` for empty strings (`data?.email || user.email || ""` in `src/lib/account/profile.ts`). Use `||` when an empty string should fall through; use `??` when only `null` and `undefined` should.

**Linting:**

- ESLint 9 flat config in `eslint.config.mjs`. It spreads `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Do not add rule overrides unless a Next.js rule blocks a pattern this repo already uses.
- Run `npm run lint` (`eslint .`).
- Ignored paths (do not "fix" them to satisfy lint): `node_modules/**`, `.next/**`, `out/**`, `build/**`, `next-env.d.ts`, `src/features/**/*.raw.js`, `src/data/page-html/**`.
- `src/data/page-content.ts` is linted but marked `/* Auto-generated from ZIP — do not hand-edit */`. Change routes by editing `src/lib/routes.ts` and the page file, not by rewriting the generated HTML string.
- Run `npm run typecheck` (`tsc --noEmit`) after type-level edits. There is no combined `check` script.

**CSS and markup:**

- The visual system is the class set in `src/styles/oncesung.css`, `src/styles/affiliates.css`, `src/styles/page-extras.css`, and `src/styles/intake.css`, imported from `src/app/globals.css`. Reuse those classes (`.btn`, `.btn-primary`, `.field`, `.input`, `.card`, `.muted`, `.container`) before adding utilities.
- Tailwind v4 is imported (`@import "tailwindcss"` in `src/app/globals.css`) and PostCSS is `postcss.config.mjs`. New screens still follow the existing class system. Do not restyle a ZIP page with Tailwind utilities.
- Small auth-only rules belong at the bottom of `src/app/globals.css` (`.form-error`, `.form-success`, `.auth-or`).
- One-off layout in React components uses a `style` object, not a new CSS file. See `src/features/auth/AuthShell.tsx` and `src/features/checkout/CheckoutDetailsForm.tsx`.
- Lucide icons: `size={16}` inside buttons, `size={19}` in icon buttons, `strokeWidth={1.8}`. Import named icons from `lucide-react`.
- Interactive controls get an accessible name: `<label htmlFor>` matching `id`, `aria-invalid` / `aria-describedby` when a field error exists (`src/features/auth/LoginForm.tsx`), `role="alert"` for errors and `role="status"` for success (`src/features/auth/AuthShell.tsx`).

## Import Organization

**Order:**

1. Directive, alone on line 1, when needed: `"use client"` or `"use server"`.
2. `import "server-only"` immediately after that, before other imports, on server-only modules (`src/lib/supabase/admin.ts`, `src/lib/purchases.ts`).
3. External packages. Type-only imports use `import type` (`import type { Metadata } from "next"`, `import type { ReactNode } from "react"`). Inline `type` modifiers are also used (`import { type NextRequest } from "next/server"` in `src/proxy.ts`, `import { type FieldErrors }` in `src/features/auth/actions.ts`).
4. Internal modules via the `@/` alias (`@/*` → `./src/*` in `tsconfig.json`).
5. Relative imports only for a sibling in the same folder (`import { Logo } from "./Logo"` in `src/components/SiteHeader.tsx`) or a colocated stylesheet (`import "./globals.css"` in `src/app/layout.tsx`).

Within a group, order is not alphabetical. Keep Next.js and React first, then other packages (`zod`, `react-hook-form`, `lucide-react`), then `@/` imports. Group the feature's own modules before shared `src/lib` modules when both appear, as in `src/app/account/page.tsx`.

**Path Aliases:**

- `@/` is the only alias. It maps to `src/`. Write `@/lib/auth/redirect`, not a deep relative path.
- There is no `src/index.ts` barrel. `src/types/index.ts` is the only re-export file. Import the concrete module everywhere else.
- Two modules export `createClient`. Import the file, not a barrel:
  - Browser: `import { createClient } from "@/lib/supabase/client"`
  - Server Components, Route Handlers, Server Actions: `import { createClient } from "@/lib/supabase/server"`
  - Service role: `import { createAdminClient } from "@/lib/supabase/admin"`
- `src/lib/store.ts` starts with `"use client"`. Do not import it from a Server Component, Route Handler, or Server Action. Server code that needs package metadata should not pull the store.

**Client and server markers:**

- Add `"use client"` to any file that uses hooks, browser storage, or event handlers. Current client files include `src/features/auth/LoginForm.tsx`, `src/components/SiteHeader.tsx`, `src/components/SiteInteractions.tsx`, `src/hooks/use-toast.tsx`, `src/lib/store.ts`.
- Add `"use server"` only on the Server Actions module `src/features/auth/actions.ts`. Do not mark a whole feature folder.
- Add `import "server-only"` to modules that must never reach the browser (`src/lib/supabase/admin.ts`, `src/lib/purchases.ts`).

## Error Handling

**Patterns:**

- Validate with Zod `safeParse`. On failure, return a value. Do not call `parse()` and catch `ZodError`.
- Auth field errors: `fieldErrors` in `src/lib/auth/schema.ts` keeps the first issue per top-level key and returns `FieldErrors` (`Record<string, string | undefined>`).
- Server Actions return `AuthState` (`{ error?, success?, fields? }` in `src/features/auth/actions.ts`). They do not throw for bad input or Supabase auth failures. `redirect()` from `next/navigation` is the success path for login, reset, sign-out, and Google OAuth.
- Map provider errors to short user-facing sentences. Do not return `error.message` from Supabase. Rate limits (`status === 429`, code `over_request_rate_limit`, or a message containing `"rate limit"`) become `"Too many attempts. Wait a minute and try again."` Duplicate registration returns the same success copy as a new signup (`"Check your email to confirm your account."`). Password reset always returns the same success copy unless rate-limited (`src/features/auth/actions.ts`).
- Route Handlers return `NextResponse.json({ error: "..." }, { status })`. `POST` in `src/app/api/account/profile/route.ts` uses 400 for bad JSON, schema failure, and write failure, and 401 when `getUser()` has no user. Success JSON is camelCase: `{ fullName }`.
- Auth callback failures redirect, they do not render an error page. `failedRedirect` in `src/app/auth/callback/route.ts` sends Google "already" errors to `/login?error=google`, expired reset links to `/forgot-password?error=expired`, and other failures to `/login?error=link`. Pages translate those codes into copy (`NOTICES` in `src/app/login/page.tsx`).
- Missing Supabase env throws at client construction: `throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or ...")` in `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, and `src/lib/supabase/admin.ts`. `updateSession` in `src/lib/supabase/middleware.ts` does the opposite: if env is missing it returns `NextResponse.next` and skips protection. Do not copy that skip into a Route Handler.
- `useToast` throws if called outside `ToastProvider` (`src/hooks/use-toast.tsx`). That is the only hook guard.
- Expected browser failures return a fallback and swallow the exception: `oncesungStore.get` returns `null`, `set` returns `false` (`src/lib/store.ts`). Empty `catch` blocks use a comment `/* ignore */`.
- `src/app/layout.tsx` wraps `getUser()` in try/catch and treats failure as signed-out (`email = null`) so the shell still renders.
- `cookies().set` inside Server Components is allowed to fail. The empty catch in `src/lib/supabase/server.ts` stays: session refresh belongs to `src/proxy.ts`.
- Legacy script failures log and allow a retry: `runLegacyScript` deletes the label from its set and calls `console.error` (`src/lib/run-legacy-script.ts`).
- Queries that should degrade: `listOwnPurchases` returns `[]` when signed out or when Supabase returns `error` (`src/lib/purchases.ts`). `getOwnProfile` returns `null` when signed out.
- HTML spliced from user data goes through `escapeHtml` first (`src/features/account/with-account-profile.ts`). JSON embedded in HTML escapes `<` as `\u003c`.

**Protected pages:**

- Gate a signed-in page with `await requireUser("/that-path")` from `src/lib/auth/require-user.ts` before reading data. It redirects to `/login?next=...` using `safeNextPath`.
- Also list the path in `PROTECTED` inside `src/lib/supabase/middleware.ts`. The proxy and the page guard are both required. Current paths: `/account`, `/dashboard`, `/downloads`, `/song-player`, `/requests`.

**Redirect safety:**

- Any `next` query value passes through `safeNextPath` (`src/lib/auth/redirect.ts`) before `redirect()` or a `Location` header. It allows only same-origin paths and rejects protocol-relative URLs, backslashes, and `/login`, `/register`, `/forgot-password`.

## Logging

**Framework:** `console`

**Patterns:**

- Do not add info or debug logs. The only application log is `console.error(\`[oncesung] legacy script failed: ${label}\`, err)` in `src/lib/run-legacy-script.ts`.
- Prefix any new operational error with `[oncesung]` and a short subject. Log the caught value as a second argument, not interpolated into the string.
- Do not log emails, passwords, tokens, or service-role keys.

## Comments

**When to Comment:**

- Comment why, in one line, when the next reader would otherwise "fix" the code. Examples: the cookie `setAll` catch in `src/lib/supabase/server.ts`, the ZIP link rewrite in `src/components/SiteInteractions.tsx`, the auto-generated banner in `src/data/page-content.ts`.
- Section markers inside long imperative effects are block comments: `/* Waveforms + playback. */` in `src/components/SiteInteractions.tsx`. Use that style only inside a long `useEffect` that wires DOM behavior. Do not add them to Server Actions or Zod schemas.
- Do not comment obvious control flow. Do not add file banners.

**JSDoc/TSDoc:**

- Use a single `/** ... */` line on an export whose contract is not obvious from the name:
  - `safeNextPath` — relative in-app path only (`src/lib/auth/redirect.ts`)
  - `getSiteOrigin` — prefers `NEXT_PUBLIC_SITE_URL` (`src/lib/auth/origin.ts`)
  - `createAdminClient` — server only, bypasses RLS (`src/lib/supabase/admin.ts`)
  - `listOwnPurchases` — empty when signed out (`src/lib/purchases.ts`)
  - `hrefFromHtml` / `HTML_TO_PATH` — legacy filename map (`src/lib/routes.ts`)
  - `HtmlMain`, `withAccountProfile`, `LegacyInteractivePage` — how HTML is mounted
- Mock data is labeled in the comment: `/** MOCK — local demo orders only */` on `MOCK_ORDERS` in `src/data/mock-orders.ts`. Keep that label if the data stays fake.
- Do not write `@param` blocks. Types carry the signature.

## Function Design

**Size:**

- Keep a function to one job and return early. Auth actions follow parse → client call → map error → `redirect` (`src/features/auth/actions.ts`).
- Page files stay thin. A marketing page exports `metadata` and renders one host:

```tsx
export default function Page() {
  return <HtmlMain html={html_home} />;
}
```

That pattern is `src/app/page.tsx`. An interactive ZIP page passes HTML, script, and a unique `label`:

```tsx
return (
  <LegacyInteractivePage html={REQUESTS_HTML} script={REQUESTS_SCRIPT} label="requests" />
);
```

`label` must be unique per mounted wizard. `runLegacyScript` in `src/lib/run-legacy-script.ts` skips a second run with the same label until `clearLegacyLabel`.

**Parameters:**

- Server Actions used with `useActionState` have the signature `(prev: AuthState, formData: FormData) => Promise<AuthState>`. Name the unused state `_prev`.
- Read form fields with `formData.get("email")` and let Zod coerce. Input `name` attributes match schema keys (`fullName`, `confirmPassword`, `next`).
- Component props are a single inline object. Required props are not given defaults. Defaults live on the destructure when the call site can omit them: `Logo({ href = "/" })` in `src/components/Logo.tsx`, `safeNextPath(..., fallback = FALLBACK)`.
- Next.js 16 page props are async. `searchParams` is a `Promise` (`src/app/login/page.tsx`):

```tsx
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
}
```

- `cookies()` and `headers()` are async. `await cookies()` in `src/lib/supabase/server.ts`, `await headers()` in `src/lib/auth/origin.ts`.

**Return Values:**

- Declare the return type on exported async functions that callers branch on: `Promise<AuthState>`, `Promise<OwnProfile | null>`, `Promise<Purchase[]>`.
- Absence is `null` for a single record (`getOwnProfile`) and `[]` for a list (`listOwnPurchases`).
- Boolean results mean "the write landed" (`oncesungStore.set` returns `boolean`).
- Do not return raw Supabase `{ data, error }` from `src/lib`. Map it.

**Validation placement:**

- Auth schemas that more than one action shares live in `src/lib/auth/schema.ts`.
- A schema used by one form or one route stays in that file: `schema` in `src/features/checkout/CheckoutDetailsForm.tsx`, `bodySchema` in `src/app/api/account/profile/route.ts`.
- Reuse `emailSchema` and `passwordSchema` for new auth fields. Password max is 72. Display name max is 100, matching the `profiles_full_name_length` check in `supabase/migrations/done/20261021120000_profiles.sql`.

**Forms:**

- Credential forms: native `<form action={action}>`, `useActionState`, no `react-hook-form`. See `src/features/auth/LoginForm.tsx`. Disable the submit button while `pending` and change its label (`"Signing in…"`).
- Client-only checkout state: `useForm` + `zodResolver`, then `oncesungStore.set` and `router.push`. See `src/features/checkout/CheckoutDetailsForm.tsx`.
- ZIP wizards (intake, account, requests) stay imperative strings executed by `LegacyInteractivePage`. Do not rewrite them as controlled React inputs in a drive-by change.
- Enhancers that attach to generated HTML use `useEffect` plus `getElementById` and return a cleanup. See `src/features/affiliates/AffiliatesEnhancer.tsx` and the `on(...)` helper in `src/components/SiteInteractions.tsx`.

## Module Design

**Exports:**

- Named exports for components, hooks, actions, and lib functions.
- Default export only where Next.js requires it: `page.tsx`, `layout.tsx`, `src/proxy.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/app/opengraph-image.tsx`. Route handlers export named `GET` / `POST`, not default.
- Export a `const metadata: Metadata` (or `MetadataRoute.*` for robots and sitemap) from every page. Titles are short; the root template in `src/app/layout.tsx` appends ` · ${SITE_NAME}`.
- Colocate the type with the function that produces it (`AuthState` next to the actions, `Purchase` next to `listOwnPurchases`). Re-export from `src/types/index.ts` only when another layer already imports from that barrel.
- `PackageKey` is declared in both `src/lib/store.ts` and `src/types/index.ts`. If the union changes, update both, plus `PACKAGES` and `resolvePackage`.

**Where code goes:**

- Route file under `src/app/<segment>/`: metadata, auth gate, and one child component. No business logic.
- Feature UI and actions: `src/features/<feature>/`.
- Shared helpers with no UI: `src/lib/<area>/`.
- Site chrome and HTML hosts: `src/components/`.
- Cross-page copy and the legacy path map: `src/lib/routes.ts` (`SITE_NAME`, `NAV_LINKS`, `HTML_TO_PATH`).
- Static demo orders: `src/data/mock-orders.ts`. Do not present them as database rows.

**Barrel Files:**

- Do not add `index.ts` barrels under `src/features`, `src/components`, or `src/lib`.
- The only barrel is `src/types/index.ts`. It re-exports `MockOrder` and `MockOrderStatus` and declares `PackageKey` and `CheckoutStory`.

**Data and SQL:**

- Postgres identifiers are snake_case. SQL in `supabase/migrations/done/` is lowercase keywords, with a file-top comment describing who can read and write the table.
- New migrations stay in filename order under `supabase/migrations/done/` and are written to run once in the Supabase SQL editor. Do not edit a migration that has already been applied; add a new timestamped file.
- Client writes go through the signed-in server client (`src/lib/supabase/server.ts`) so RLS applies. `createAdminClient` bypasses RLS. Do not call it from a form or a Client Component.

---

*Convention analysis: 2026-10-25*
