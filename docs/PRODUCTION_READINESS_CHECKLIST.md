# FactoryBid OS — Production Readiness Checklist

Last updated: 2026-07-12 (Europe/Helsinki). Owner: autonomous build loop.

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
- 🟡 **Gmail RFQ intake (fixture + fallback)** — deterministic adapter chain exists (`src/domain/integrations/gmailRfq.ts`), RFQ sync demonstrates a healthy mock Gmail/calendar link path, and new Gmail RFQs materialize as duplicate-safe `source: "import"` queue items for operator review. Live Gmail remains behind provider boundaries. → **Slice C2/G**
- ✅ **Editable, provenance-aware fields** — new RFQs are fully operator-entered (Slice C); existing CNC RFQs now allow customer/contact/subject/material/process/due/tolerance/finish/notes edits, show per-field extraction confidence/source badges, and update queue tags plus downstream plans deterministically. (Slice C2)
- ✅ **Readiness states for invalid/incomplete RFQs** — `evaluateRfqIntakeReadiness` + panel exist; manual RFQs exercise warning paths, and existing RFQs can be driven into blocked states from the UI through missing customer or past due-date edits. (Slice C2)

## §2 Full quote workspace

- ✅ Operator can select RFQs, see workload/capacity/material/outside-services/approval/release panels (`App.tsx` triage/costing/offer views).
- 🟡 **Edit costing assumptions** — quantity/setup/cycle/rush plus material cost, machine hourly rate, and margin are editable; deeper material/process/rate-card presets remain pending. → **Slice D/E**
- 🟡 **Approval/release gates operable** — manager release review and local release execution controls now persist audited runs and feed the deterministic release planner; real connector send/commit remains behind provider boundaries. → **Slice D/G**
- 🟡 **Persistence** — localStorage now restores operator-owned workspace state (RFQs, selected view, edits, actions/status, offer lifecycle events) across reloads; Convex-backed app reads remain optional/future. → **Slice H (optional Convex)**
- 🟡 **Loading/empty/stale/error polish** — queue empty states and a tested workspace error boundary exist; broader skeleton/loading and stale-data states remain pending. → **Slice D**

## §3 Deterministic calculators

- ✅ **CNC** — complete realistic quoting + edge-case tests + fixtures (`src/domain/quoting/cnc.ts`).
- ✅ All 5 engines (cnc/sheetMetal/plastics/wireEdm/fabrication) are domain-complete, deterministic, explainable, unit-tested, with a registry dispatcher (`registry.ts calculateQuote`).
- 🟡 **Sheet metal / plastics / wire-EDM / fabrication reachable from UI** — workspace CNC pricing now routes through the shared `calculateQuote` registry, and the other 4 engines surface guarded registry demos with a process selector, best-price/fastest-lead/draft-coverage badges, selected-vs-best comparison summary, quote breakdowns, top assumptions, review flags, an operator checklist, input-readiness groups, planned field descriptors, fixture draft values, explicit quote-path promotion blockers, domain adapter readiness, preview-only edit controls, offer-candidate handoff summary, deterministic promotion-plan contract/panel, local promotion-plan persistence records/snapshot, deterministic promotion action summaries, ready-only promotion draft payloads, canonical command-package descriptors in the review surface/domain layer and preview UI, dry-run/commit execution audit records surfaced in the UI, local execution persistence snapshots, execution history UI, deterministic outcome drafts, outcome draft UI, reviewed-outcome commit adapter plans, commit-plan UI, local outcome commit persistence, outcome commit history UI, operator-visible promoted quote read models, operator-visible deterministic promoted quote application plans, operator-visible local application-plan persistence snapshots, operator-visible deterministic application execution audit records, local application execution persistence snapshots, application execution history UI, application execution outcome drafts, application execution outcome draft UI, application outcome commit plans, application outcome commit-plan UI, local application outcome commit persistence, application outcome commit history UI, operator-visible deterministic application outcome commit read models, deterministic application mutation package descriptors, operator-visible mutation package review surfaces, deterministic mutation package execution audits, local mutation execution persistence snapshots, operator-visible mutation execution history, deterministic mutation execution outcome drafts, operator-visible mutation execution outcome draft review UI, deterministic mutation outcome commit plans/runs, operator-visible mutation outcome commit-plan UI, local mutation outcome commit persistence snapshots, operator-visible mutation outcome commit history, deterministic mutation outcome commit read models, operator-visible mutation outcome commit read-model surfaces, deterministic mutation apply-plan descriptors, operator-visible mutation apply-plan surfaces, local mutation apply-plan persistence snapshots, operator-visible mutation apply-plan history, deterministic mutation apply execution audit records, operator-visible mutation apply execution audits, local mutation apply execution persistence snapshots, and operator-visible mutation apply execution history for future package application. Non-CNC offer paths still need persisted quote promotion before customer release. → **Slice E**
- 🟡 **Registry used as the app's quoting path** — dispatcher exists/tested and the CNC workspace path now uses it; non-CNC UI flows still need typed inputs and offer wiring. → **Slice E**

