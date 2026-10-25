# Testing Patterns

**Analysis Date:** 2026-10-25

## Test Framework

**Runner:**

- Not detected. `package.json` has no Jest, Vitest, Playwright, Cypress, Mocha, or Testing Library dependency.
- No `jest.config.*`, `vitest.config.*`, `playwright.config.*`, or `cypress.config.*`.
- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `__tests__/` directories.
- No CI workflow under `.github/`.
- `.gitignore` lists `/coverage`, but nothing generates it. There is no `test` or `coverage` script.

**Assertion Library:**

- Not detected.

**Run Commands:**

The checks that exist today:

```bash
npm run lint          # eslint .  (eslint.config.mjs)
npm run typecheck     # tsc --noEmit
npm run build         # next build
npm run dev           # next dev
```

`npm run lint` does not typecheck. Run both after a change that touches types or imports. `npm run build` is the only check that compiles the App Router, `src/proxy.ts`, and the metadata image routes.

Lint does not cover `src/features/**/*.raw.js` or `src/data/page-html/**` (`eslint.config.mjs`). Those files are not the runtime source. Do not add tests that import `.raw.js`.

## Test File Organization

**Location:**

- Not detected. There is no suite to colocate with.

**Naming:**

- Not detected. Do not invent a second convention if a runner is added later. Place a test next to the module it exercises: `src/lib/auth/redirect.test.ts` for `src/lib/auth/redirect.ts`. Keep App Router files (`page.tsx`, `route.ts`, `layout.tsx`) free of test code.

**Structure:**

```
Not detected.
src/lib/auth/schema.ts          # pure; first candidate for a unit test
src/lib/auth/redirect.ts        # pure
src/lib/routes.ts               # pure
src/lib/run-legacy-script.ts    # rewriteLegacyNavInSource is pure
src/features/account/with-account-profile.ts
```

## Test Structure

**Suite Organization:**

No test file exists. The modules that can be called without a browser or Supabase are plain exported functions. A future test should call the export and assert the return value, in the same style as the function: early-return, no thrown `ZodError`.

Closest existing shape, from `src/lib/auth/schema.ts` and `src/features/auth/actions.ts`:

```typescript
const parsed = loginSchema.safeParse({
  email: formData.get("email"),
  password: formData.get("password"),
  next: formData.get("next"),
});
if (!parsed.success) return { fields: fieldErrors(parsed.error) };
```

Assert on `parsed.success`, `parsed.data`, and `fieldErrors(parsed.error)`. Do not expect `loginSchema.parse` to throw. Production code never calls `parse()`.

**Patterns:**

- Setup: construct the input (object, string, or `FormData`) in the test. Production helpers do not take a fixture factory.
- Teardown: not used. Pure helpers allocate nothing that must be released. `runLegacyScript` mutates a module-level `Set` and `window`; do not call it in a unit test. Call `rewriteLegacyNavInSource` instead.
- Assertion pattern: compare the returned object, string, or array. Auth failures are data (`{ error: "..." }` or `{ fields: { email: "..." } }`), not exceptions. Missing records are `null` (`getOwnProfile`) or `[]` (`listOwnPurchases`).

## Mocking

**Framework:** Not detected.

**Patterns:**

