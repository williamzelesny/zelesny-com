---
date: 2026-09-10
topic: ugift-529-contribution-page
---

# Ugift 529 Contribution Page

## Summary

An unlisted page on www.zelesny.com that lists each child by first name alongside their NJBEST Ugift code, with a short walkthrough of how a contribution actually works and a plain statement that the code can only add money. The codes and names are supplied at build time and never enter the public repository.

---

## Problem Frame

Relatives who want to put money into the children's 529 plans have no way to do it without going through William first. They reach out and ask how to contribute; he logs into the NJBEST site, retrieves the Ugift code for the relevant child, and relays it. Every contribution is gated on him being available and willing to do a lookup.

The cost is not primarily the lookup — it is that the whole arrangement is reactive. Giving only happens when someone thinks to ask, which means birthdays and holidays pass without the option ever being on the table. There is nothing William can hand out ahead of time.

The people doing the giving are in-laws, grandparents, and aunts and uncles. They are phone-first and not technical, and several of them are being asked to enter bank details on a site they have never heard of, on behalf of an account they cannot see. The reassurance William currently provides by phone is a real part of what makes a contribution happen, and any page that drops it has only moved the friction rather than removed it.

---

## Actors

- A1. Account owner (William): holds the NJBEST accounts, retrieves Ugift codes, and shares the page's URL.
- A2. Giver: an older relative who wants to contribute, arrives via a link or a spoken URL, and needs enough context to trust the process before entering payment details.

---

## Key Flows

- F1. Relative contributes via the shared page
  - **Trigger:** A birthday or holiday approaches, or a relative asks how to give.
  - **Actors:** A1, A2
  - **Steps:** A1 sends the link, or says the URL aloud over the phone → A2 opens it on a phone → A2 finds the right child by first name → A2 reads what the code is and what it can and cannot do → A2 follows the link to Ugift → A2 enters the code and completes the contribution.
  - **Outcome:** A contribution is made without A1 logging into NJBEST or looking anything up.
  - **Escape path:** If A2 gets stuck at the Ugift site, they contact A1 — the same position as today, no worse.
  - **Covered by:** R1, R2, R3, R4, R6

- F2. Account owner updates a code or adds a child
  - **Trigger:** A code is regenerated, or a new child is added.
  - **Actors:** A1
  - **Steps:** A1 updates the gift data where it is held → the site is rebuilt and redeployed → the page reflects the change.
  - **Outcome:** The page is current without editing page source or committing a code.
  - **Covered by:** R1, R8, R9

---

## Requirements

**Page content**

- R1. The page shows one entry per child, identified by first name, with that child's Ugift code. It renders from supplied data rather than assuming a fixed number of children.
- R2. The page includes a short walkthrough of how a contribution works, written for a non-technical reader on a phone: where to go, what to enter, which payment methods are available, any minimum contribution amount, and what the giver gets back afterward.
- R3. The page states plainly that the code permits contributions only — the holder cannot view the balance, withdraw funds, or otherwise access the account.
- R4. The page links directly to the Ugift site so a giver can move from reading to giving in one tap.
- R5. Typography, tone, and layout match the rest of the site: text-first, minimal, no decoration.

**Discoverability**

- R6. The page lives at `/gift` — short enough to say out loud over the phone and type from memory.
- R7. The page is not linked from any other page on the site, is excluded from search-engine indexing, and does not appear in a sitemap.

**Data handling**

- R8. Children's first names and Ugift codes appear in the rendered page but never in the Git repository or its history.
- R9. When the build runs without gift data available, it fails loudly rather than publishing a page with blank or placeholder codes.

---

## Acceptance Examples

- AE1. **Covers R9.** Given no gift data is supplied to the build, when the site is built, the build fails with an explicit error naming what is missing — it does not emit a page with empty code fields.
- AE2. **Covers R7.** Given the site is deployed, when a crawler fetches it, `/gift` is reachable by direct URL, carries an explicit instruction not to index, and appears in no sitemap or on-site link.
- AE3. **Covers R8.** Given a code is live on the published page, when someone searches the public repository including its full history, neither the code nor any child's first name appears.
- AE4. **Covers R1, R2, R3.** Given a grandparent opens the page for the first time on a phone, when they read it top to bottom, they can identify which code belongs to which child, know that the code cannot be used to take money out, and know whether they can pay by check — without contacting William.

---

## Success Criteria

- The next relative who asks how to contribute receives a link rather than triggering a NJBEST login session.
- A relative who has never heard of Ugift completes a contribution from the page alone, without calling to ask whether it is safe to enter bank details.
- A contribution arrives that nobody had to ask for first — the page was shared ahead of an occasion rather than in response to a question.
- Planning inherits the page's content, naming, discoverability, and data-handling decisions already made, and only has to decide how to wire them.

---

## Scope Boundaries

- No tax guidance of any kind. The NJ 529 deduction is deliberately omitted — it is the only content that could become wrong without anyone noticing.
- No QR codes or printable cards. Revisit only if a link actually gets lost between occasions.
- No deep links that pre-fill the Ugift form. Unverified whether the platform supports it, and it saves one paste.
- No password, passphrase, or login gate.
- No separate subdomain. The page lives on the existing site.
- The repository stays public.
- No backend, form, analytics, or client-side JS. The page does not know who visited or who gave.
- No thank-you, notification, or contribution-tracking flow. Ugift already sends the giver a confirmation page and email, and shows the giver's name against the gift amount in the account owner's NJBEST view.

