# Codebase Concerns

**Analysis Date:** 2026-10-25

PayPal cannot be dropped onto the current checkout. The payment screen is a demo form, prices live in the browser, and the database models a catalog download rather than a commissioned song. A capture would have nowhere authoritative to land, and the confirmation page already tells every visitor they paid.

## Tech Debt

**Checkout is a client demo, not an order pipeline:**
- Issue: `/checkout/payment` renders static HTML from `html_checkout_payment` in `src/data/page-content.ts`. The form is `<form data-demo="" data-next="/order-confirmed">`. `src/components/SiteInteractions.tsx` prevents that submit, toasts `Demo only — no payment was processed.`, and calls `router.push` to the next path. The PayPal tile (`data-method="paypal"`) only toggles `#wallet-note` (`You'll be redirected to PayPal`). Nothing creates a PayPal order, redirects to PayPal, or captures a payment. The same handler serves every `form[data-demo]`, including the gift-card form.
- Files: `src/data/page-content.ts`, `src/app/checkout/payment/page.tsx`, `src/components/SiteInteractions.tsx`, `src/app/order-confirmed/page.tsx`
- Impact: A PayPal button or redirect placed on this form still ends at a static success page. The merchant never learns the PayPal order id, and the customer can open `/order-confirmed` with no payment.
- Fix approach: Replace the demo submit with a server route that creates a PayPal order from a server-side catalog, then capture on the return URL and on a verified webhook. Stop routing `data-next="/order-confirmed"` from the browser. Keep `/order-confirmed` behind a capture that this server just completed.

**No server price catalog, and the client total is display-only:**
- Issue: Charged amounts exist only as numbers in `PACKAGES` in `src/lib/store.ts` (Essential 49, Signature 89, Concierge 149 USD) and as duplicated copy in `html_pricing`, `html_checkout_package`, `html_checkout_review`, and `html_checkout_payment` inside `src/data/page-content.ts`. `renderSummary` in `src/components/SiteInteractions.tsx` writes `[data-total]` from `localStorage` key `oncesung:package`. `resolvePackage` maps any other key to `signature`. Tax is a hardcoded `$0.00` in the payment HTML. There is no `amount_cents`, currency column, or price module on the server.
- Files: `src/lib/store.ts`, `src/components/SiteInteractions.tsx`, `src/data/page-content.ts`
- Impact: PayPal Orders v2 needs a server-computed `value` and `currency_code`. Trusting the DOM total or the stored package key lets a buyer switch `oncesung:package` to `essential` after reviewing Concierge, or edit `[data-total]`, and underpay. Feature bullets also disagree: `PACKAGES.signature.features` omits the “up to 3 minor revisions” line that `html_pricing` and `LIMITS` in `src/features/requests/requests-script.ts` both state.
- Fix approach: One server module owns package key, integer cents, currency `USD`, and the entitlement counts (revisions, remakes, files). Create-order reads that module and ignores client money. Pass only the package key, and re-read the stored order row at capture time so a localStorage edit between create and capture cannot change the amount.

**`public.purchases` cannot store a PayPal song commission:**
- Issue: `supabase/migrations/done/20261021120100_purchases.sql` defines `user_id` (required, references `auth.users`), `song_slug` (required, not blank), `order_reference` (required, not blank), and `created_at`. Uniqueness is `(user_id, song_slug, order_reference)`. The migration comment says inserts happen later with the service role. There is no `package_key`, `amount_cents`, `currency`, `status`, PayPal order id, capture id, payer id, brief id, or refund fields. `song_slug` assumes a catalog track. Checkout sells a custom song that has no slug yet.
- Files: `supabase/migrations/done/20261021120100_purchases.sql`, `src/lib/purchases.ts`, `src/lib/supabase/admin.ts`
- Impact: A successful PayPal capture cannot be recorded without inventing a slug and an auth user first. Guest checkout cannot be inserted (`user_id` is not null). Pending, approved, captured, denied, and refunded are indistinguishable. Two captures can collide or double-grant if the slug or reference is generated differently on the return URL and the webhook. `createAdminClient()` in `src/lib/supabase/admin.ts` is never called, and `listOwnPurchases()` is never called, so the table is unused.
- Fix approach: Add an `orders` table written before the PayPal redirect: id, `user_id` (nullable only if guest claim is a real requirement), `package_key`, `amount_cents`, `currency`, `status`, `paypal_order_id` unique, `paypal_capture_id` unique, brief snapshot, timestamps. Insert the entitlement row only after capture, with the service role, idempotent on capture id. Keep RLS as select-own; do not add a user insert policy. Extend `listOwnPurchases` (or a new order query) and use it from `src/app/dashboard/page.tsx` and `src/app/downloads/page.tsx`.

