# FactoryBid OS Autonomous Build Handoff

Last refreshed: 2026-07-06 Europe/Helsinki.

This file is the durable continuation note for Codex threads or a human working from another machine. Keep it current when a long autonomous run pauses, when a major milestone lands, or before handing off to another environment.

## Current Checkpoint

- Repository: `toukkelipoukkeli-glitch/sturdy-sniffle`.
- Main branch checkpoint: `a6f57e2` (`Persist follow-up readiness sync health locally (#285)`).
- Open PRs at this checkpoint: none on `main`; this branch is aligning restored follow-up readiness sync-health fallback events with the workspace-wide integration fallback indicator.
- In-flight PR at this checkpoint: `codex/followup-readiness-replay-health-indicator` seeds the global persistence fallback count from restored follow-up readiness sync-health events so the top-level persistence chip and Integration health panel stay consistent after reload.
- Latest merged sequence:
  - `#285` persists validated follow-up readiness sync-health fallback events in the local workspace state and restores them after reload without changing Convex/local persistence behavior.
  - `#284` records deterministic read/write fallback events for follow-up readiness sync health, scopes them to the selected offer/RFQ, and surfaces the latest fallback operation in the Offer workspace.
  - `#283` scopes follow-up readiness sync-health fallback visibility to the readiness reader/write paths and surfaces healthy/fallback status in the Offer workspace.
  - `#282` surfaces deterministic local/Convex/other sync-source summaries for follow-up activity readiness history in the Offer workspace.
  - `#281` records and hydrates follow-up activity readiness snapshots through optional browser Convex refs while preserving the local history fallback and strict timestamp normalization.
  - `#280` adds deterministic local/Convex client adapters for follow-up activity readiness snapshots, including ISO-to-Convex timestamp conversion, query validation, dedupe, and local fallback snapshots.
  - `#279` persists follow-up activity readiness snapshots in Convex with tenant-safe workflow APIs, count validation, and audit activities.
  - `#278` maps follow-up activity readiness history records into validated Convex payload/read records so future workflow persistence can reject malformed shapes before writes.
  - `#277` seeds local follow-up activity read summaries from restored workspace follow-up actions so reloads keep manual follow-up coverage ready before any optional Convex read returns.
  - `#276` adds deterministic follow-up action key suffixes for repeated manual follow-up writes so local audit rows remain unique without changing follow-up task IDs or connector dedupe behavior.
  - `#275` persists validated follow-up activity readiness history snapshots in localStorage, restores them through the deterministic history adapter, and rejects malformed restored snapshots.
  - `#274` surfaces follow-up activity readiness history in the Offer workspace, records current snapshots locally, and aligns unmatched persisted follow-up activities with review-state readiness.
  - `#273` adds deterministic local persistence for follow-up activity readiness history records with stable-key dedupe, cloned snapshots, seeded-record validation, and current-key summary metadata.
  - `#272` adds deterministic follow-up activity readiness history summaries with stable-key dedupe, current-record lookup, status counts, and validation for future persistence/UI surfaces.
  - `#271` surfaces pending/partial/recorded/review follow-up activity coverage in the Offer workspace with expected/recorded/missing task counts, operator next actions, and Browser/Playwright QA fallback evidence.
  - `#270` turns follow-up activity read summaries into pending/partial/recorded/review readiness metadata with normalized expected/recorded/missing/unexpected task IDs and operator next actions.
  - `#269` adds a Convex workspace persistence write predicate, passes it through the runtime bridge, and uses persisted follow-up activity task IDs to skip duplicate remote follow-up activity writes without dropping local fallback state.
  - `#268` makes release workspace follow-up actions carry explicit task IDs, emits parseable scheduled follow-up messages for the dedicated Convex activity mutation, and skips duplicate release-time follow-up writes when the persisted read summary already contains the task ID.
  - `#267` lets the deterministic Convex offer follow-up activity payload builder consume persisted follow-up activity read summaries so known recorded task IDs do not produce duplicate future write payloads.
  - `#266` hydrates follow-up activity summaries from `listOfferFollowUpActivities` through the optional browser Convex bridge, keeps a local empty fallback, and surfaces persisted activity counts/task IDs in the Offer workspace.
  - `#265` adds a local/Convex read adapter for `listOfferFollowUpActivities`, including seeded-record validation and local fallback summaries of recorded follow-up task IDs.
  - `#264` hydrates the offer release execution history panel from `listOfferReleaseExecutions` through the optional browser Convex bridge, merges persisted reads with local preview/commit runs, and keeps StrictMode query caching deterministic.
  - `#263` adds a local/Convex query-side adapter around `listOfferReleaseExecutions` so runtime/UI slices can hydrate persisted release execution history from workflow reads.
  - `#262` wires the optional browser Convex readiness query bridge into the React workspace and merges persisted readiness reads with local write snapshots.
  - `#261` adds local/Convex query-side adapters for offer provider outcome readiness records with deterministic fallback reads.
  - `#260` surfaces recorded provider outcome readiness snapshots in the React offer workspace, including a StrictMode-safe persistence effect and Browser/Playwright QA fallback evidence.
  - `#259` records computed provider outcome readiness through the browser Convex bridge when available and keeps the local fallback hot while real Gmail/calendar/provider sending stays deferred.
  - `#258` adds a deterministic local/Convex client adapter for provider outcome readiness records with focused adapter coverage.
  - `#257` persists and lists deterministic provider outcome readiness records in Convex with tenant-safe workflow APIs and audit activities.
  - `#256` maps provider outcome readiness into deterministic Convex-safe payload/read records for future workflow API wiring.
  - `#255` surfaces provider outcome readiness in the release execution audit and gates local execution on it with Browser/Playwright QA fallback evidence.
  - `#254` converts provider outcome history into ready/blocked execution readiness for future release gates.
  - `#253` surfaces local provider outcome batch readiness in the offer workspace with Browser/Playwright QA fallback evidence.
  - `#252` summarizes local provider outcome batch records for future operator/API surfaces.
  - `#251` records and normalizes provider-backed release command outcome batches before release executions consume them.
  - `#250` combines the local/mock email draft provider result with local release adapter outcomes so release executions can consume explicit guarded side-effect outcomes.
  - `#249` adds a local/mock offer email draft provider adapter that turns guarded ready email draft packages into deterministic provider outcomes while external Gmail sending remains behind a boundary.
  - `#248` surfaces the deterministic email draft package history summary in the offer workspace with Browser/Playwright QA fallback evidence.
  - `#247` summarizes persisted email draft package records for future UI/API surfaces.
  - `#246` records deterministic email draft package snapshots in local persistence with seeded-record normalization and deduplication.
  - `#245` builds deterministic, provider-safe email draft packages from ready offer release plans while malformed/non-ready commands stay blocked.
  - `#244` surfaces deterministic offer release send/follow-up summary metadata in the release plan panel with Browser/Playwright QA fallback evidence.
  - `#243` adds deterministic release-plan send/follow-up summary metadata, including all email attachment filenames.
  - `#242` adds deterministic customer-ready summary copy for offer terms and normalizes exported term items.
  - `#241` adds deterministic customer-ready prose for offer alternate options.
  - `#240` adds deterministic multi-revision customer copy to offer documents/export metadata.
  - `#239` persists compact CAD override audit events for saved corrections, acknowledged flags, and reopened review state, and adds deterministic customer-facing offer revision summary metadata/text.
  - `#238` persists CAD geometry review action context into operator override history so saved CAD corrections can be traced after reloads while real parsers stay deferred.
  - `#237` adds deterministic operator action hints for CAD geometry review warnings/blockers, including a DXF needs-review fixture.
  - `#236` surfaces deterministic geometry review summaries in the part preview viewport and attachment thumbnail surfaces.
  - `#235` adds deterministic ready/needs-review/blocked summary checks for metadata-derived CAD geometry descriptors.
  - `#234` metadata-derived geometry descriptors now render in the part preview viewport and attachment thumbnails with Browser/Playwright QA fallback evidence.
  - `#233` ready STEP/DXF attachment preview outputs now carry deterministic geometry preview descriptors for viewport and thumbnail rendering.
  - `#232` metadata-derived STEP/DXF geometry preview descriptors now have a deterministic adapter boundary with guarded provider/fallback behavior.
  - `#231` ready STEP/DXF metadata adapter results now render compact metadata-backed thumbnail tiles in the part preview attachment list.
  - `#230` CAD metadata filename matching now uses a shared boundary-aware helper so distinct filename segments and dotted part numbers cannot collapse into the same attachment.
  - `#229` ready STEP/DXF metadata adapter results now render compact primary viewport metadata cards.
  - `#228` successful CAD metadata adapter results now mark STEP/DXF preview descriptors ready while parser failures remain deterministic nonfatal fallbacks.
  - `#227` part review attachments now render safe browser-native PDF drawing previews with a deterministic load-time fallback watchdog.
  - `#226` part review attachments now render safe browser-native image previews with deterministic load-failure fallback handling.
  - `#225` non-CNC registry previews now surface local mutation apply execution history with Browser/Playwright QA fallback evidence and stabilized long App component tests.
  - `#224` non-CNC application mutation apply execution audit records now have deterministic local persistence snapshots with seeded-record validation and deduplication.
  - `#223` non-CNC registry previews now surface deterministic mutation apply execution audit records in the operator workspace with Browser/Playwright QA fallback evidence.
  - `#222` non-CNC application mutation apply plans now produce deterministic dry-run/commit execution audit records with stronger execution fingerprints.
  - `#221` non-CNC registry previews now surface local mutation apply-plan history with Browser/Playwright QA fallback evidence.
  - `#220` non-CNC application mutation apply plans now have deterministic local persistence snapshots with seeded-record validation and deduplication.
  - `#219` non-CNC registry previews now surface deterministic mutation apply-plan descriptors in the operator workspace with Browser/Playwright QA fallback evidence.
  - `#218` ready/blocked mutation outcome commit read models now produce deterministic mutation apply-plan descriptors before any active RFQ quote, offer, or release-state mutation.
  - `#217` non-CNC registry previews now surface deterministic mutation outcome commit read models with Browser/Playwright QA fallback evidence.
  - `#216` persisted non-CNC application mutation outcome commits now produce deterministic ready/blocked read models before any active RFQ quote, offer, or release-state mutation.
  - `#215` non-CNC registry previews now surface local application mutation outcome commit history with Browser/Playwright QA fallback evidence.
  - `#214` application mutation outcome commit plans now have deterministic local persistence snapshots with seeded-record validation and deduplication.
  - `#213` non-CNC registry previews now surface deterministic application mutation outcome commit plans/runs with Browser/Playwright QA fallback evidence.
  - `#212` reviewed application mutation execution outcome drafts now feed deterministic mutation outcome commit plans/runs before any live workspace mutation.
  - `#211` non-CNC registry previews now surface reviewed application mutation execution outcome drafts with Browser/Playwright QA fallback evidence.
  - `#210` application mutation execution audits now produce deterministic reviewed outcome drafts while keeping active RFQ quote, offer, and release state unchanged.
  - `#209` non-CNC registry previews now surface application mutation execution audit and local history panels with Browser/Playwright QA fallback evidence.
  - `#208` application mutation execution audit records now have deterministic local persistence snapshots with seeded-record validation and deduplication.
  - `#207` application mutation packages now produce deterministic dry-run/commit execution audit records and operator-visible audit/history surfaces.
  - `#206` non-CNC registry previews now surface deterministic application mutation package descriptors in the operator workspace.
  - `#205` application outcome commit read models now produce deterministic application mutation package descriptors with existing command keys and explicit mutation targets.
  - `#204` non-CNC registry previews now surface deterministic application outcome commit read models in the operator workspace.
  - `#203` persisted non-CNC promoted quote application outcome commits now produce deterministic read models that gate future active RFQ quote, offer, and release-state mutation.
  - `#202` non-CNC registry previews now surface local application outcome commit persistence history with Browser/Playwright QA fallback evidence.
  - `#201` reviewed non-CNC promoted quote application outcome commit plans now have deterministic local persistence snapshots with seeded-record validation and deduplication.
  - `#200` non-CNC registry previews now surface application outcome commit plans with Browser/Playwright QA fallback evidence.
  - `#199` non-CNC promoted quote application outcome drafts now feed deterministic commit-plan/run adapters before any active RFQ quote or offer mutation.
  - `#198` non-CNC registry previews now surface application execution outcome drafts with Browser/Playwright QA fallback evidence.
  - `#197` non-CNC promoted quote application execution records now produce deterministic suggested outcome drafts with command-level blockers.
  - `#196` non-CNC registry previews now surface local application execution persistence history with Browser/Playwright QA fallback evidence.
  - `#195` non-CNC promoted quote application execution audits now have deterministic local persistence snapshots with seeded-record validation and deduplication.
  - `#194` non-CNC registry previews now surface deterministic promoted quote application execution audit records in the workspace.
  - `#193` non-CNC promoted quote application records now produce deterministic dry-run/commit execution audit records.
  - `#192` non-CNC registry previews now surface local promoted quote application history with Browser/Playwright QA fallback evidence.
  - `#191` non-CNC promoted quote application plans now have deterministic local persistence snapshots with seeded-record validation and deduplication.
  - `#190` non-CNC registry previews now surface promoted quote application plans in the operator workspace with Browser/Playwright QA fallback evidence.
  - `#189` promoted non-CNC quote read models now produce deterministic active-RFQ application plans that reject unsluggable IDs and withhold payloads on blocked/mismatched paths.
  - `#188` non-CNC registry previews now surface the promoted quote read model in the operator workspace with Browser/Playwright QA fallback evidence.
  - `#187` successful reviewed non-CNC quote promotion commits now produce a deterministic read model while blocked/dry-run/mismatched paths withhold promoted IDs and snapshots.
  - `#186` non-CNC registry previews now surface local reviewed-outcome commit persistence history with Browser/Playwright QA fallback evidence.
  - `#185` non-CNC reviewed-outcome commit plans now have deterministic local persistence snapshots with seeded-record validation and deduplication.
  - `#184` non-CNC registry previews now surface reviewed-outcome commit plans in the UI with guarded ready/blocked states before any active RFQ quote, offer, or release mutation.
  - `#183` non-CNC promotion outcome drafts now feed deterministic reviewed-outcome commit plan/run adapters before any active RFQ quote, offer, or release mutation.
  - `#182` non-CNC registry previews now surface deterministic outcome draft review UI and ready-path coverage while keeping active RFQ quote, offer, and release state unchanged.
  - `#181` non-CNC promotion command packages now produce deterministic execution outcome drafts for future reviewed commits.
  - `#180` non-CNC registry previews now surface local promotion execution history snapshots with Browser/Playwright QA fallback evidence.
  - `#179` non-CNC promotion execution runs now have deterministic local persistence snapshots with seeded-record validation and deduplication.
  - `#178` non-CNC registry previews now surface deterministic promotion execution audit rows and copyable execution summaries in the UI.
  - `#177` non-CNC promotion command packages now have deterministic dry-run/commit execution audit records with outcome guards.
  - `#176` non-CNC registry previews now surface deterministic promotion command packages with payload readiness, blockers, and warnings.
  - `#175` ready promotion drafts now package deterministic command descriptors with canonical action ordering before any active RFQ quote or offer mutation.
  - `#174` non-CNC registry previews now surface ready-only quote promotion draft payloads in the UI while blocked paths withhold quote payloads.
  - `#173` promotion action summaries now build ready-only deterministic quote promotion draft payloads while blocked/missing-record paths withhold quote payloads.
  - `#172` non-CNC registry previews now show read-only promotion action summaries with guarded command states and blockers.
  - `#171` local non-CNC promotion records now produce deterministic per-command action summaries for blocked, ready, and missing-record states.
  - `#170` non-CNC registry previews now surface the local promotion persistence snapshot in the UI and accumulate read-only promotion history across selector changes.
  - `#169` non-CNC promotion plans now have deterministic local persistence records with review-only vs candidate disposition and seeded-record deduplication.
  - `#168` non-CNC registry previews now surface the deterministic promotion plan panel with blocked commands, candidate snapshot, and next actions.
  - `#167` non-CNC previews now have a deterministic promotion plan snapshot contract with blocked, needs-review, and ready states for future persistence/offer wiring.
  - `#166` non-CNC registry previews now expose deterministic offer handoff/readiness summaries while keeping active RFQ quote, offer, and release paths unchanged.
  - `#165` fabrication registry previews now have preview-only editable controls for fabrication, welding, assembly, inspection, complexity, and finish inputs.
  - `#164` Wire EDM registry previews now have preview-only editable controls for stock dimensions, contour length, skim passes, and inspection level.
  - `#163` plastic machining registry previews now have preview-only editable controls for material family, stock dimensions, and surface finish; derived operation count remains read-only.
  - `#162` sheet-metal registry previews now have preview-only editable controls that recalculate through the non-CNC edit registry while RFQ, offer, and release paths remain guarded.
  - `#161` copied non-CNC estimator summaries now include selected adapter version, mapped editable fields, guarded read-only fields, and guarded UI status.
  - `#160` non-CNC preview cards now show selected input edit adapter readiness, mapped field counts, read-only guarded counts, and guarded UI copy.
  - `#159` sheet-metal, plastics, wire/EDM, and fabrication input edit adapters now share one deterministic registry boundary.
  - `#158` fabrication planned fields can now be applied to calculator inputs and recalculated through the shared registry path.
  - `#157` wire/EDM planned fields can now be applied to calculator inputs and recalculated through the shared registry path.
  - `#156` plastics planned fields can now be applied to calculator inputs and recalculated through the shared registry path; derived operation count remains read-only until operation-level edits exist.
  - `#155` sheet-metal planned fields can now be applied to calculator inputs and recalculated through the shared registry path.
  - `#154` non-CNC previews now show deterministic quote-path promotion blockers before writable controls exist.
  - `#153` non-CNC process selector options now show deterministic draft-complete/draft-gap coverage badges.
  - `#152` non-CNC planned fields now hydrate read-only fixture draft values and explicit missing-value coverage.
  - `#151` non-CNC readiness now includes field-level planned inputs for future editable process forms.
  - `#150` non-CNC registry previews now expose blocked editable-input readiness groups before writable process controls are added.
  - `#149` copyable non-CNC preview summaries now include the visible cheapest/fastest/selected-delta comparison lines.
  - `#148` non-CNC previews now show cheapest, fastest, and selected-vs-best comparison summary metrics.
  - `#147` non-CNC preview selector options now show deterministic best-price, fastest-lead, and review-flag badges.
  - `#146` non-CNC preview cards now expose a copyable read-only estimator review summary with clipboard feedback.
  - `#145` non-CNC preview cards now show an operator checklist that distinguishes calculator-ready, read-only-input, offer-wiring, and calculator-flag states.
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
- Offer builder, offer document content, export fixtures, offer lifecycle, release plan, guarded email draft package descriptors, local email draft package persistence snapshots, email draft package history summaries and UI surface, local/mock email draft provider outcomes, provider-backed release command outcome helpers, local provider outcome batch persistence and history summaries/UI surface, provider outcome readiness gates/workspace execution gate/Convex payloads/workflow persistence/client adapter/runtime bridge/operator-visible snapshot UI/persisted-read adapter/runtime hydration, release execution audit/history/fingerprints plus persisted-read adapter/runtime hydration, and follow-up activity read adapters with runtime hydration plus duplicate-safe write planning/release dedupe/manual dedupe/readiness metadata/workspace panel/history summaries/local persistence/readiness-history UI/local-state persistence/unique manual follow-up audit keys/restored-action readiness replay/Convex readiness payload contracts/workflow persistence/client adapter/runtime bridge, operator-visible sync-source summaries, scoped sync-health fallback visibility, read/write fallback history details, reload-safe sync-health replay, and in-flight global fallback indicator alignment.
- Gmail offer reply ingestion and persistence that maps accepted, declined, acknowledgement, and follow-up signals into deterministic offer state.
- Calendar planning for RFQ due holds and offer follow-ups behind adapter boundaries.
- Provider adapter boundaries for mock/local/provider AI work, with Convex-backed provider run audit records and query APIs.
- CAD-like attachment preview models, CAD metadata and geometry descriptor adapter boundaries, review state, manufacturability flags, deterministic preview/thumbnail labels, viewport metadata cards, compact thumbnail cards, metadata-derived geometry preview output contracts, geometry preview UI rendering, geometry review summary checks and UI surfaces, persisted CAD action context, and boundary-aware CAD metadata matching.
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
   - Read-only non-CNC registry demos now show a guarded process selector, best-price/fastest-lead badges, selected-vs-best summary, quote breakdowns, assumptions, review flags, operator checklist, input-readiness groups, planned input fields, read-only fixture draft values, selector draft coverage, promotion blockers, adapter readiness, preview-only edit controls for sheet-metal/plastics/wire-EDM/fabrication, offer handoff/readiness, deterministic promotion plan contract/panel, local promotion-plan persistence records/snapshot, deterministic promotion action summaries, ready-only promotion draft payloads, canonical command packages, command-package UI, execution audit records, copyable execution summary, surfaced execution audit UI, local execution persistence snapshots, execution history UI, deterministic outcome drafts, outcome draft UI, reviewed-outcome commit-plan UI, local outcome commit persistence, outcome commit history UI, a deterministic promoted quote read model surfaced in the workspace, a deterministic application-plan boundary surfaced in the workspace, local application-plan persistence snapshots surfaced in the workspace, deterministic application execution audit records, workspace-visible application execution audits, local application execution persistence snapshots, application execution history UI, deterministic application execution outcome drafts, application execution outcome draft UI, application outcome commit plans, application outcome commit-plan UI, local application outcome commit persistence, application outcome commit history UI, deterministic application outcome commit read models, deterministic application mutation package descriptors, operator-visible mutation package review surfaces, deterministic mutation package execution audits, local mutation execution persistence snapshots, operator-visible mutation execution history, deterministic mutation execution outcome drafts, operator-visible mutation execution outcome draft review UI, deterministic mutation outcome commit plans/runs, operator-visible mutation outcome commit-plan UI, local mutation outcome commit persistence snapshots, operator-visible mutation outcome commit history, deterministic mutation outcome commit read models, operator-visible mutation outcome commit read-model surfaces, deterministic mutation apply-plan descriptors, operator-visible mutation apply-plan surfaces, local mutation apply-plan persistence snapshots, operator-visible mutation apply-plan history, deterministic mutation apply execution audit records, operator-visible mutation apply execution audits, local mutation apply execution persistence snapshots, and operator-visible mutation apply execution history. The active RFQ quote, offer, and release state still remain unchanged until a later adapter applies the package. After this, all non-CNC engines need persisted quote promotion and offer wiring.
   - Keep all calculators deterministic and preserve focused tests for each process.

