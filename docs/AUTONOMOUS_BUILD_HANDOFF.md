# FactoryBid OS Autonomous Build Handoff

Last refreshed: 2026-06-27 Europe/Helsinki.

This file is the durable continuation note for Codex threads or a human working from another machine. Keep it current when a long autonomous run pauses, when a major milestone lands, or before handing off to another environment.

## Current Checkpoint

- Repository: `toukkelipoukkeli-glitch/sturdy-sniffle`.
- Main branch checkpoint: `2e0817e` (`Show non-CNC preview assumptions (#144)`).
- Open PRs at this checkpoint: none.
- In-flight PR at this checkpoint: none.
- Latest merged sequence:
  - `#144` selected non-CNC registry previews now show top quote assumptions and calculator review flags.
  - `#143` guarded read-only selector for sheet metal, plastics, wire/EDM, and fabrication registry quote previews.
  - `#142` attachment preview output descriptors expose deterministic real-preview-ready states for CAD/drawing/image/metadata attachments.
  - `#140` part preview attachments now expose deterministic per-type preview and thumbnail labels in the workspace.
  - `#139` reviewed CAD correction notes surface as explicit quote assumptions without changing deterministic totals or raw RFQ inputs.
  - `#138` durable CAD dimension/material/process correction notes can be saved, restored, and cleared.
  - `#137` operators can choose and persist the primary part preview attachment.
  - `#136` app actions now use a local workspace runtime context for deterministic operator/timezone/clock values.
  - `#135` CAD manufacturability flags can be acknowledged and reopened with a persistent operator note.
  - `#130` healthy deterministic RFQ connector sync path.
  - `#132` Gmail RFQ sync materializes duplicate-safe imported queue items for operator review.
  - `#133` workspace CNC pricing routes through the shared `calculateQuote` registry.
  - `#134` read-only non-CNC registry demos surface quote breakdowns in the workspace.
  - `#131` autonomous handoff refresh.
  - `#129` selected-RFQ calendar plan preview.
  - `#128` offer release calendar draft preview.
  - `#127` local release execution controls.
  - `#126` release review action.
  - `#125` workspace error boundary.
  - `#111` provider run history filters.
  - `#112` connector link drill-downs.
  - `#113` calendar follow-up status controls.
- The build loop has been using small `codex/*` branches, CodeRabbit review rounds, GitHub CI, and local Bun validation before merge.
- Greptile is currently an external blocker because the trial account reached its 50-review limit. Continue with CI, local validation, CodeRabbit, and documented fallbacks unless the account is upgraded.

## Product State

FactoryBid OS is no longer just a scaffold. The repository currently includes:

- Bun, Vite, React, TypeScript, Tailwind CSS v4, shadcn/ui, Convex, Vitest, and Playwright.
- Deterministic quote engines for CNC, sheet metal, plastics, wire/EDM, and fabrication.
- RFQ intake models, Gmail RFQ adapter logic, attachment classification, intake readiness gates, and provenance handling.
- Convex schema and workflow APIs for RFQs, quotes, offers, activities, provider runs, connector links, and workflow actions.
- Quote workspace helpers for scenario comparison, revisions, queue priority, process workload, capacity planning, outside services, material availability, approval gates, and release gates.
- Offer builder, offer document content, export fixtures, offer lifecycle, release plan, release execution audit/history/fingerprints, and persistence adapters.
- Gmail offer reply ingestion and persistence that maps accepted, declined, acknowledgement, and follow-up signals into deterministic offer state.
- Calendar planning for RFQ due holds and offer follow-ups behind adapter boundaries.
- Provider adapter boundaries for mock/local/provider AI work, with Convex-backed provider run audit records and query APIs.
- CAD-like attachment preview models, CAD metadata adapter boundaries, review state, manufacturability flags, and deterministic preview/thumbnail labels.
- React workspace surfaces for quote queue, workload, capacity, material/outside service planning, provider review filters, CAD metadata review, integration health, connector link drill-downs, calendar plan previews, calendar follow-up status, offer reply state, release execution history, and audit visibility.

Core quote math must remain deterministic and usable without AI. AI/provider work belongs behind explicit server-side adapters with mock/local fallbacks.

## Local Resume Checklist

From a fresh machine or clone:

```sh
git clone https://github.com/toukkelipoukkeli-glitch/sturdy-sniffle.git
cd sturdy-sniffle
bun install
gh auth status
gh pr list --repo toukkelipoukkeli-glitch/sturdy-sniffle --state open
bun run lint
bun run test
bun run test:e2e
bun run build
```

If Convex local configuration is available:

```sh
bun run convex:codegen
bun run convex:once
```