**Order payload never leaves the browser:**
- Issue: The song brief and checkout contact details are stored with `localStorage` / `sessionStorage` keys `oncesung:brief`, `oncesung:story`, `oncesung:details`, and `oncesung:briefs`. Intake `toCheckout` in `src/features/intake/intake-ui.raw.js` writes the brief, then `src/lib/run-legacy-script.ts` rewrites those `sessionStorage.setItem` calls onto `localStorage`. `CheckoutDetailsForm` in `src/features/checkout/CheckoutDetailsForm.tsx` saves `oncesung:details` and routes to `/checkout/payment`. Recordings stay in a page-local `files` array (10 MB per file, 25 MB total) and are dropped on refresh; the saved brief only stores file names. No route accepts the brief or the audio.
- Files: `src/features/intake/intake-ui.raw.js`, `src/features/intake/intake-script.ts`, `src/lib/run-legacy-script.ts`, `src/features/checkout/CheckoutDetailsForm.tsx`, `src/lib/store.ts`, `src/features/account/account-script.ts`
- Impact: PayPal `custom_id` / `invoice_id` have nothing durable to point at. A buyer who pays on another device, or who clears site data before the return URL, leaves a capture with no story, no recipient, and no pronunciation recordings. Fulfillment cannot start from the database.
- Fix approach: Persist the brief (and upload recordings to a private Supabase bucket) in a draft order while the buyer is signed in, before create-order. Send PayPal only the draft order id. On return, load that row by id rather than rebuilding state from `localStorage`.

**Gift cards, referrals, and affiliates are separate unpaid demos:**
- Issue: `html_gift_cards` in `src/data/page-content.ts` is `form[data-demo="Gift card added — continue to checkout to send it."]`. Amount chips (`$49`, `$89`, `$149`) are visual `data-select` toggles and are not written to `oncesungStore`. Submit does not set `data-next`, so `SiteInteractions` only toasts. `html_referral` copies `https://oncesung.com/r/GERGELY20`; `src/app` has no `/r/[code]` route. `src/features/affiliates/AffiliatesEnhancer.tsx` computes `orders × package price × 25%` in the browser and saves the application to `oncesung-affiliate-draft-v1`. The hero in `html_affiliates` says the program is opening soon. The form status text says the draft has not been submitted.
- Files: `src/data/page-content.ts`, `src/app/gift-cards/page.tsx`, `src/app/referral/page.tsx`, `src/features/affiliates/AffiliatesEnhancer.tsx`, `src/app/affiliates/page.tsx`
- Impact: A PayPal song checkout must not reuse these forms. There is no gift-card SKU, code, balance, or redemption line. A future browser-side discount would desync the PayPal amount from the catalog. Affiliate commission has no ledger and no PayPal Payouts recipient.
- Fix approach: Ship song checkout first, with no coupon field until a server-priced adjustment exists. Give gift cards their own product type and webhook branch. Leave affiliate applications as drafts until a server intake exists.

**Legacy script strings diverge from the files that look like the source:**
- Issue: Pages execute string constants through `new Function` in `src/lib/run-legacy-script.ts`. `src/app/account/page.tsx` runs `ACCOUNT_SCRIPT` from `src/features/account/account-script.ts`, which POSTs the name to `/api/account/profile`. `src/features/account/account.raw.js` still writes the whole profile, including email, to `oncesung:profile` and never calls that API. Requests and intake run `src/features/requests/requests-script.ts` and `src/features/intake/intake-script.ts`. ESLint ignores `src/features/**/*.raw.js` in `eslint.config.mjs`.
- Files: `src/lib/run-legacy-script.ts`, `src/components/LegacyInteractivePage.tsx`, `src/features/account/account-script.ts`, `src/features/account/account.raw.js`, `eslint.config.mjs`
- Impact: Editing the `.raw.js` file does not change account behavior. Regenerating the string from the raw file would drop the profile API save. `new Function` requires `unsafe-eval` if a Content-Security-Policy is added for the payment page.
- Fix approach: Treat the `*-script.ts` strings as the runtime source, or generate them in one direction and fail CI on drift. Replace `new Function` with a module before tightening CSP on checkout.