## §4 CAD-like part review

- ✅ Preview states (ready/metadata-only/needs-review/unsupported), metadata, manufacturability flags computed and shown; model never blank (`partPreview.ts`, `cadMetadata.ts`).
- ✅ **Operator override UI** — manufacturability flags can be acknowledged/reopened with a persistent operator note, primary preview attachment selection is durable, and dimension/material/process correction notes can be saved/restored/cleared; reviewed corrections surface as explicit quote assumptions without changing deterministic totals or raw RFQ inputs, this branch persists CAD geometry review action context alongside saved operator corrections, and compact override event trails capture saved corrections, acknowledged flags, and reopened review state for reload-safe audit history. (Slice F)
- 🟡 **Thumbnails / real previews** — attachment-specific preview and thumbnail labels now distinguish CAD models, drawings, photos, spreadsheets, and metadata-only cards; safe browser-native image attachments render as real `<img>` previews, safe PDF drawing attachments render as browser document previews, successful STEP/DXF metadata adapter results now mark preview descriptors ready, render compact viewport metadata cards, expose compact metadata thumbnail tiles with boundary-aware filename matching, carry metadata-derived geometry preview descriptors on ready STEP/DXF attachment outputs, render those geometry descriptors in viewport/thumbnail surfaces, compute deterministic ready/needs-review/blocked geometry review summaries, surface those summaries in the viewport and geometry thumbnails, and surface deterministic operator action hints for geometry review warnings/blockers while parser failures still use deterministic placeholders. → **Slice F**
- 🟡 **Real STEP/DXF/PDF adapter wired** — adapter interfaces exist for metadata and metadata-derived geometry descriptors; no real parser, app uses fixtures. → **Slice F (deferred; keep behind adapter)**

## §5 Offer builder and export

- ✅ Customer-ready offer content (prices, lead times, assumptions, validity, alternates, revision summary) — `offerDocument.ts`, `offerExportPackage.ts`.
- ✅ **Plain-text export exercisable** — read-only offer text remains inspectable and can be copied or downloaded as `.txt` from `OfferView`.
- ✅ **PDF export/rendering verified** — `offerPdf.ts` renders deterministic `pdf-lib` bytes with fixture coverage and smoke-tested download flow.
- ✅ **Operator can copy/download** — `OfferView` exposes Copy, Download `.txt`, and Download PDF buttons with aria-live feedback.
- ✅ **Offer lifecycle actions/history** — `OfferLifecyclePanel` wires deterministic sent/accept/decline/follow-up controls to `buildOfferLifecycleTimeline` with smoke coverage.
- ✅ **Offer export/revision history is durable** — revision reason and copy/download/PDF export events persist in the local workspace state with deterministic audit rows. (Slice A3)
- ✅ **Offer is an editable artifact** — validity date, customer-facing terms, revision note, and offer notes are editable in the workspace and feed plain-text/PDF-ready exports. (Slice A3)

## §6 Gmail and Calendar workflow