Do not commit `.env.local` or any API keys. Managed Codex worktrees may copy `.env.local` through `.worktreeinclude`, but the file must remain ignored.

## Autonomous PR Loop

Use this loop for each slice:

1. Sync `main` and inspect open PRs before editing.
2. If an existing PR is open, wait for CI and CodeRabbit, inspect comments, fix valid feedback, push a follow-up, wait for the next pass, then merge when clean.
3. If no PR is open, create a focused branch named `codex/<short-description>` from `origin/main`.
4. Implement one coherent slice.
5. Run local validation:
   - `bun run lint`
   - `bun run test`
   - `bun run test:e2e`
   - `bun run build`
   - `bun run convex:codegen` or `bun run convex:once` when Convex schema/workflow code changes.
6. For substantial UI changes, run a human-style visual QA pass. Prefer Browser or Playwright for deterministic local evidence. Attempt Computer Use when real GUI/profile behavior matters, but document the blocker if macOS Accessibility or Screen Recording permissions prevent inspection.
7. Push and open a PR with validation notes and reviewer focus.
8. Wait for GitHub CI and CodeRabbit. Greptile quota comments are known external blockers and should not stop unrelated work.
9. Fix valid CodeRabbit feedback through at least one more review round.
10. Merge, sync, delete the remote branch when appropriate, and start the next unblocked slice.

## Known External Blockers And Fallbacks

- Greptile: trial review quota exhausted. Continue with CodeRabbit and local gates.
- Computer Use: may be blocked by local macOS Accessibility or Screen Recording permissions. Use Browser/Playwright screenshots and note the blocker in UI PRs.
- Convex cloud: local development can proceed with `convex:codegen` and `convex:once` when `.env.local` is configured. If cloud auth fails, keep adapters deterministic and add local/mock fallbacks.
- Gmail and Calendar: connector-auth-dependent features should keep local fixture/provider fallbacks and should not block deterministic quote workflows.
- Codex local ChatGPT auth: keep optional and local-provider-scoped. Do not treat it as a hosted OpenAI API key in committed code.

## Next High-Leverage PR Slices

Work in small, reviewed slices. Good next candidates from the current checkpoint:

1. Move the app's quote path toward the multi-process registry.
   - CNC workspace pricing now routes through `calculateQuote` without changing visible pricing.
   - Read-only non-CNC registry demos now show a guarded process selector, quote breakdowns, assumptions, and review flags; after this, non-CNC engines need editable process-specific inputs and offer wiring.
   - Keep all calculators deterministic and preserve focused tests for each process.

2. Add CAD review operator overrides.
   - Manufacturability flags can now be acknowledged and reopened with a persistent note.
   - Operators can choose the primary preview attachment and persist that choice.
   - Operators can save durable dimension/material/process correction notes; those notes now appear as explicit quote assumptions without changing quote math or raw RFQ inputs.
   - Deterministic per-type preview and thumbnail labels distinguish CAD models, drawings, photos, spreadsheets, and metadata-only attachments.
   - Next steps: add richer thumbnail/preview adapter outputs for real STEP/DXF/PDF/image handling while keeping parser failures nonfatal.
   - Keep real geometry parsing behind adapter boundaries and use deterministic fallback states.
   - Include Browser/Playwright desktop and mobile QA because this is UI-facing.

3. Introduce operator identity and a single injected workspace clock.
   - Current in-flight slice replaces action-time wall-clock writes and scattered operator names with an explicit local workspace context.
   - Next steps: let Convex/auth-resolved actor data feed the same context when configured.
   - Keep audit records deterministic in tests.
   - Avoid auth scope creep; this is local identity plumbing, not a full login system.

4. Wire optional Convex reads into the UI with local fallback.
   - Use existing Convex workflow/persistence APIs only when configured.
   - Keep local-first e2e green without cloud auth.
   - Do not commit secrets or deployment-specific values.

5. Harden PDF/export verification for offers.
   - Keep deterministic plain-text and PDF-ready content as source of truth.
   - Add render/export verification without making AI required.
   - Record export warnings and assumptions in offer history.

6. Production hardening pass.
   - Add loading/error/empty states for persisted workspace reads.
   - Add accessibility checks for dense workspace controls.
   - Keep screenshots or Playwright artifacts out of git unless intentionally documenting visual baselines.

## Review Notes

- CodeRabbit comments have been useful and should be treated as actionable unless clearly irrelevant.
- Greptile quota-only comments are not actionable.
- Keep PRs narrow so reviewers can reason about them.
- Update `ROADMAP.md` when a slice changes product status or moves a next-slice item into the implemented foundation.
- Keep this handoff file current enough that another machine can resume without reading the entire Codex thread history.