**Static marketing HTML is the checkout UI:**
- Issue: Package, review, payment, confirmation, dashboard, and downloads are HTML strings in `src/data/page-content.ts`, injected by `src/components/HtmlMain.tsx`. Only `src/app/checkout/details/page.tsx` is a React form. Prices, steppers, and the fake order number `VS-2026-001234` are edited inside those strings.
- Files: `src/data/page-content.ts`, `src/components/HtmlMain.tsx`, `src/app/checkout/package/page.tsx`, `src/app/checkout/review/page.tsx`, `src/app/checkout/payment/page.tsx`
- Impact: A PayPal button has no React mount point on the payment page except by splicing more HTML or by replacing the page. Copy and price edits are easy to miss in the minified strings.
- Fix approach: Rebuild `/checkout/payment` as a client component that mounts the PayPal JS SDK button and reads the draft order. Leave the marketing pages as HTML until they need real data.

## Known Bugs

**Pay confirms an order that was never placed:**
- Symptoms: Submit on `/checkout/payment` shows a toast that no payment was processed, then `/order-confirmed` renders `Your order is confirmed!`, `Order #VS-2026-001234`, and `gergely@example.com`. A banner in `html_order_confirmed` says `Frontend demo — No payment was processed and no order was placed.` Visiting `/order-confirmed` directly shows the same success state. `src/app/sitemap.ts` lists `/order-confirmed` and `/checkout/payment`.
- Files: `src/components/SiteInteractions.tsx`, `src/data/page-content.ts`, `src/app/order-confirmed/page.tsx`, `src/app/sitemap.ts`
- Trigger: Submit the payment form with the card fields hidden (PayPal, Google Pay, or Apple Pay selected) or filled (Card selected), or open `/order-confirmed`.
- Workaround: None. The page is the designed end of the demo. Remove it from the sitemap and from unauthenticated navigation when capture exists. Show confirmation only when the server has a captured order id.

**Checkout steppers describe a path the links do not take:**
- Symptoms: `html_checkout_package` is a 3-step stepper (Choose Package → Tell Your Story → Review & Pay) and its button goes to `/song-intake`. `html_checkout_review` is a 4-step stepper whose current step is `1 Package`, while the primary button goes to `/checkout/details`. `CheckoutDetailsForm` marks step 2 current and its back link returns to `/checkout/review`. `html_checkout_payment` marks step 3 Payment current and step 4 Review still ahead, but submit goes to `/order-confirmed`, not to a review page.
- Files: `src/data/page-content.ts`, `src/features/checkout/CheckoutDetailsForm.tsx`, `src/features/intake/intake-ui.raw.js`, `src/features/account/account-script.ts`
- Trigger: Walk pricing → `/checkout/package` → `/song-intake` → `/checkout/review` → `/checkout/details` → `/checkout/payment`. Account “Order this song” jumps straight to `/checkout/review`.
- Workaround: Treat the real path as package (optional) → intake → review → details → payment. For PayPal, capture on the return from PayPal; do not add a fourth “review” step after the wallet.

**Empty checkout still shows someone else’s story and identity:**
- Symptoms: Review HTML defaults are Anniversary / Jess / Partner / Dec 24, 2026 / Acoustic Pop. `SiteInteractions` overwrites `[data-show]` only when `oncesung:story` parses. Payment and review summaries default to Signature `$89.00` via `resolvePackage`. `CheckoutDetailsForm` `defaultValues` are `Gergely`, `gergely@example.com`, gift on, recipient `Jess`. The signed-in profile from `src/lib/account/profile.ts` is not read.
- Files: `src/data/page-content.ts`, `src/components/SiteInteractions.tsx`, `src/features/checkout/CheckoutDetailsForm.tsx`, `src/lib/store.ts`
- Trigger: Open `/checkout/review` or `/checkout/details` with those keys absent, or as any account other than the sample identity.
- Workaround: None. Require a server draft (or at least a parsed brief) before create-order, and prefill contact fields from `profiles` when a session exists. Do not submit the sample defaults to PayPal.

