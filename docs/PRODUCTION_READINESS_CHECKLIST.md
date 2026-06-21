# FactoryBid OS — Production Readiness Checklist

Last updated: 2026-06-21 (Europe/Helsinki). Owner: autonomous build loop.

This checklist tracks the gap between the current `main` and a production-grade local-first
factory tarjouslaskenta system, as defined by the mission Definition of Done (DoD §1–§10).
It is evidence-based: each item cites the code that proves its status, and is updated as
slices merge. Status legend:

- ✅ **complete** — implemented, tested, and usable in the operator product.
- 🟡 **partial** — domain logic exists/tested but not fully usable, polished, or wired in the UI.
- 🔴 **broken/missing** — required capability absent or non-functional (e.g. dead control).

## Baseline (verified 2026-06-21)

All gates green on `origin/main`:

- ✅ `bun run lint`
- ✅ `bun run test` — 60 files, 290 tests
- ✅ `bun run build`
- ✅ `bun run test:e2e` — 1 comprehensive smoke spec (kill any stale `:5173` dev server first; Playwright `reuseExistingServer` will otherwise attach to it)
- ✅ `bun run convex:codegen` — exit 0, no generated-file drift

Architecture: ~14k LOC of complete, unit-tested domain logic (`src/domain/**`) wired into a
single 3,610-line `src/App.tsx` that runs as a **static-fixture demo** (3 hardcoded CNC RFQs).
Gaps are concentrated in operator-UI interactivity, breadth, and polish — not in the math.

Audit method: 11 area agents + 39 adversarial verifiers (61 agents total) read the actual code
and produced 72 findings; 50 high/medium gaps were adversarially confirmed (0 overstated).

---

## §1 End-to-end RFQ intake

- ✅ **Manual RFQ creation in the UI** — `workItems` is React state; a "New RFQ" button opens an accessible modal that captures customer/contact/subject/part/process/material/quantity/priority/due/setup/cycle/tolerance/finish/notes and builds a valid quote via `src/domain/rfq/manualRfq.ts`; the new RFQ surfaces in the queue and all downstream panels. (Slice C)
- 🟡 **Gmail RFQ intake (fixture + fallback)** — deterministic adapter chain exists (`src/domain/integrations/gmailRfq.ts`), but UI hardwires the primary provider to fail and ingested data only updates a connector snapshot, never materializes an RFQ. → **Slice C2/G**
- 🟡 **Editable, provenance-aware fields** — new RFQs are fully operator-entered (Slice C); existing RFQs now allow customer/contact/subject/due/tolerance/finish/notes edits (Slice C2), but material/process editing and confidence provenance badges are still pending. → **Slice C2/E**
- 🟡 **Readiness states for invalid/incomplete RFQs** — `evaluateRfqIntakeReadiness` + panel exist; a manually created RFQ with no attachments now exercises a non-"Ready" warning path, but driving fixtures into blocked from the UI still pending. → **Slice C2**

## §2 Full quote workspace

- ✅ Operator can select RFQs, see workload/capacity/material/outside-services/approval/release panels (`App.tsx` triage/costing/offer views).
- 🟡 **Edit costing assumptions** — quantity/setup/cycle/rush plus material cost, machine hourly rate, and margin are editable; deeper material/process/rate-card presets remain pending. → **Slice D/E**
- 🔴 **Approval/release gates operable** — decisions computed but no Approve/Release buttons. → **Slice A/D**
- 🟡 **Persistence** — localStorage now restores operator-owned workspace state (RFQs, selected view, edits, actions/status, offer lifecycle events) across reloads; Convex-backed app reads remain optional/future. → **Slice H (optional Convex)**
- 🟡 **Loading/empty/stale/error polish** — no skeletons, empty-queue, or error boundary. → **Slice D**

## §3 Deterministic calculators