2. Add CAD review operator overrides.
   - Manufacturability flags can now be acknowledged and reopened with a persistent note.
   - Operators can choose the primary preview attachment and persist that choice.
   - Operators can save durable dimension/material/process correction notes; those notes now appear as explicit quote assumptions without changing quote math or raw RFQ inputs.
   - Deterministic per-type preview and thumbnail labels distinguish CAD models, drawings, photos, spreadsheets, and metadata-only attachments.
   - Safe browser-native image and PDF drawing attachments now render from inline/blob preview sources in the part review viewport.
   - Successful CAD metadata adapter results now mark STEP/DXF preview descriptors ready, while parser failures remain deterministic placeholders.
   - Ready STEP/DXF metadata adapter results now render as compact primary viewport metadata cards.
   - `#230` hardened CAD metadata filename matching with a shared boundary-aware helper so distinct filename segments and dotted part numbers cannot collapse into the same attachment.
   - `#231` added compact metadata-backed thumbnail tiles for ready STEP/DXF attachments while real geometry parsing stays deferred.
   - `#232` added metadata-derived STEP/DXF geometry preview descriptors with provider/fallback seams while keeping parser failures nonfatal.
   - `#233` carries geometry descriptors on ready STEP/DXF attachment preview outputs for later UI rendering.
   - `#234` renders those geometry descriptors in viewport/thumbnail surfaces.
   - `#235` adds deterministic geometry-specific review summary checks for ready/needs-review/blocked preview states.
   - `#236` surfaces those geometry review summaries in the viewport and attachment thumbnails.
   - `#237` adds operator action hints for geometry review warnings/blockers and a DXF needs-review preview fixture.
   - `#238` wires selected action hints into persisted operator override history.
   - `#239` persists compact operator override event history and adds customer-facing offer revision summary metadata/text.
   - Next steps: eventually swap in real parser providers.
   - Keep real geometry parsing behind adapter boundaries and use deterministic fallback states.
   - Include Browser/Playwright desktop and mobile QA for UI-facing follow-up slices.

3. Introduce operator identity and a single injected workspace clock.
   - Local workspace runtime context already replaced action-time wall-clock writes and scattered operator names.
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
   - `#240` adds deterministic multi-revision customer copy to the revision history section/export metadata.
   - `#241` adds deterministic customer-ready prose for alternate options.
   - `#242` adds deterministic customer-ready summary copy for offer terms.
   - `#243` adds deterministic release-plan send/follow-up summary metadata.
   - `#244` surfaces that summary in the release plan UI.
   - `#245` builds a guarded provider-safe email draft package boundary without sending email.
   - `#246` records email draft package snapshots in local deterministic persistence before any provider send wiring.
   - `#247` summarizes persisted draft package records for future UI/API surfaces.
   - `#248` surfaces the deterministic draft package history summary in the offer workspace.
   - Current branch adds a local/mock email draft provider adapter that returns release command outcomes without calling Gmail.

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