**Dashboard and downloads ignore the signed-in user:**
- Symptoms: `src/app/dashboard/page.tsx` and `src/app/downloads/page.tsx` call `requireUser`, then render fixed HTML. The sidebar says `Gergely V.` / `gergely@example.com`. Orders are `Our First Year` (`#VS-2026-001234`), `Happy Birthday, Max`, and `Our Wedding Day`. The search box has no listener. Sidebar Logout is `<a href="/">`, which does not call `signOut` from `src/features/auth/actions.ts` (the header form does). Download buttons use `data-toast="Download starts when your real files are connected"`.
- Files: `src/app/dashboard/page.tsx`, `src/app/downloads/page.tsx`, `src/app/song-player/page.tsx`, `src/data/page-content.ts`, `src/data/mock-orders.ts`, `src/components/SiteHeader.tsx`
- Trigger: Sign in as any user and open `/dashboard` or `/downloads`.
- Workaround: None. `src/data/mock-orders.ts` (`OS-1042` “Our First Year”, `OS-1038` “Happy Birthday, Liam”, `OS-1021` “Thank You, Mom”) is exported and unused, so it cannot fix the page. Render orders from the new orders table and call `signOut` from the dashboard nav.

**Revision allowances are whatever package the browser picks:**
- Symptoms: `LIMITS` in `src/features/requests/requests-script.ts` is Essential 1 revision / 0 remakes, Signature and Concierge 3 / 3. The requests form has `#rq-package`. Counts are `oncesung:requests` in `localStorage`, keyed by a client song id or a typed order number. The sidebar name comes from `oncesung:profile`, not from `getOwnProfile()`.
- Files: `src/features/requests/requests-script.ts`, `src/features/requests/requests.raw.js`, `src/app/requests/page.tsx`
- Trigger: On `/requests`, change the package control or edit `localStorage`, then submit a remake.
- Workaround: None until entitlements are read from the captured order. The client check can stay as a hint; the server must reject over-quota requests.

**Account phone number is only on this device:**
- Symptoms: `profiles` in `supabase/migrations/done/20261021120000_profiles.sql` has `full_name` and `email`. `account-script.ts` saves `full_name` through `src/app/api/account/profile/route.ts` and stores `phone` in `oncesung:profile`. Clear restores the server name and blanks the phone locally. `account.raw.js` does not match this behavior.
- Files: `src/features/account/account-script.ts`, `src/features/account/account.raw.js`, `src/app/api/account/profile/route.ts`, `supabase/migrations/done/20261021120000_profiles.sql`
- Trigger: Save a phone on `/account`, then open the account on another browser.
- Workaround: Phone is not required for PayPal. Add a column only if fulfillment needs it, and write it from the profile route.

**Production origin falls back to localhost:**
- Symptoms: `getSiteOrigin` in `src/lib/auth/origin.ts` returns `NEXT_PUBLIC_SITE_URL` when set. Otherwise, any host other than `localhost` or `127.0.0.1` becomes `http://localhost:3000`. Layout `metadataBase` in `src/app/layout.tsx` falls back to `https://www.oncesung.com`. `src/app/sitemap.ts` falls back to `https://oncesung.com`. The referral button copies `https://oncesung.com/r/GERGELY20`.
- Files: `src/lib/auth/origin.ts`, `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/data/page-content.ts`
- Trigger: Run without `NEXT_PUBLIC_SITE_URL` behind a real host, or configure PayPal return URLs against a different host than the sitemap.
- Workaround: Set `NEXT_PUBLIC_SITE_URL` to the single canonical origin and use that helper for PayPal `return_url` and `cancel_url`. Reject create-order when the helper would return localhost outside development.

## Security Considerations

**Raw card fields on a page that claims the card never touches the server:**
- Risk: `#card-form` in `html_checkout_payment` collects card number (`#cc-number`), expiry (`#cc-exp`), CVC, and name on card, with `required` and `autocomplete="off"`. `SiteInteractions` reformats the number to 16 digits in the DOM. The form is not posted today because the demo handler calls `preventDefault`, and the inputs have no `name`. The inline note says to connect a provider such as Stripe Elements and that card data should never touch this server. Copy above the form says the information is encrypted and the card is never stored, next to a `256-bit encryption` badge.
- Files: `src/data/page-content.ts`, `src/components/SiteInteractions.tsx`
- Current mitigation: Submit is cancelled. `.hide{display:none!important}` in `src/styles/oncesung.css` hides the card form for PayPal, so those `required` fields are not in the way of the demo submit while `display:none` stays.
- Recommendations: For PayPal, remove the card inputs. Mount PayPal Buttons (or PayPal hosted card fields if card-on-PayPal is required) so PAN and CVC never enter this DOM. Do not add `name` attributes or a route that accepts `cc-number`. If `.hide` stops meaning `display:none`, the required card fields will block the PayPal submit via native validation; disable those inputs when the method is not card until the fields are deleted.