- ✅ **CNC** — complete realistic quoting + edge-case tests + fixtures (`src/domain/quoting/cnc.ts`).
- ✅ All 5 engines (cnc/sheetMetal/plastics/wireEdm/fabrication) are domain-complete, deterministic, explainable, unit-tested, with a registry dispatcher (`registry.ts calculateQuote`).
- 🔴 **Sheet metal / plastics / wire-EDM / fabrication reachable from UI** — workspace calls `calculateCncQuote` only; the other 4 run once on a fixture for a read-only capability sample. No process selector, no editable inputs, no offer. → **Slice E**
- 🟡 **Registry used as the app's quoting path** — dispatcher exists/tested but app bypasses it. → **Slice E**

## §4 CAD-like part review

- ✅ Preview states (ready/metadata-only/needs-review/unsupported), metadata, manufacturability flags computed and shown; model never blank (`partPreview.ts`, `cadMetadata.ts`).
- 🔴 **Operator override UI** — no way to correct dimensions/material/process, change primary attachment, or clear flags. → **Slice F**
- 🔴 **Thumbnails / real previews** — every part shows the same generic cuboid icon; no `<img>`/canvas. → **Slice F**
- 🟡 **Real STEP/DXF/PDF adapter wired** — adapter interface exists; no real parser, app uses fixtures. → **Slice F (deferred; keep behind adapter)**

## §5 Offer builder and export

- ✅ Customer-ready offer content (prices, lead times, assumptions, validity, alternates, revision summary) — `offerDocument.ts`, `offerExportPackage.ts`.
- ✅ **Plain-text export exercisable** — read-only offer text remains inspectable and can be copied or downloaded as `.txt` from `OfferView`.
- ✅ **PDF export/rendering verified** — `offerPdf.ts` renders deterministic `pdf-lib` bytes with fixture coverage and smoke-tested download flow.
- ✅ **Operator can copy/download** — `OfferView` exposes Copy, Download `.txt`, and Download PDF buttons with aria-live feedback.
- ✅ **Offer lifecycle actions/history** — `OfferLifecyclePanel` wires deterministic sent/accept/decline/follow-up controls to `buildOfferLifecycleTimeline` with smoke coverage.
- 🟡 **Offer export/revision history is durable** — export feedback is session-local and revision history is still draft-generated. → **Slice A3**
- 🟡 **Offer is an editable artifact** — validity dates/terms/notes are computed constants. → **Slice A3**

## §6 Gmail and Calendar workflow

- ✅ Gmail reply ingestion → deterministic lifecycle signals (`gmailOfferReply.ts`, OfferReplyPanel).
- ✅ Connector failures visible but nonfatal.
- 🔴 **Connector drill-down (linked RFQ/offer/calendar details)** — only aggregate counts surfaced. → **Slice G**
- 🔴 **Calendar follow-up + RFQ due-date planning surfaced** — computed event drafts never shown. → **Slice G**
- 🟡 **Healthy connector/calendar path demonstrable** — demo forces failure so "linked/scheduled" never shown. → **Slice G**

## §7 Provider/AI layer