- ✅ Gmail reply ingestion → deterministic lifecycle signals (`gmailOfferReply.ts`, OfferReplyPanel).
- ✅ Connector failures visible but nonfatal.
- ✅ **Connector drill-down (linked RFQ/calendar details)** — integration health exposes linked Gmail/calendar records, provider filters, attention empty states, cross-RFQ history, stale/blocked link recovery actions, and connector activity rows for the selected RFQ.
- 🟡 **Calendar follow-up + RFQ due-date planning surfaced** — offer release follow-up drafts and selected-RFQ quote work/due drafts are visible before connector execution; deterministic mock connector scheduling now shows linked calendar events; overdue/cancelled follow-up status rows now include deterministic reschedule-ready/blocked previews plus provider-safe reschedule command planning and local persistence snapshots; persisted follow-up activity reads now have duplicate-safe write planning plus pending/partial/recorded/review readiness metadata surfaced in the workspace, with deterministic readiness history summarization/local persistence, deterministic readiness read-model boundary, operator-visible read-model status/actions, operator-visible history UI, reload-safe local-state persistence, unique manual follow-up audit keys, restored-action readiness replay, Convex-safe readiness payload contracts, workflow persistence, client adapter, runtime bridge, operator-visible local/Convex sync-source summaries, scoped sync-health fallback visibility, read/write fallback history details, reload-safe sync-health replay, global fallback indicator alignment, restored sync-health retention capping, per-operation latest fallback visibility, per-operation sync-health status labels, sync-health recovery actions, fallback recency state, sync-health operator summaries, sync-health severity labels, Integration health surfacing for warning/critical fallback state, always-visible topbar persistence alerting for stale fallback state, topbar alert drill-down to detailed sync panels, filterable recent fallback events, zero-count fallback filter empty states, hidden retained fallback overflow copy, and copyable sync-health diagnostic summaries. Real connector scheduling remains behind provider boundaries. → **Slice G**
- ✅ **Healthy connector/calendar path demonstrable** — RFQ sync now uses healthy mock Gmail/calendar providers by default, records linked connector rows, and keeps fallback behavior covered in domain tests.

## §7 Provider/AI layer

- ✅ Mock/local/provider adapters explicit; outputs audited with prompt/output/review/failure metadata; AI never required for core calc (`providers/*`).
- ✅ **Provider run history filterable in UI** — `ProviderRunReviewPanel` exposes provider run summary metrics plus all, failed, fallbacks, skipped, succeeded, and warnings filters backed by `providerRunHistory.ts`.
- 🟡 **Provider runs read from Convex** — query APIs, a terminal-run read adapter with local fallback, selected-RFQ optional browser Convex hydration, operator-visible Provider review plus Integration health read-source/fallback health, shared provider-domain copy/state, deterministic read-history summaries, local persistence snapshots, operator diagnostics/export copy, Provider review UI surfaces for reading/copying those diagnostics, Integration health diagnostic status/recovery/export copy, deterministic next-action items, compact recent-read record drill-downs, optional bridge capability health, configured/missing capability details, bridge recovery actions, copyable bridge capability diagnostics with recovery actions, a tested bridge-health domain helper, a tested browser bridge probe adapter, deterministic browser bridge identity-map readiness for RFQ/offer/quote local ID maps, shared guarded ID-map normalization, deterministic public Convex browser runtime URL probing, Integration health runtime readiness copy, a guarded browser bridge install-plan boundary, Integration health install-plan readiness actions, an explicit opt-in installer decision boundary, and Integration health installer opt-in status copy exist. → **Slice H (optional)**

## §8 Convex / data production readiness

- ✅ Tenant-safe queries/mutations for main flows (`convex/workflow.ts`); authz/tenant guards tested (`convex/authz.test.ts`, `workflowRules.test.ts`).
- ✅ Indexes for RFQ queue, customer history, quote status, offer state, provider runs, connector links, workload.
- ✅ Local dev works with `convex:codegen` / `convex:once`; no secrets committed.
- 🟡 **Convex browser bridge path remains optional/unwired** — optional browser bridge capability health, configured/missing capability details, bridge recovery actions, copyable bridge diagnostics with recovery actions, a tested deterministic bridge-health helper, a tested browser bridge probe adapter, RFQ/offer/quote identity-map readiness, shared guarded ID-map normalization before browser bridge reads/writes, deterministic public Convex browser runtime URL probing, Integration health runtime readiness copy, a guarded browser bridge install-plan boundary, Integration health install-plan readiness actions, an explicit opt-in installer decision boundary, and Integration health installer opt-in status copy are now available while local fallback remains the default when the bridge is missing, partial, or not opted in. Live `ConvexReactClient`/`ConvexProvider` calls are still future work behind this boundary. → **Slice H (optional, guarded so local-first e2e stays green)**