There is no mock helper. Boundaries that would need a double, if a test is added, are the ones production code already isolates:

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { headers } from "next/headers";
```

`redirect` and `cookies` / `headers` are Next.js server functions. `createClient` in `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts` throws if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing. `createAdminClient` in `src/lib/supabase/admin.ts` throws if `SUPABASE_SERVICE_ROLE_KEY` is missing. Do not point tests at a real project, and do not put key values in a test file. `.env*` is gitignored.

`updateSession` (`src/lib/supabase/middleware.ts`) returns `NextResponse.next` when those public env vars are absent. A test that imports it without env will not exercise the redirect branches.

**What to Mock:**

- `next/navigation` `redirect` when calling `loginAction`, `registerAction`, `resetPasswordAction`, `signOut`, or `googleSignInAction` (`src/features/auth/actions.ts`). Successful auth calls `redirect`, which throws in Next.js.
- `createClient` from `@/lib/supabase/server` when calling a Server Action, `requireUser` (`src/lib/auth/require-user.ts`), `getOwnProfile` (`src/lib/account/profile.ts`), `listOwnPurchases` (`src/lib/purchases.ts`), or `GET` in `src/app/auth/callback/route.ts`.
- `headers()` from `next/headers` when calling `getSiteOrigin` (`src/lib/auth/origin.ts`) without `NEXT_PUBLIC_SITE_URL`.
- `localStorage` / `sessionStorage` when calling `oncesungStore` (`src/lib/store.ts`). The module is marked `"use client"`. Guard on `typeof window === "undefined"` is already inside `readRaw` and `set`.

**What NOT to Mock:**

- Zod, `fieldErrors`, `safeNextPath`, `hrefFromHtml`, `resolvePackage`, `escapeHtml` via `withAccountProfile`, or `rewriteLegacyNavInSource`. They are deterministic and have no I/O.
- `PACKAGES` and `MOCK_ORDERS`. Assert against the constants in `src/lib/store.ts` and `src/data/mock-orders.ts` directly.
- Generated HTML in `src/data/page-content.ts`. It is a ZIP snapshot. Do not snapshot it in a test.
- `src/features/**/*.raw.js` and `src/data/page-html/**`. ESLint ignores them. The strings that actually run are `ACCOUNT_SCRIPT`, `INTAKE_SCRIPT`, `REQUESTS_SCRIPT`, `ACCOUNT_HTML`, `REQUESTS_HTML`, and `INTAKE_SHELL`.

## Fixtures and Factories

**Test Data:**

Not detected. Production "fixtures" are the demo constants. Use them as the sample shape, and do not treat them as database seed:

```typescript
export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "OS-1042",
    title: "Our First Year",
    status: "ready",
    packageName: "Signature",
    updatedLabel: "Ready to review",
  },
];
```

`src/data/mock-orders.ts`. Status values are `"in_progress" | "ready" | "completed"`.

Checkout form defaults in `src/features/checkout/CheckoutDetailsForm.tsx` are hardcoded demo values (`fullName: "Gergely"`). They are UI defaults, not a shared fixture module. Do not import the form component to reuse them.

Auth schemas already encode the legal inputs (`src/lib/auth/schema.ts`):

- Email: trimmed, required, valid, max 254. Messages: `"Enter your email"`, `"Enter a valid email"`.
- Password (register and reset): min 8, max 72. Message: `"Use at least 8 characters"`.
- Login password: min 1, max 72. Message: `"Enter your password"`.
- `fullName`: trim, min 2, max 100.
- `registerSchema` and `resetSchema` set `confirmPassword` when the values differ. Message: `"Passwords do not match"`.

`fieldErrors` keeps the first message for each top-level key and uses `"form"` when `issue.path[0]` is missing.

**Location:**

- Not detected. There is no `fixtures/` or `factories/` directory.
- Demo orders stay in `src/data/mock-orders.ts`.
- Package catalog stays in `src/lib/store.ts` (`PACKAGES`, `resolvePackage`). Unknown keys resolve to `"signature"`.

## Coverage

**Requirements:** None enforced.

**View Coverage:**

```bash
# Not available. /coverage is gitignored and no script writes it.
npm run typecheck
npm run lint
```

Do not add a coverage gate until a runner exists. The untested surface is the whole repository.

## Test Types

**Unit Tests:**

- Not used.
- Pure functions that can be tested by importing them and passing strings or plain objects:
  - `safeNextPath` in `src/lib/auth/redirect.ts`. Fallback is `"/account"`. Rejects empty values, `//...`, `/\\...`, backslashes, `://`, NUL, and paths starting with `/login`, `/register`, or `/forgot-password`. Allows other same-origin paths, including a hash.
  - `emailSchema`, `passwordSchema`, `loginSchema`, `registerSchema`, `forgotSchema`, `resetSchema`, `fieldErrors` in `src/lib/auth/schema.ts`.
  - `hrefFromHtml` and `HTML_TO_PATH` in `src/lib/routes.ts`. Leaves `#`, `http`, `mailto:`, and `data:` hrefs unchanged. Maps `checkout-details.html` to `/checkout/details` and keeps a hash.
  - `resolvePackage` in `src/lib/store.ts`. Only `"essential"`, `"signature"`, and `"concierge"` pass through.
  - `withAccountProfile` in `src/features/account/with-account-profile.ts`. Escapes `& < > " '` in the name and email before splicing them into `ACCOUNT_HTML` markers (`data-acct-name`, `data-acct-email`, `data-acct-initial`, `#pf-name`, `#pf-email`). Embeds `acct-server-profile` JSON with `<` written as `\u003c`.
  - `rewriteLegacyNavInSource` in `src/lib/run-legacy-script.ts`. Rewrites specific `location.href = '*.html'` assignments and `oncesung:` session keys to `localStorage` and App Router paths.
  - `getSiteOrigin` in `src/lib/auth/origin.ts` only with `headers()` stubbed or `NEXT_PUBLIC_SITE_URL` set to a non-secret fixture origin. It strips a trailing slash. Without a configured origin, a host other than `localhost` or `127.0.0.1` returns `http://localhost:3000`.

**Integration Tests:**

- Not used.
- The server paths that need a Supabase double rather than a live project:
  - `loginAction`, `registerAction`, `forgotPasswordAction`, `resetPasswordAction`, `signOut`, `googleSignInAction` in `src/features/auth/actions.ts`.
  - `POST` in `src/app/api/account/profile/route.ts`. Cases: invalid JSON → 400 `{ error: "Enter your name." }`; schema failure → 400 `{ error: "Use 100 characters or fewer." }`; no user → 401 `{ error: "Sign in again." }`; update error → 400 `{ error: "Could not save your name." }`; success → 200 `{ fullName }`.
  - `GET` in `src/app/auth/callback/route.ts`. No `code`, or `error` present, redirects via `failedRedirect`. `exchangeCodeForSession` failure redirects. A `full_name` / `name` metadata string is trimmed to 100 characters and written only when the profile `full_name` is still `""`.
  - `requireUser` in `src/lib/auth/require-user.ts`. No user redirects to `/login?next=` with `safeNextPath` applied.
  - `updateSession` in `src/lib/supabase/middleware.ts`. Signed-out requests to `PROTECTED` (`/account`, `/dashboard`, `/downloads`, `/song-player`, `/requests`, plus nested paths) redirect to `/login` with `next` set to the original path and search. Signed-in requests to `/login`, `/register`, or `/forgot-password` redirect through `safeNextPath`. Cookie writes on the Supabase response are copied onto the redirect response by `withSessionCookies`.
  - `listOwnPurchases` returns `[]` on no user or on query `error`. It selects `id, song_slug, order_reference, created_at` ordered by `created_at` descending.
  - `getOwnProfile` returns `null` without a user. Name falls back from `profiles.full_name` to `user_metadata.full_name` then `user_metadata.name`, trimmed and sliced to 100.

**E2E Tests:**

- Not used. No Playwright or Cypress config.
- Browser behavior that is only wired in effects, and is therefore invisible to `tsc`:
  - `SiteInteractions` in `src/components/SiteInteractions.tsx` (audio, accordions, checkout package selection, gift finder, demo forms).
  - `LegacyInteractivePage` plus `runLegacyScript` for `label` `"song-intake"`, `"account"`, and `"requests"` (`src/app/song-intake/page.tsx`, `src/app/account/page.tsx`, `src/app/requests/page.tsx`).
  - `AffiliatesEnhancer` in `src/features/affiliates/AffiliatesEnhancer.tsx`.
- `npm run build` does not execute those effects.

## Common Patterns

**Async Testing:**

Not detected. Async production functions always `await` the Next.js or Supabase call and then return a plain value or call `redirect`:

```typescript
export async function requireUser(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = safeNextPath(nextPath);
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return user;
}
```

`src/lib/auth/require-user.ts`. A test of this function has to stub `createClient` and treat `redirect` as a throw. Do not assert on a return value in the signed-out branch.

Page `searchParams` are promises. `LoginPage` in `src/app/login/page.tsx` does `const params = await searchParams` before `safeNextPath`. A page-level test must pass `Promise.resolve({ next, error })`.

**Error Testing:**

Not detected. Match the branch the handler already has. Do not assert that the raw Supabase message is shown.

Auth action outcomes from `src/features/auth/actions.ts`:

- Zod failure → `{ fields }` and no Supabase call.
- Rate limit → `{ error: "Too many attempts. Wait a minute and try again." }`.
- Invalid login → `{ error: "Email or password is incorrect." }`.
- Unconfirmed email → `{ error: "Confirm your email before signing in. Check your inbox for the link." }`.
- Other login failure → `{ error: "Could not sign in. Try again in a moment." }`.
- Duplicate registration → `{ success: "Check your email to confirm your account." }` (same copy as a real signup with no session).
- Forgot-password, including a non-rate-limit provider error → `{ success: "If an account exists for that email, we sent a reset link." }`.
- Reset with no user → `{ error: "This reset link is invalid or has expired. Request a new one." }`.
- Google start failure or missing `data.url` → `{ error: "Could not start Google sign-in. Try again." }`.

Login page notices are a closed map in `src/app/login/page.tsx`:

- `error=link` → invalid or expired sign-in link.
- `error=google` → account already exists.
- Any other `error` value → no notice (`NOTICES[params.error]` is `undefined`).

Schema messages to assert exactly:

- `"Enter your email"`, `"Enter a valid email"`, `"Enter your password"`, `"Use at least 8 characters"`, `"Use 72 characters or fewer"`, `"Enter your name"`, `"Use 100 characters or fewer"`, `"Confirm your password"`, `"Passwords do not match"`.

`safeNextPath` cases to assert exactly:

- `null`, `undefined`, `""` → `"/account"` (or the `fallback` argument).
- `"//evil.example"`, `"/\\evil"`, `"https://evil.example"`, `"/account\\x"`, strings containing `"://"` or `"\0"` → fallback.
- `"/login"`, `"/login?next=/account"`, `"/register"`, `"/forgot-password/extra"` → fallback.
- `"/account"`, `"/dashboard"`, `"/song-intake#top"` → returned unchanged.

`hrefFromHtml` cases to assert exactly (`src/lib/routes.ts`):

- `"#pricing"`, `"https://example.com"`, `"mailto:hi@oncesung.com"`, `"data:text/plain,hi"` → unchanged.
- `"checkout-details.html"` → `"/checkout/details"`.
- `"faq.html#contact"` → `"/faq#contact"`.
- `"unknown.html"` → `"unknown"` (strip `.html` when the key is missing).

Storage and legacy-script tests, if added, should assert return values rather than spy on `console.error`. The only `console.error` is the legacy-script failure path in `src/lib/run-legacy-script.ts`, and it also removes `label` from the internal set so a later `runLegacyScript` can retry. That set is not exported. Prefer `rewriteLegacyNavInSource` for a deterministic assertion.

---

*Testing analysis: 2026-10-25*