**Client-chosen package and a public success URL:**
- Risk: Package selection is `oncesungStore.set("package", …)` from `data-package` links and from `[data-pkg-group]` in `src/components/SiteInteractions.tsx`. Checkout routes are not in `PROTECTED` in `src/lib/supabase/middleware.ts` (`/account`, `/dashboard`, `/downloads`, `/song-player`, `/requests` only), and `src/proxy.ts` applies that gate. Anyone can open payment and confirmation. After a real PayPal return, a forged query string on `/order-confirmed` would show success unless the page checks a server capture.
- Files: `src/lib/store.ts`, `src/components/SiteInteractions.tsx`, `src/lib/supabase/middleware.ts`, `src/proxy.ts`, `src/app/order-confirmed/page.tsx`
- Current mitigation: No money moves. `purchases` RLS allows authenticated `select` of own rows only, and grants no insert to `anon` or `authenticated` (`supabase/migrations/done/20261021120100_purchases.sql`).
- Recommendations: Create and capture PayPal orders only on the server. Store the package key on the order row at create time. Require a session before create-order so `user_id` matches `auth.uid()`, unless a separate guest-claim design adds a nullable user and a claim token. Return URL should call capture and then redirect to a confirmation page that reads that row. Verify `PayPal-Transmission-Sig` (or the current PayPal webhook verification API) before `createAdminClient()` writes anything.

**Downloads and the purchased-songs bucket are not connected:**
- Risk: Any signed-in user can open `/downloads` and `/song-player` and see the same sample song. `supabase/migrations/done/20261021120200_purchased_songs_bucket.sql` creates a private bucket `purchased-songs` (50 MB; `audio/mpeg`, `audio/wav`, `audio/x-wav`, `audio/wave` only) with no browser read policy. The comment says a later route will check `purchases` and mint a signed URL. No `createSignedUrl` or `storage.from` call exists. The downloads UI also offers a lyrics PDF, cover JPG, and “Download All Files”, which the bucket MIME list rejects.
- Files: `supabase/migrations/done/20261021120200_purchased_songs_bucket.sql`, `src/app/downloads/page.tsx`, `src/app/song-player/page.tsx`, `src/data/page-content.ts`
- Current mitigation: Buttons toast instead of downloading. The bucket is private.
- Recommendations: Add a route that loads the captured order for `auth.uid()`, then signs a short-lived URL with the service role. Extend allowed MIME types only for the file kinds that product includes (PDF, JPEG) or store those objects in a sibling private bucket. Do not make the bucket public. Share links in `html_share` (`https://oncesung.com/s/our-first-year`) need an authenticated or tokenized route; that path does not exist.