- ✅ Mock/local/provider adapters explicit; outputs audited with prompt/output/review/failure metadata; AI never required for core calc (`providers/*`).
- 🔴 **Provider run history filterable in UI** — `providerRunHistory.ts` summary/filters exist but `ProviderRunReviewPanel` renders an unfiltered list. (PR #111 surfaces this but is unmerged.) → **Slice G**
- 🟡 **Provider runs read from Convex** — query APIs exist; UI reads static fixtures. → **Slice H (optional)**

## §8 Convex / data production readiness

- ✅ Tenant-safe queries/mutations for main flows (`convex/workflow.ts`); authz/tenant guards tested (`convex/authz.test.ts`, `workflowRules.test.ts`).
- ✅ Indexes for RFQ queue, customer history, quote status, offer state, provider runs, connector links, workload.
- ✅ Local dev works with `convex:codegen` / `convex:once`; no secrets committed.
- 🟡 **Convex actually called by the app** — full API is runtime-dead; app uses local fallback only. Acceptable per DoD local-fallback clause, but a `ConvexReactClient`/`ConvexProvider` wiring would make it real when configured. → **Slice H (optional, guarded so local-first e2e stays green)**

## §9 UI production hardening

- ✅ Dense operator workspace (not a landing page); aria labels present; no overlapping text observed.
- ✅ **No dead controls** — queue filters (Due soon/Rush/CNC) are real `aria-pressed` toggles that narrow the ranked queue with an empty state; "Open attachments" is a real disclosure of the selected RFQ's files. (Slice B)
- ✅ **Desktop + mobile responsive** — `src/App.css` has `@media` breakpoints at 1180px/820px; verified usable at 375px (no horizontal overflow, no overlapping text).
- 🟡 **Loading/empty/error states + error boundary** — queue has an empty state; broader skeletons/error boundary still pending. → **Slice D**
- 🟡 **Offer/release pipeline actionable** — copy/download shipped (Slice A); lifecycle controls shipped (Slice A2); durable send/release execution still pending. → **Slice A3/D**

## §10 Quality gates & test coverage

- ✅ CI covers lint / unit / e2e / build (`.github/workflows/ci.yml`).
- 🟡 **Convex codegen/backend typecheck is a CI gate** — deferred: needs either committed `convex/_generated` or a `CONVEX_DEPLOY_KEY` secret (cloud auth), neither available without a policy change. Codegen works locally (`bun run convex:codegen`, exit 0, no drift). Tracked as a secret-gated follow-up.
- ✅ **Component/unit coverage for `App.tsx`** — `src/App.test.tsx` renders the workspace in jsdom and covers the quote recompute, queue filtering, and view switching; test setup now auto-cleans React trees between tests. (Slice D)
- 🟡 **e2e breadth** — only 1 spec; manual creation, multi-process, mobile viewport, error states untested. → grows with each slice

## Cross-cutting correctness

- 🔴 **Real operator identity** — every audit record attributed to hardcoded "Sari". → **Slice I**
- 🔴 **Injected clock** — mixed `demoToday`/`demoNow` constants vs real wall-clock in actions; readiness windows frozen. → **Slice I**
- ✅ No obvious correctness bug found in core quote domain logic.

---

## Prioritized slice plan (each = one reviewed PR; all gates kept green; UI PRs include Playwright QA)

| Slice | Title | DoD | Status |
|------|-------|-----|--------|
| **A** | Offer export: copy + download `.txt` + real PDF render | §5, §9 | ✅ |
| **A2** | Offer lifecycle actions/history controls | §5 | ✅ |
| **A3** | Editable offer header + durable export/revision history | §5, §2 | ☐ |
| **B** | UI hardening: functional queue filters + Open-attachments disclosure (dead controls removed); mobile responsive verified | §9 | ✅ |
| **C** | Manual RFQ creation (stateful queue + accessible New-RFQ dialog → deterministic quote) | §1, §2 | ✅ |
| **C2** | Edit existing RFQ fields (customer/material/process/due/tolerance/notes) + provenance badges; drive readiness to blocked | §1, §2 | 🟡 |
| **D** | Costing edit depth (material/rate/margin) + loading/empty states + App component tests | §2, §10 | 🟡 |
| **E** | Multi-process quoting via registry: process selector, non-CNC demo items, route through `calculateQuote` | §3 | ☐ |
| **F** | CAD review: operator overrides + per-type thumbnails/previews | §4 | ☐ |
| **G** | Connector/calendar drill-downs + provider run history filters (supersedes PR #111) | §6, §7 | ☐ |
| **I** | Real operator identity + single injected clock | cross-cutting | ☐ |
| **H** | (Optional) Wire `ConvexReactClient` so Convex is used when configured, local fallback otherwise | §8, §7 | ☐ |

Slices are ordered by value × independence × risk. A and B are self-contained and unlock the
clearest DoD wins; C/E are deeper structural changes; H is optional because the mission blesses
a documented local fallback. The checklist table is updated as each PR merges.
