# Roadmap: Oncesung

## Overview

Accounts, marketing pages, and the song story form already exist. This roadmap adds the paid path on that site: a signed-in customer submits the existing story and pays once with PayPal for Essential ($49), Signature ($89), or Concierge ($149); My Orders then lists only that customer's real paid songs; the owner uploads the finished song from an admin page so that customer can play and download it.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Pay for a Song** - Signed-in customer submits their story and pays once with PayPal; confirmation appears only after payment
- [ ] **Phase 2: Real Orders** - My Orders lists only that customer's paid songs, and My Account does not show a plan
- [ ] **Phase 3: Deliver the Song** - Owner uploads the finished song so that customer can play and download it

## Phase Details

### Phase 1: Pay for a Song
**Goal**: A signed-in customer can submit their story, pay once with PayPal for the package they chose, and see confirmation only after PayPal confirms that payment
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: SONG-01, SONG-02, SONG-03, PAY-01, PAY-02, PAY-03, PAY-04, PAY-05
**Success Criteria** (what must be TRUE):
  1. A signed-in customer can start Create a New Song and submit the story form already on the site
  2. A customer who is not signed in is sent to sign in before they can pay
  3. A signed-in customer can pay once with PayPal for Essential ($49), Signature ($89), or Concierge ($149), and PayPal charges the price stored on the server for that package
  4. The customer sees the confirmation page only after PayPal confirms the payment, and the story they submitted is saved with that order
  5. A visitor who opens the confirmation page without a confirmed payment does not see a successful order
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [ ] 01-01: Signed-in story submit, with guests sent to sign in before payment
- [ ] 01-02: One PayPal charge at the server package price, with the order and story stored only after PayPal confirms
- [ ] 01-03: Confirmation page only for that confirmed payment

### Phase 2: Real Orders
**Goal**: A customer sees only the songs they have paid for on My Orders, and My Account does not show a package or plan
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: ORD-01, ORD-02, ORD-03, ORD-04, ORD-05
**Success Criteria** (what must be TRUE):
  1. My Orders lists every song that customer has paid for, and a later purchase does not replace an earlier one
  2. Each order shows who the song is for, the package name, the price, and that it is paid
  3. A customer with no paid songs sees an empty My Orders list, and the sample songs are gone
  4. My Account shows the customer's name, email, and song notes, and does not show a package or plan
  5. Before a song file is uploaded, My Orders shows that order as paid and waiting
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [ ] 02-01: My Orders lists that customer's real paid songs, including the empty list and the paid-and-waiting state
- [ ] 02-02: My Account keeps name, email, and song notes, with no package or plan

### Phase 3: Deliver the Song
**Goal**: The owner can upload the finished song for a paid order, and that customer can play and download it from My Orders
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: ADM-01, ADM-02, ADM-03, DLV-01, DLV-02, DLV-03
**Success Criteria** (what must be TRUE):
  1. Only the owner can open the admin orders page
  2. The owner can see every paid order and the story the customer wrote
  3. The owner can upload the finished song file onto one order
  4. After that upload, the customer who paid can play the song and download it from My Orders
  5. A customer cannot play or download a song from another customer's order
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [ ] 03-01: Owner-only admin page listing every paid order and its story, with upload of the finished song onto one order
- [ ] 03-02: That customer plays and downloads the file from My Orders, and other customers cannot

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Pay for a Song | 0/3 | Not started | - |
| 2. Real Orders | 0/2 | Not started | - |
| 3. Deliver the Song | 0/2 | Not started | - |
