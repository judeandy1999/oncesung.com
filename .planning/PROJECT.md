# Oncesung

## What This Is

Oncesung sells a personalized song as a gift. A signed-in customer tells the story, picks one of the three packages already on the site, and pays that price once with PayPal. The owner writes the song by hand, uploads the file from an admin page, and the customer plays and downloads it from My Orders.

## Core Value

A customer can pay for one song package with PayPal, and the owner can see that order and deliver the song they created.

## Requirements

### Validated

- ✓ Visitors can browse the marketing site and play example songs — existing
- ✓ A person can create an account, sign in, sign out, reset a password, and sign in with Google — existing
- ✓ A signed-in person can see their name and email and update their name on My Account — existing
- ✓ The site offers three one-time packages: Essential $49, Signature $89, and Concierge $149 — existing
- ✓ A visitor can fill in the song story form in the browser — existing

### Active

- [ ] A signed-in customer can start Create a New Song, complete the existing story form, and have that story saved with the order
- [ ] A customer can choose Essential ($49), Signature ($89), or Concierge ($149) and pay that price once through PayPal
- [ ] The site records the order only after PayPal confirms the payment, and the confirmation page appears only after that payment
- [ ] My Orders lists only that customer's real paid songs: who the song is for, the package, the price, and that it is paid
- [ ] My Orders is empty when the customer has not paid for a song, with the sample songs removed
- [ ] My Account keeps name, email, and song notes, and does not show a plan
- [ ] The owner can open an admin page and see every paid order, including the story the customer wrote
- [ ] The owner can upload the finished song file onto an order
- [ ] After that upload, the customer can play and download the song from My Orders
- [ ] Until the file is uploaded, the order stays paid and waiting

### Out of Scope

- Showing the current package on My Account — the customer sees each paid song on My Orders instead
- Subscriptions or any charge that repeats on a schedule — each package is paid once, for one song
- Changing the three package prices or what each package includes — this work uses the prices already on the site
- Card checkout, Apple Pay, and Google Pay — those controls stay as they are; PayPal is the way to pay
- Gift cards, referral discounts, and affiliate payouts — they are separate demos and must not change the PayPal amount
- Automatic songwriting or production — the owner creates each song manually
- Revisions, remakes, and a public finished-song player beyond My Orders play and download — not part of this payment and delivery path

## Context

The app is a Next.js site with Supabase accounts. Marketing and checkout screens are mostly injected HTML. The song story, chosen package, and checkout details currently live in the browser (`localStorage`), not in the database.

PayPal is a label on the payment form. Submitting it shows a toast that no payment was processed, then opens a static confirmation page with a fake order number. Anyone can open that confirmation page. Prices are duplicated in the browser, so a PayPal charge must be computed on the server from the package key.

`public.purchases` exists and is unused. It expects a catalog `song_slug` and a required `user_id`. It has no package, amount, PayPal id, story, or file. The private `purchased-songs` storage bucket is defined and has no upload or playback route. `src/data/mock-orders.ts` is unused. My Orders (`/dashboard`) renders fixed sample songs such as "Our First Year" for every signed-in user. Dashboard logout in the sidebar does not sign the user out.

The owner is the only admin. Customers must be signed in so each order belongs to an account and can appear on My Orders.

Codebase map: `.planning/codebase/`.

## Constraints

- **Payments**: PayPal only — the owner chose PayPal as the payment integration
- **Catalog**: Essential $49, Signature $89, Concierge $149, charged once in USD — these are the packages already on the site
- **Stack**: Next.js App Router, React, Supabase Auth, Postgres, and Storage — the accounts and database already run there
- **Price authority**: The server picks the amount from the package key — the browser total can be edited and must not be what PayPal charges
- **Access**: Customers sign in before paying; the admin page is only for the owner — My Orders and the upload screen need a known person
- **Delivery**: The owner uploads one finished song per paid order — songs are created manually for now

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PayPal is the payment provider | Owner chose PayPal for this integration | — Pending |
| Sell the three existing one-time packages at $49, $89, and $149 | Those prices are already what the site offers | — Pending |
| Each payment is one song, and My Orders lists every paid song | A later purchase must not replace the earlier one | — Pending |
| Do not show a plan on My Account | The owner said the account page does not need to show it | — Pending |
| Confirmation appears only after PayPal confirms payment | The current confirmation page tells every visitor they paid | — Pending |
| Owner fulfills by uploading a file from an admin page | Songs are created manually for now | — Pending |
| Customer plays and downloads that file from My Orders | The upload has to reach the person who paid | — Pending |
| Admin is the site owner only | The owner asked for a place where they can see orders and upload | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-25 after initialization*