**Service role client bypasses RLS and has no caller yet:**
- Risk: `createAdminClient` uses `SUPABASE_SERVICE_ROLE_KEY` and disables session persistence. A PayPal webhook that calls it without signature checks can grant songs to arbitrary `user_id`s. The key is not referenced anywhere else, which avoids accidental client imports (`server-only` is on the module).
- Files: `src/lib/supabase/admin.ts`
- Current mitigation: Unused. `.env*` is gitignored (`.gitignore`). Do not commit the service role or a PayPal secret.
- Recommendations: Call the admin client only from a webhook route and from capture-after-verify. Scope the env vars to the server. Add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_WEBHOOK_ID` (names only; values stay in the host env). No PayPal package is in `package.json`.

**Profile update is a small authenticated write; checkout must not copy its trust model:**
- Risk: `POST /api/account/profile` updates `full_name` for `auth.uid()` only, with a 100-character Zod cap. That pattern is safe for a name. It is not a template for marking an order paid: the browser must not POST `status: captured`.
- Files: `src/app/api/account/profile/route.ts`, `src/lib/auth/require-user.ts`, `src/lib/auth/redirect.ts`
- Current mitigation: RLS `grant update (full_name)` and the route’s `getUser` check. `safeNextPath` blocks protocol-relative redirects on login.
- Recommendations: Keep payment mutations on the service role after PayPal verification. Rate-limit create-order. `getSiteOrigin` must be the return URL host so OAuth and PayPal cannot be pointed at localhost in production.

## Performance Bottlenecks

**Every marketing and checkout document is one string module:**
- Problem: `src/data/page-content.ts` holds the full HTML for occasions, FAQ, gift cards, referral, affiliates, sitemap, both checkout steps, payment, dashboard, downloads, share, and the rest of the static pages. Each page imports one export, but the source file is a single editing surface full of inlined SVG.
- Files: `src/data/page-content.ts`, `src/components/HtmlMain.tsx`
- Cause: The site was ported from static HTML mocks into string exports.
- Improvement path: Split checkout strings out only if the payment page stays on `HtmlMain` temporarily. Prefer a real payment component so PayPal’s script is loaded on `/checkout/payment` alone.

**Legacy wizards re-parse and eval large scripts on mount:**
- Problem: `LegacyInteractivePage` assigns `innerHTML` and runs `runLegacyScript`, which rewrites navigation with a chain of regular expressions and then `new Function`. Intake (`src/features/intake/intake-script.ts`, backed by `intake-ui.raw.js` and `intake-core.raw.js`) rebuilds the questionnaire with `innerHTML` on each step. `ranLabels` skips a second run until unmount.
- Files: `src/components/LegacyInteractivePage.tsx`, `src/lib/run-legacy-script.ts`, `src/features/intake/intake-ui.raw.js`
- Cause: ZIP-faithful imperative scripts instead of React state.
- Improvement path: Leave intake as-is for a PayPal pass, except persist its `pack()` result to the server. Do not run the intake script on the payment page.

**Site-wide interaction script walks the whole document:**
- Problem: `SiteInteractions` in the root layout binds clicks, audio, carousels, package summary, and demo forms on every route, including auth pages.
- Files: `src/components/SiteInteractions.tsx`, `src/app/layout.tsx`
- Cause: One client component emulates the old global script.
- Improvement path: When the payment page becomes real, keep PayPal’s button handler next to that page so a failed selector on a marketing page cannot swallow the pay click.

## Fragile Areas

**`runLegacyScript` string rewrites are the only router for intake and account:**
- Files: `src/lib/run-legacy-script.ts`, `src/features/intake/intake-ui.raw.js`, `src/features/account/account-script.ts`
- Why fragile: Navigation works because exact snippets such as `location.href='checkout-review.html'` are replaced with `location.href='/checkout/review'`. A quote-style or whitespace change in the script string ships a dead link to a file that does not exist. `patchStorage` copies every `oncesung:` `sessionStorage` write into `localStorage` for the lifetime of the tab (`__oncesungStoragePatched`).
- Safe modification: Add new PayPal routes in React (`src/app/checkout/...` or `src/app/api/paypal/...`). Extend `rewriteLegacyNavInSource` only when an existing script gains a new `.html` target. Re-test intake “continue to checkout”, account “Order this song”, and edit-brief restore.
- Test coverage: None.

**Package key is read through two storage APIs and two encodings:**
- Files: `src/lib/store.ts`, `src/components/SiteInteractions.tsx`, `src/features/requests/requests-script.ts`
- Why fragile: `oncesungStore.set` `JSON.stringify`s the key, so the stored text is `"signature"` including quotes. Requests does `JSON.parse` on `sessionStorage.getItem('oncesung:package')`, rewritten to localStorage-or-sessionStorage. A raw unquoted write parses as a thrown error and is ignored, and the control falls back to Signature.
- Safe modification: Stop using this key as the billing source. If the UI still mirrors it, write and read it only through `oncesungStore`.
- Test coverage: None.

**Payment method UI versus the submit handler:**
- Files: `src/data/page-content.ts`, `src/components/SiteInteractions.tsx`, `src/styles/oncesung.css`
- Why fragile: Method tiles dispatch a custom `change` event. Only the card-versus-wallet visibility listens. The submit handler does not read `data-method`. Google Pay and Apple Pay are the same fake wallet note as PayPal. Card `required` is skipped only while the card block stays `display:none`.
- Safe modification: Delete the four tiles when the PayPal button is the sole method. If card-on-site remains, it has to be PayPal’s hosted fields, not `#cc-number`.
- Test coverage: None.

**Auth session gate does not wrap checkout:**
- Files: `src/proxy.ts`, `src/lib/supabase/middleware.ts`, `src/lib/auth/require-user.ts`
- Why fragile: Adding `/checkout/payment` to `PROTECTED` without a draft-order handoff will bounce a guest mid-flow and drop nothing server-side (the brief is still local). Leaving it public means capture must not assume `auth.uid()` unless create-order required a session.
- Safe modification: Decide guest versus signed-in before coding the return URL. `purchases.user_id` currently requires a user, so signed-in create-order matches the schema with less migration risk.
- Test coverage: None.

## Scaling Limits

