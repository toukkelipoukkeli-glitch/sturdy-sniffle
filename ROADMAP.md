# FactoryBid OS Roadmap

FactoryBid OS is a production-grade automatic tarjouslaskenta (quote calculation) system for factories. Core quote math stays deterministic, testable, and usable without AI; AI and external services sit behind explicit provider adapters with local/mock fallbacks.

## Milestones

1. RFQ intake foundation
   - Capture RFQs from manual entry, email attachments, and imported files.
   - Normalize customer, deadline, material, quantity, process, tolerance, and attachment metadata.
   - Store every extracted field with source provenance and human-editable confidence.

2. Convex data model
   - Define customers, contacts, RFQs, parts, processes, materials, machines, rates, quotes, offers, activities, and provider runs.
   - Add indexes for factory workflow views: inbox, due soon, quote status, customer history, and process workload.
   - Keep generated Convex code out of manual edits and regenerate it through tooling.

3. Deterministic quoting engines
   - Implement server-side calculators for CNC machining, sheet metal, plastics, wire/EDM, and fabrication.
   - Model setup time, run time, machine rate, material yield, consumables, outside services, margin, rush factors, and minimum order rules.
   - Unit-test calculators with fixture-based examples and explainable line-item breakdowns.

4. Quote workspace
   - Build an operator workspace for RFQ triage, part review, costing assumptions, exception flags, and quote comparison.
   - Make every automatic decision editable and auditable before offer generation.
   - Support revisions, duplicate quote scenarios, and handoff notes.

5. Offer builder
   - Generate customer-ready offers with pricing tables, lead times, assumptions, validity terms, and optional alternates.
   - Export email-ready text and PDF-ready offer content without requiring AI.
   - Track sent offers, accepted offers, declined offers, and follow-up tasks.

6. CAD-like part viewer
   - Start with a lightweight 2D/3D attachment viewer for common previewable formats and extracted dimensions.
   - Add measurement overlays, manufacturability flags, material/process annotations, and part thumbnails.
   - Keep heavy geometry parsing behind replaceable adapters so the app can fall back to metadata-only review.

7. Gmail and calendar integration
   - Ingest RFQ emails, attachments, customer replies, and follow-up state from Gmail through connector boundaries.
   - Create calendar holds or reminders for quote due dates, customer calls, and offer follow-ups.
   - Preserve local/manual workflows when connector auth is unavailable.

8. Provider-adapter AI layer
   - Add server-side adapters for local Codex-backed assistance, Gemini, Tavily, ElevenLabs, and mocks.
   - Use AI only for optional extraction, summarization, drafting, scouting, and operator assistance.
   - Store prompts, provider metadata, outputs, and review state without exposing secrets to the client.

9. Feature-scout backlog
   - Maintain a backlog of high-leverage improvements from operator use, reviewer feedback, and competitive research.
   - Score ideas by quote accuracy, time saved, integration risk, and reviewability.
   - Promote only small, testable slices into implementation PRs.

## Implemented Foundation

- Convex schema, local generation workflow, and workflow API queries/mutations for RFQ queue reads, quote scenarios, process workload buckets, provider runs, connector integration links, and offer follow-up calendar activities. Managed worktrees use `.worktreeinclude` for ignored `.env.local` propagation while keeping secrets uncommitted.
- Deterministic RFQ intake with Gmail adapter fallback, strict received timestamp validation, attachment classification, and provenance fields.
- Deterministic quoting engines for CNC, sheet metal, plastics, wire/EDM, and fabrication, plus shared rate card presets.
- Quote workspace domain helpers for scenario comparison, revision audit trails, queue prioritization, process workload summaries, capacity commitment planning, and quote approval policy gates.
- Convex workspace persistence and authorization guard boundaries for RFQ status transitions, workspace activities, offer workflow reads/writes, and migration-safe single-tenant role defaults.
- Seeded demo workspace import/export with validation, dry-run summaries, and deterministic import-plan fingerprints for pre-write comparison.
- Offer builder domain model with plain-text offer export, PDF-ready offer document content, export fixtures/snapshots, lifecycle timeline, revision history, and follow-up task tracking.
- Deterministic offer release command planning, execution audit records, run-level fingerprints, history summaries, and Convex persistence adapters for email drafts, lifecycle sent/status events, calendar follow-up events, workspace status changes, idempotent dry-runs, manager-reviewed warning gates, and offer follow-up activity payloads.
- CAD-like part preview model with attachment ranking, preview modes, extracted dimensions, CAD metadata adapter boundaries for STEP/DXF/PDF, metadata-only fallback behavior, deterministic attachment review states, and manufacturability flags.
- Non-CNC registry quote previews with guarded selector/readiness flows, preview-only process input edits, deterministic promotion plans, local promotion records, ready-only draft payloads, visible reviewable command-package descriptors, deterministic promotion execution audit records, local execution persistence/history snapshots, deterministic outcome drafts, outcome draft review UI, reviewed-outcome commit adapter plans, commit-plan UI, and local outcome commit persistence before any active RFQ quote or offer mutation.
- Visible workspace UI for quote queue priority, process workload, capacity commitment, operator actions, integration health, provider-run review/history filters, connector link drill-downs, calendar follow-up status controls, CAD metadata review, attachment review state, and manufacturability flags with documented Browser/Playwright fallback QA when Computer Use permissions are blocked.
- Calendar integration plans for RFQ due holds/reminders and offer follow-up scheduling through provider/fallback adapters, including export fixture coverage and persisted connector link lookups.
- Gmail integration for RFQ intake and customer reply ingestion that turns accepted, declined, acknowledgement, and follow-up completion replies into deterministic lifecycle signals, plus tenant-safe Convex connector sync persistence with local fallback routing.
- Provider-adapter AI layer with mock/local/provider boundaries plus Convex-backed provider run audit records and query APIs.
- Feature-scout backlog scoring for small, reviewable product improvement slices.

## Next PR Slices

- Expand offer generation with deterministic alternates, customer-ready revision summaries, PDF rendering/export verification, and send/follow-up lifecycle controls.
- Add richer persisted connector and calendar drill-downs for cross-RFQ history, stale-link recovery, and follow-up rescheduling controls.
- Add richer part-review workflows for CAD thumbnails, preview status, dimensional checks, manufacturability flags, and operator overrides while keeping heavy geometry parsing behind adapters.
- Add production hardening for non-CNC promotion package review, seeded demo import/export, audit-log views, loading/error states, accessibility checks, and responsive QA coverage.
- Deepen Convex cloud readiness with tenant-safe activity/link filters, queue/workload views that mirror the local workspace runtime, and UI wiring for persisted offer release history/status/follow-up reads.
- Keep the feature-scout backlog running after each milestone so new factory-specific needs are scored into small, reviewable implementation slices.
