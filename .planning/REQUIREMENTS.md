# Requirements: Oncesung

**Defined:** 2026-10-25
**Core Value:** A customer can pay for one song package with PayPal, and the owner can see that order and deliver the song they created.

## v1 Requirements

### Song

- [ ] **SONG-01**: A signed-in customer can start Create a New Song and submit the story form that is already on the site
- [ ] **SONG-02**: The site saves that story on the server with the order the customer pays for
- [ ] **SONG-03**: A customer who is not signed in is sent to sign in before they can pay

### Payment

- [ ] **PAY-01**: A signed-in customer can pay once with PayPal for Essential ($49), Signature ($89), or Concierge ($149)
- [ ] **PAY-02**: PayPal charges the price stored on the server for the chosen package
- [ ] **PAY-03**: The site stores the order only after PayPal confirms the payment
- [ ] **PAY-04**: The customer sees the confirmation page only after PayPal confirms that payment
- [ ] **PAY-05**: A visitor who opens the confirmation page without a confirmed payment does not see a successful order

### Orders

- [ ] **ORD-01**: My Orders lists every song that customer has paid for
- [ ] **ORD-02**: Each order shows who the song is for, the package name, the price, and that it is paid
- [ ] **ORD-03**: My Orders is an empty list when the customer has no paid songs, and the sample songs are gone
- [ ] **ORD-04**: My Account shows name, email, and song notes, and does not show a package or plan
- [ ] **ORD-05**: Before a song file is uploaded, My Orders shows that order as paid and waiting

### Admin

- [ ] **ADM-01**: Only the owner can open the admin orders page
- [ ] **ADM-02**: The owner can see every paid order and the story the customer wrote
- [ ] **ADM-03**: The owner can upload the finished song file onto one order

### Delivery

- [ ] **DLV-01**: After the owner uploads the file, that customer can play it from My Orders
- [ ] **DLV-02**: After the owner uploads the file, that customer can download it from My Orders
- [ ] **DLV-03**: A customer cannot play or download a song from another customer's order

## v2 Requirements

None. Items set aside for this version are listed under Out of Scope.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Package or plan on My Account | The customer sees each paid song on My Orders |
| Subscriptions or repeated charges | Each package is paid once, for one song |
| Changing package prices or included features | This version uses Essential $49, Signature $89, and Concierge $149 as they are |
| Card checkout, Apple Pay, and Google Pay | Those controls stay as they are; PayPal is how the customer pays |
| Gift cards, referral discounts, and affiliate payouts | They are separate demos and must not change the PayPal amount |
| Automatic songwriting or production | The owner creates each song manually |
| Revisions, remakes, and a finished-song player outside My Orders | Play and download happen from My Orders after the owner uploads the file |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19

---
*Requirements defined: 2026-10-25*
*Last updated: 2026-10-25 after initial definition*