**One row shape for “song the user has paid for”:**
- Current capacity: Schema supports many read rows per user (`purchases_user_id_idx`) but each row needs a non-blank `song_slug` and a user. There is no status index, no webhook inbox, and no partial unique index on a PayPal id.
- Limit: The first real capture either fails the NOT NULL checks or overloads `song_slug` / `order_reference` with PayPal ids and becomes impossible to refund or replay safely. `listOwnPurchases` returns `[]` on any error, so a failed insert looks like an empty library.
- Scaling path: Orders table plus idempotency unique on `paypal_capture_id`. Store webhook event ids. Teach the reader to surface a fetch error instead of an empty list.

**Browser quota for briefs:**
- Current capacity: Intake keeps up to 50 briefs in `oncesung:briefs` (`intake-ui.raw.js`). Recordings are not in that JSON. Requests, profile phone, affiliate drafts, and package selection share the same origin storage.
- Limit: Private-mode quota, cleared storage, or a second device drops the only copy of the order. PayPal’s return can succeed while the brief is gone.
- Scaling path: Server draft before redirect. Keep localStorage as a cache for the questionnaire only.

**Tax and refunds are copy, not data:**
- Current capacity: Payment HTML always shows tax `$0.00`. Guarantee copy (payment sidebar and `html_pricing`) offers a full refund within 14 days of delivery. No refund table, no capture id, no PayPal refund call.
- Limit: A cross-border digital sale or a real refund has no record. PayPal disputes cannot be matched to a package amount.
- Scaling path: Store captured cents and the capture id. Implement refund as a server action that calls PayPal’s refund API and sets `status` to `refunded`. Leave tax at zero only as an explicit catalog decision in the server price module, not as a string in the HTML.

**Downloaded files:**
- Current capacity: Bucket limit 50 MB and audio MIME types only. Downloads UI lists WAV, MP3, instrumental MP3, lyrics PDF, and cover JPG.
- Limit: WAV plus artwork for one Concierge delivery can miss the MIME allow-list even when the object is small. There is no ZIP builder behind “Download All Files”.
- Scaling path: After capture, store each deliverable with an allowed content type and sign per file. Build the ZIP on demand or store a prebuilt archive under the same purchase check.

## Dependencies at Risk

**No PayPal (or other payment) dependency is installed:**
- Risk: `package.json` dependencies are Next `^16.4.2`, React `19.1.0`, Supabase (`@supabase/ssr` `^0.12.7`, `@supabase/supabase-js` `^2.118.0`), Zod, react-hook-form, and lucide-react. There is no `@paypal/paypal-server-sdk`, `@paypal/react-paypal-js`, Stripe package, or mailer. The payment HTML names Stripe Elements as the example provider, which conflicts with a PayPal integration.
- Impact: Nothing in the lockfile can create or verify a PayPal order. Following the HTML comment would add a second processor and keep raw card fields.
- Migration plan: Add the current PayPal server SDK for create/capture/webhook verify, and the PayPal JS SDK script on the payment page only. Do not add Stripe unless card acquiring is a separate decision. Configure the app in PayPal against `NEXT_PUBLIC_SITE_URL`.

**Next.js 16 and the `proxy` session gate:**
- Risk: Session refresh lives in `src/proxy.ts` calling `src/lib/supabase/middleware.ts`, not in a `middleware.ts` file. Checkout is outside the matcher’s auth redirect on purpose (the matcher runs the proxy broadly; the allowlist is inside `updateSession`).
- Impact: A PayPal return request must run through this proxy so Supabase cookies are refreshed before capture reads `getUser`. A return URL that skips cookies (PayPal’s browser redirect is a normal navigation, so cookies should be present) still needs the session that created the order.
- Migration plan: Attach the PayPal return route under `src/app`, inside the existing proxy matcher. Do not put secrets in `NEXT_PUBLIC_*`.

**Supabase service role and Auth redirects share one origin helper:**
- Risk: Google sign-in and password reset in `src/features/auth/actions.ts` use `getSiteOrigin`. The same gap (localhost fallback, www versus apex) will affect PayPal return URLs if they are built ad hoc.
- Impact: OAuth and PayPal can be configured against different hosts. `handle_new_user` in `supabase/migrations/done/20261021120000_profiles.sql` creates the profile row PayPal fulfillment will want to join; it does not create an order.
- Migration plan: One origin helper for Auth `emailRedirectTo` and PayPal return/cancel URLs. Confirm the profile trigger has been applied in the target project before relying on `user_id` joins (`migrations/done/` is the applied set).

## Missing Critical Features

