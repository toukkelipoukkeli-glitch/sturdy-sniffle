# FactoryBid OS Autonomous Build Handoff

Last refreshed: 2026-06-21 Europe/Helsinki.

This file is the durable continuation note for Codex threads or a human working from another machine. Keep it current when a long autonomous run pauses, when a major milestone lands, or before handing off to another environment.

## Current Checkpoint

- Repository: `toukkelipoukkeli-glitch/sturdy-sniffle`.
- Main branch checkpoint: `9d06368` (`[codex] Add provider run history filters (#109)`).
- Open PRs at this checkpoint: none.
- Latest merged sequence:
  - `#109` provider run history filters.
  - `#108` offer reply state filters in the workspace.
  - `#107` offer reply state summaries.
  - `#106` offer reply sync persistence wiring.
  - `#105` offer reply persistence payloads.
  - `#104` workspace audit feed.
  - `#103` workspace integration health.
  - `#98` through `#102` provider run and connector persistence bridges.
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
- CAD-like attachment preview models, CAD metadata adapter boundaries, review state, and manufacturability flags.
- React workspace surfaces for quote queue, workload, capacity, material/outside service planning, provider review, CAD metadata review, integration health, offer reply state, and audit visibility.

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

1. Surface provider run history filters in the React workspace.
   - Reuse `src/domain/providers/providerRunHistory.ts`.
   - Add compact filters for provider, status, review state, and recent run summaries.
   - Include Browser/Playwright desktop and mobile QA because this is UI-facing.

2. Add connector sync/link drill-downs.
   - Extend the integration health UI with linked RFQ/offer/provider run details.
   - Keep tenant and connector IDs explicit.
   - Add focused domain tests for sorting, empty states, and stale-error states.

3. Add calendar follow-up status controls.
   - Surface pending/scheduled/skipped follow-up events in the workspace.
   - Keep Gmail/calendar connector failures isolated from core offer state.
   - Use deterministic fixture data for tests.

4. Harden PDF/export verification for offers.
   - Keep deterministic plain-text and PDF-ready content as source of truth.
   - Add render/export verification without making AI required.
   - Record export warnings and assumptions in offer history.

5. Deepen part-review workflows.
   - Add preview status, dimension checks, manufacturability override notes, and thumbnail placeholders behind adapter boundaries.
   - Avoid committing heavy geometry parsing until adapter and fallback behavior are clear.

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