---

## Key Decisions

- **Guided page over a bare code list.** The friction being removed is not the lookup — it is the reassurance conversation. The audience is older relatives being asked to hand bank details to an unfamiliar site, and a page that hands them a code and a link without context leaves that conversation with William.
- **Unlisted and no-indexed rather than gated.** A gate on a static site is either client-side theater (the codes ship in the HTML regardless) or requires a backend the project deliberately avoids. Because the code permits contributions only, what is actually being managed is the children's names, not money.
- **Codes and names injected at build time from CI secrets, not committed.** The repository is public. Committing them would place both in GitHub code search and permanently in git history, defeating the unlisted page entirely. Rejected alternatives: committing them in plain text, and making the repository private.
- **First names rather than initials or relationship labels.** A giver needs to be certain they picked the right child before entering payment details, and the codes themselves are opaque. Anonymizing the page shifts that risk onto the giver for very little privacy gain, given the page is unlisted and the codes never enter the public repository.
- **`/gift` rather than a longer path.** Solves most of the lost-link problem for free: a URL short enough to say over the phone survives a text thread that a shared link does not.

---

## Dependencies / Assumptions

- **Verified** (Ugift FAQ, ugift529.com): a Ugift code is a contribution mechanism only — the FAQ describes it solely as a way to send money and documents no balance visibility, withdrawal, or account-access capability for a code holder. R3 stands as written, and the exposure trade-off in Key Decisions holds.
- **Verified** (Ugift FAQ): a code stays usable for the same beneficiary indefinitely, provided the account remains open and the account owner continues to allow Ugift contributions. F2's rebuild-and-redeploy update path is therefore a rare event, not routine maintenance.
- **Verified** (Ugift FAQ): the giver receives a confirmation page and a confirmation email, and the account owner sees the giver's name next to the gift amount in their account. This is why no thank-you or tracking flow is needed on our side.
- **Verified** (Ugift FAQ): the account owner can switch Ugift contributions off for an account. If that ever happens the published page sends givers to a dead end — worth remembering, not worth building for.
- **Partly verified** (Ugift FAQ): contribution by mailed check is available. The FAQ does not name the online payment method, and minimums are plan-specific — "as little as $15 for some plans." NJBEST's own minimum and online payment method still need looking up before R2's copy is written.
- **Unverified:** that the Ugift site confirms the beneficiary's name back to the giver after a code is entered. The FAQ does not address it. This does not change the first-names decision — the giver needs certainty on our page either way — but it removes a supporting argument for it.
- **Verified:** `williamzelesny/zelesny-com` is a public GitHub repository, and CI builds and pushes an image to GHCR on every push to `main`.
- **Correction to the exposure model above** (surfaced during planning): because the page's source file and all of its copy are committed to a public repository, the **path `/gift` and the page's entire content are publicly discoverable** through GitHub code search, no-index instruction or not. "Unlisted" therefore protects the *pairing of a name with a code* — from search indexing, git history, the image, and the build cache — not the URL. The decision to use an unlisted page rather than a gate still stands on its original reasoning (the code is contribution-only, and a gate on a static site is theatre or a backend), but it should be made knowing the URL is not secret.
- **Verified** (GitHub documentation): GitHub Actions caches on a public repository are readable by anyone who can open a pull request, with no visibility setting available. The existing workflow's layer caching would have exposed the rendered page; the plan removes it.
- **Verified:** the project has no sitemap integration, no `robots.txt`, and no `site` value configured. R7 is greenfield rather than a modification.
- **Verified:** `.env` and `.env.production` are already gitignored, so local development can hold gift data without risk of committing it.
- The published container image contains the rendered codes. If the GHCR package is publicly readable, the codes are retrievable from it regardless of build-time injection. Resolving that is a change in the homelab cluster repository, not this one.

---

## Outstanding Questions

### Resolve Before Planning

None. The Ugift semantics that blocked planning were confirmed against the Ugift FAQ — see Dependencies / Assumptions.

### Before Publishing

- [Affects R2][User decision] Look up NJBEST's minimum Ugift contribution and its online payment method, so the walkthrough is accurate rather than plausible.
- [Affects R1][User decision] Supply the children's first names and Ugift codes out of band — not in this repository and not in this document.
- [Affects R8][User decision] Check whether the GHCR package for this repository is publicly readable. If it is, the codes are pullable from the published image regardless of build-time injection, and the fix belongs in the homelab cluster repository.

### Deferred to Planning

- [Affects R8, R9][Technical] How gift data reaches the build, and how local development and preview work without production secrets.
- [Affects R9][Technical] What "fails loudly" means concretely at build time, and whether it should also fail when data is present but malformed.
- [Affects R7][Technical] How to express no-index and sitemap exclusion given the project currently configures neither.
- [Affects R5][Needs research] Whether a shared nav or page header is now warranted with a third page, or whether `/gift` should stay deliberately standalone given it is unlisted.