## §9 UI production hardening

- ✅ Dense operator workspace (not a landing page); aria labels present; no overlapping text observed.
- ✅ **No dead controls** — queue filters (Due soon/Rush/CNC) are real `aria-pressed` toggles that narrow the ranked queue with an empty state; "Open attachments" is a real disclosure of the selected RFQ's files. (Slice B)
- ✅ **Desktop + mobile responsive** — `src/App.css` has `@media` breakpoints at 1180px/820px; verified usable at 375px (no horizontal overflow, no overlapping text).
- 🟡 **Loading/empty/error states + error boundary** — queue has an empty state and the app entrypoint now wraps the workspace in a tested recovery boundary; broader skeleton/loading states remain pending. → **Slice D**
- 🟡 **Offer/release pipeline actionable** — copy/download shipped (Slice A); lifecycle controls shipped (Slice A2); local release execution controls now record deterministic command outcomes; real connector-backed send remains pending. → **Slice D/G**

## §10 Quality gates & test coverage

- ✅ CI covers lint / unit / e2e / build (`.github/workflows/ci.yml`).
- 🟡 **Convex codegen/backend typecheck is a CI gate** — deferred: needs either committed `convex/_generated` or a `CONVEX_DEPLOY_KEY` secret (cloud auth), neither available without a policy change. Codegen works locally (`bun run convex:codegen`, exit 0, no drift). Tracked as a secret-gated follow-up.
- ✅ **Component/unit coverage for `App.tsx`** — `src/App.test.tsx` renders the workspace in jsdom and covers the quote recompute, queue filtering, and view switching; test setup now auto-cleans React trees between tests. (Slice D)
- 🟡 **e2e breadth** — only 1 spec; manual creation, multi-process, mobile viewport, error states untested. → grows with each slice

## Cross-cutting correctness

- 🟡 **Real operator identity** — app actions now read from an explicit local workspace runtime context; auth/tenant-resolved actors remain pending. → **Slice I**
- 🟡 **Injected clock** — app actions now share one deterministic local workspace clock; auth/provider-resolved runtime clock injection remains pending. → **Slice I**
- ✅ No obvious correctness bug found in core quote domain logic.

---

## Prioritized slice plan (each = one reviewed PR; all gates kept green; UI PRs include Playwright QA)

| Slice | Title | DoD | Status |
|------|-------|-----|--------|
| **A** | Offer export: copy + download `.txt` + real PDF render | §5, §9 | ✅ |
| **A2** | Offer lifecycle actions/history controls | §5 | ✅ |
| **A3** | Editable offer header + durable export/revision history | §5, §2 | ✅ |
| **B** | UI hardening: functional queue filters + Open-attachments disclosure (dead controls removed); mobile responsive verified | §9 | ✅ |
| **C** | Manual RFQ creation (stateful queue + accessible New-RFQ dialog → deterministic quote) | §1, §2 | ✅ |
| **C2** | Edit existing RFQ fields (customer/material/process/due/tolerance/notes) + provenance badges; drive readiness to blocked | §1, §2 | ✅ |
| **D** | Costing edit depth (material/rate/margin) + loading/empty states + App component tests | §2, §10 | 🟡 |
| **E** | Multi-process quoting via registry: process selector, non-CNC demo items, route through `calculateQuote` | §3 | ☐ |
| **F** | CAD review: operator overrides + per-type thumbnails/previews | §4 | 🟡 |
| **G** | Connector/calendar drill-downs + provider run history filters (supersedes PR #111) | §6, §7 | 🟡 |
| **I** | Real operator identity + single injected clock | cross-cutting | ◐ |
| **H** | (Optional) Wire `ConvexReactClient` so Convex is used when configured, local fallback otherwise | §8, §7 | ☐ |

Slices are ordered by value × independence × risk. A and B are self-contained and unlock the
clearest DoD wins; C/E are deeper structural changes; H is optional because the mission blesses
a documented local fallback. The checklist table is updated as each PR merges.