**PayPal create, approve, capture, and webhook:**
- Problem: No `src/app/api/**` route besides `src/app/api/account/profile/route.ts`. No webhook route, no signature check, no idempotency store, no client id env var, no sandbox-versus-live switch.
- Blocks: Taking money for Essential, Signature, or Concierge. Also blocks gift cards, which are a second unpaid form rather than a line item.

**Durable order and brief before redirect:**
- Problem: Brief, contact details (`fullName`, `email`, `updates`, `isGift`, `recipient`, `relationship`, `notes`), package, and recordings are not written to Postgres. `isGift` (“We won't include any pricing information”) is a checkbox in `CheckoutDetailsForm` with no order column.
- Blocks: PayPal `purchase_unit` description, invoice id, fulfillment, and the gift-privacy promise. Capture-then-hope the browser still has `oncesung:brief` will lose paid orders.

**Entitlement, delivery, and email after capture:**
- Problem: Dashboard, song player, and downloads are static. The purchased-songs bucket has no signer. `html_order_confirmed` links to `/email-confirmation`, which is a preview page, not a sent message. No mail provider is installed. Revision quotas are local.
- Blocks: The post-pay product the pricing page describes (MP3, WAV, revisions, remakes, 48-hour or 72-hour delivery). PayPal can capture and the buyer still has no files and no status.

**Refunds, tax decision, and reconciliation:**
- Problem: 14-day money-back copy has no refund implementation. Tax is a fixed `$0.00` label. Order numbers are the literal `VS-2026-001234`.
- Blocks: Matching a PayPal dispute or settlement report to a package and a customer. A refund button that only flips local UI would desync PayPal.

**Guest versus account is undecided in the schema:**
- Problem: Checkout does not require login. `purchases.user_id` does. Header account links are session-aware (`src/components/SiteHeader.tsx`); checkout contact email is not the auth email.
- Blocks: Inserting the capture. Pick signed-in checkout (smaller change, fits RLS) or a guest order plus a claim flow (schema change). Do not insert with the service role using a client-supplied `user_id`.

## Test Coverage Gaps

**Payments and orders:**
- What's not tested: Demo submit, package price rendering, PayPal return (absent), webhook signature (absent), amount tampering, idempotent capture, RLS (user cannot insert `purchases`).
- Files: `src/components/SiteInteractions.tsx`, `src/lib/store.ts`, `src/lib/purchases.ts`, `supabase/migrations/done/20261021120100_purchases.sql`
- Risk: The first live capture can double-grant, grant the wrong package, or confirm with no row.
- Priority: High

**Checkout navigation and steppers:**
- What's not tested: Intake to `/checkout/review`, review to details, details to payment, payment’s actual destination, empty-state sample data, details Zod validation.
- Files: `src/features/intake/intake-ui.raw.js`, `src/features/checkout/CheckoutDetailsForm.tsx`, `src/data/page-content.ts`
- Risk: A PayPal button mounted on the wrong step, or sample identity `gergely@example.com` shipped as the payer.
- Priority: High

**Auth and profile:**
- What's not tested: `requireUser`, `safeNextPath`, Google callback `src/app/auth/callback/route.ts`, profile POST, `getSiteOrigin` localhost fallback.
- Files: `src/lib/auth/require-user.ts`, `src/lib/auth/redirect.ts`, `src/lib/auth/origin.ts`, `src/features/auth/actions.ts`, `src/app/api/account/profile/route.ts`
- Risk: Return URL or OAuth redirect leaves the PayPal buyer on the wrong host or an open redirect. `safeNextPath` is the pattern to copy for PayPal’s in-app cancel path.
- Priority: Medium

**Entitlements and files:**
- What's not tested: `LIMITS`, signed URL issuance (absent), bucket MIME allow-list versus the downloads UI.
- Files: `src/features/requests/requests-script.ts`, `src/app/downloads/page.tsx`, `supabase/migrations/done/20261021120200_purchased_songs_bucket.sql`
- Risk: Buyers download another user’s song, or Essential buyers request Concierge remakes.
- Priority: High

**Automated runner:**
- What's not tested: The repo has no `*.test.*` / `*.spec.*` files, no Jest or Playwright dependency, and no test script in `package.json`. Scripts are `dev`, `build`, `start`, `lint`, and `typecheck`. No `.github` workflow is present. `src/features/**/*.raw.js` is ESLint-ignored.
- Files: `package.json`, `eslint.config.mjs`
- Risk: Checkout regressions land as string edits in `src/data/page-content.ts` with no failure signal.
- Priority: High

---

*Concerns audit: 2026-10-25*
