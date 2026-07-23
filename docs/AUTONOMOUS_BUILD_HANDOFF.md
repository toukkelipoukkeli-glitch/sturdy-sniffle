# FactoryBid OS Autonomous Build Handoff

Last refreshed: 2026-07-23 Europe/Helsinki.

This file is the durable continuation note for Codex threads or a human working from another machine. Keep it current when a long autonomous run pauses, when a major milestone lands, or before handing off to another environment.

## Current Checkpoint

- Repository: `toukkelipoukkeli-glitch/sturdy-sniffle`.
- Main branch checkpoint: `7d83ff5` (`Refresh non-CNC release UI handoff (#495)`).
- Open PRs at this checkpoint: none on `main`.
- In-flight branch at this checkpoint: `codex/non-cnc-offer-wiring-readiness` — adds a deterministic non-CNC promoted quote offer-wiring readiness boundary before future customer offer adapters.
- Latest merged sequence:
  - `#495` refreshes the autonomous handoff after the non-CNC release-readiness UI slice.
  - `#494` surfaces the deterministic non-CNC release-readiness boundary in the operator workspace with blocked/ready App coverage and desktop/mobile Browser/Playwright fallback QA while active RFQ quote, offer, release, and connector state stay unchanged.
  - `#493` refreshes the autonomous handoff after the non-CNC promoted quote release-readiness boundary slice.
  - `#492` adds a deterministic local release-readiness boundary for persisted non-CNC promoted quote application apply executions before future customer release, including CodeRabbit-requested UTC timestamp ordering and whitespace-fingerprint blocker coverage.
  - `#491` refreshes the autonomous handoff after the manual RFQ export download slice.
  - `#490` stabilizes new manual RFQ offer numbers as customer-ready `OFFER-M###` values and extends desktop/mobile manual RFQ-to-offer export coverage through copy, `.txt`, and real PDF downloads.
  - `#489` refreshes the autonomous handoff after the non-CNC mutation apply-history e2e slice.
  - `#488` adds deterministic desktop/mobile Playwright coverage for the existing guarded non-CNC mutation apply/history path, including exact local history counts and fixture keys while active RFQ quote, offer, and release state stay unchanged.
  - `#487` refreshes the autonomous handoff after the CAD preview fallback e2e slice.
  - `#486` adds deterministic desktop/mobile Playwright coverage for drawing/CAD-metadata fallback preview states without changing quote math or live parser/provider wiring.
  - `#485` adds deterministic desktop/mobile Playwright coverage for local email draft package and provider outcome read diagnostic exports in Integration health.
  - `#484` refreshes the autonomous handoff after the offer-read fallback diagnostic e2e slice.
  - `#483` extends the offer-read fallback smoke with copyable Integration health diagnostic exports for release execution, follow-up activity, and provider readiness read failures.
  - `#482` refreshes the autonomous handoff after the offer-read fallback e2e slice.
  - `#481` adds deterministic desktop/mobile Playwright coverage that optional Convex read failures for offer release execution, follow-up activity, and provider readiness keep local histories visible with fallback labels, Integration health retry actions, and no horizontal overflow.
  - `#480` refreshes the autonomous handoff after the provider outcome read-source UI slice.
  - `#479` surfaces the existing local-first provider outcome read-source state in the Offer provider outcome history panel, adds deterministic App coverage for local/Convex/fallback/pending source labels, and keeps live provider-side writes deferred.
  - `#478` refreshes the autonomous handoff after the email draft read-source UI slice.
  - `#477` surfaces the existing local-first email draft package read-source state in the Offer history panel, adds deterministic App coverage for local/Convex/fallback/pending source labels, and keeps live Gmail/Convex writes deferred.
  - `#476` refreshes the autonomous handoff after the provider outcome Integration health slice.
  - `#475` surfaces local-first provider outcome batch read-source state and recovery actions in Integration health without live provider/Convex writes.
  - `#474` refreshes the autonomous handoff after the email draft Integration health slice.
  - `#473` surfaces local-first email draft package read-source state and recovery actions in Integration health without live Gmail/Convex writes.
  - `#472` refreshes the autonomous handoff after the release execution Integration health slice.
  - `#471` surfaces release execution persisted-read source state and recovery actions in Integration health, backed by a deterministic read-sync helper plus App/domain and desktop/mobile Playwright coverage while live connector writes remain deferred.
  - `#470` refreshes the autonomous handoff after the follow-up activity Integration health slice.
  - `#469` surfaces follow-up activity persisted-read source state and recovery actions in Integration health, backed by a deterministic read-sync helper plus App/domain and desktop/mobile Playwright coverage while live connector writes remain deferred.
  - `#468` refreshes the autonomous handoff after the provider readiness Integration health slice.
  - `#467` surfaces provider-readiness persisted-read source state and recovery actions in Integration health, backed by a deterministic read-sync helper plus App/domain and desktop/mobile Playwright coverage while live connector writes remain deferred.
  - `#466` refreshes the autonomous handoff after the provider readiness read loading slice.
  - `#465` adds a compact pending/local/Convex/fallback read-source indicator to the Offer provider outcome readiness persistence panel, preserves replayed local readiness records while optional persisted reads are pending/fallback/empty, and adds deterministic App plus desktop/mobile Playwright coverage with Browser/Playwright fallback QA.
  - `#464` refreshes the autonomous handoff after the follow-up activity read loading slice.
  - `#463` adds a compact pending/local/Convex/fallback read-source indicator to the Offer follow-up activity reads panel, preserves replayed local follow-up activity history while optional persisted reads are pending/fallback/empty, and adds deterministic App plus desktop/mobile Playwright coverage with Browser/Playwright fallback QA.
  - `#462` refreshes the autonomous handoff after the offer release read loading slice.
  - `#461` adds a compact pending/local/Convex/fallback read-source indicator to the Offer release execution history panel plus desktop/mobile Playwright coverage proving pending optional Convex reads keep local release execution history visible, with Browser/Playwright fallback QA after Computer Use was blocked by the Codex app safety policy.
  - `#460` refreshes the autonomous handoff after the provider read loading e2e slice.
  - `#459` adds deterministic desktop/mobile Playwright coverage for pending provider-run reads while the optional Convex bridge is still loading, including Provider review and Integration health pending diagnostics, clipboard export assertions, no-overflow checks, and Browser/Playwright fallback QA after Computer Use was blocked by the Codex app safety policy.
  - `#458` refreshes the autonomous handoff after the calendar outcome read loading e2e slice.
  - `#457` adds deterministic desktop/mobile Playwright coverage for pending Calendar provider outcome reads while the optional Convex bridge is still loading, including Integration health recovery copy, diagnostic clipboard export, no-overflow checks, and Browser/Playwright fallback QA.
  - `#456` refreshes the autonomous handoff after the dense workspace accessibility e2e slice.
  - `#455` adds deterministic desktop/mobile Playwright accessibility smoke for dense workspace controls, including keyboard-operated queue filters, attachment disclosure, view tabs with `aria-pressed`, non-CNC selector state, and Browser/Playwright fallback QA.
  - `#454` refreshes the autonomous handoff after the non-CNC estimator-summary copy e2e slice.
  - `#453` adds deterministic desktop/mobile Playwright coverage for non-CNC estimator-summary copy, including clipboard content checks and Browser/Playwright fallback QA while active RFQ quote/offer/release state remains unchanged.
  - `#452` refreshes the autonomous handoff after the demo import review reload e2e slice.
  - `#451` adds deterministic desktop/mobile Playwright coverage that the demo seed import pre-write review remains ready after reload, with per-viewport clipboard setup and Browser/Playwright fallback QA.
  - `#450` refreshes the autonomous handoff after the RFQ sync import dedupe e2e slice.
  - `#449` adds deterministic desktop/mobile Playwright coverage that repeated RFQ syncs keep imported Gmail RFQs deduped in the queue after reload while connector activity history can still grow.
  - `#448` refreshes the autonomous handoff after the RFQ sync import reload e2e slice.
  - `#447` adds deterministic desktop/mobile Playwright coverage for reload-safe Gmail RFQ sync imports, including selected imported RFQ readiness/provenance checks and no-overflow validation.
  - `#446` refreshes the autonomous handoff after the workspace audit feed reload e2e slice.
  - `#445` adds deterministic desktop/mobile Playwright coverage for selected-RFQ workspace audit feed reload persistence after a ready-state workspace action, including clipboard export and no-overflow checks.
  - `#444` refreshes the autonomous handoff after the connector recovery reload e2e slice.
  - `#443` persists selected-RFQ connector sync snapshots in local workspace state and adds deterministic desktop/mobile Playwright coverage for restored stale/blocked connector recovery actions after reload.
  - `#442` refreshes the autonomous handoff after the calendar reschedule execution-history e2e slice.
  - `#441` adds deterministic desktop/mobile Playwright coverage and an operator copy action for calendar reschedule execution-history exports, including reload persistence and no-overflow checks.
  - `#440` refreshes the autonomous handoff after the calendar provider outcome history e2e slice.
  - `#439` adds deterministic desktop/mobile Playwright coverage for calendar provider outcome history cards, ready/read-source copy, clipboard export, reload persistence, and no-overflow checks.
  - `#438` refreshes the autonomous handoff after the offer provider outcome history e2e slice.
  - `#437` adds deterministic desktop/mobile Playwright coverage for offer provider outcome history batches, command summaries, reload persistence, and no-overflow checks.
  - `#436` refreshes the autonomous handoff after the offer email draft history e2e slice.
  - `#435` adds deterministic desktop/mobile Playwright coverage for offer email draft package history, provider-safe metrics, recipient readiness, reload persistence, and no-overflow checks.
  - `#434` refreshes the autonomous handoff after the workspace error-boundary e2e slice.
  - `#433` adds deterministic desktop/mobile Playwright coverage for workspace error-boundary recovery through a hidden one-shot render-failure fixture, reload recovery assertions, and Browser/Playwright fallback QA.
  - `#432` refreshes the autonomous handoff after the offer provider readiness e2e slice.
  - `#431` persists restored offer provider-readiness snapshots in local workspace state and adds deterministic desktop/mobile Playwright coverage for provider-readiness release execution reload history.
  - `#430` refreshes the autonomous handoff after the offer export download e2e slice.
  - `#429` adds deterministic desktop/mobile Playwright coverage for offer `.txt` and real PDF downloads, persistent export history after reload, and no-overflow checks.
  - `#428` refreshes the autonomous handoff after the release gate review persistence e2e slice.
  - `#427` adds deterministic desktop/mobile Playwright coverage for release-gate review reload persistence, ready release-plan transition, and no-overflow checks.
  - `#426` refreshes the autonomous handoff after the offer lifecycle persistence e2e slice.
  - `#425` adds deterministic desktop/mobile Playwright coverage for offer lifecycle reload persistence, follow-up completion, terminal declined-state guards, and no-overflow checks.
  - `#424` refreshes the autonomous handoff after the CAD review override e2e slice.
  - `#423` adds deterministic desktop/mobile Playwright coverage for CAD review override acknowledgement, reload persistence, reopen recovery, event history, and no-overflow checks.
  - `#422` refreshes the autonomous handoff after the calendar outcome read diagnostics e2e slice.
  - `#421` adds deterministic desktop/mobile Playwright coverage for Calendar outcome read fallback diagnostics, Integration health recovery copy, diagnostic clipboard export, and no-overflow checks.
  - `#420` refreshes the autonomous handoff after the provider-run filter e2e slice.
  - `#419` adds deterministic desktop/mobile Playwright coverage for Provider review history filters, warning/fallback/succeeded counts, failed/skipped empty states, redacted prompt text, and no-overflow checks.
  - `#418` refreshes the autonomous handoff after the offer reply state filter e2e slice.
  - `#417` adds deterministic desktop/mobile Playwright coverage for Offer reply state filters, applied/warning rows, empty fallback rows, fallback Integration health copy, and no-overflow checks.
  - `#416` refreshes the autonomous handoff after the restored follow-up readiness fallback e2e slice.
  - `#415` extends deterministic desktop/mobile Playwright coverage for restored stale follow-up readiness read/write fallback history after reload, including critical persistence status, filter, copy/export, and Browser/Playwright fallback QA.
  - `#414` refreshes the autonomous handoff after the follow-up readiness fallback e2e slice.
  - `#412` adds deterministic desktop/mobile Playwright coverage for follow-up readiness read fallback diagnostics, including persistence drill-down recovery, copy/export assertions, and Browser/Playwright fallback QA while live connector writes stay disabled.
  - `#411` refreshes the autonomous handoff after the provider-read fallback e2e slice.
  - `#410` adds deterministic desktop/mobile Playwright coverage for the provider-run read fallback diagnostics path, including Integration health copy/export assertions and Browser/Playwright fallback QA.
  - `#409` refreshes the autonomous handoff after the workspace audit feed export-domain slice.
  - `#408` moves the selected-RFQ audit-feed clipboard export into the deterministic domain helper layer with focused coverage.
  - `#407` refreshes the autonomous handoff after the workspace audit feed copy slice.
  - `#406` adds a deterministic copy/export action to the selected-RFQ workspace audit feed without live connector writes.
  - `#405` refreshes the autonomous handoff after the workspace audit feed UI slice.
  - `#404` surfaces selected-RFQ workspace audit feed visibility in Triage from existing deterministic local/provider/calendar records with desktop/mobile Playwright coverage.
  - `#403` refreshes the autonomous handoff after the demo import review UI slice.
  - `#402` surfaces the deterministic demo workspace import review in Integration health with desktop/mobile Playwright coverage and no import/workspace writes.
  - `#401` adds a deterministic ready/blocked pre-write review envelope for demo workspace seed imports before future import UI or live writes.
  - `#400` refreshes the autonomous handoff after the queue empty-state e2e slice.
  - `#399` adds deterministic desktop/mobile Playwright coverage for queue filter no-results recovery using local seeded workspace state.
  - `#398` was closed as superseded by `#399`.
  - `#397` refreshes the autonomous handoff after the non-CNC selector e2e slice.
  - `#396` adds deterministic desktop/mobile Playwright coverage for guarded non-CNC process preview selection across sheet metal, plastics, wire EDM, and fabrication.
  - `#395` refreshes the autonomous handoff after the manual RFQ validation e2e slice.
  - `#394` adds deterministic desktop/mobile Playwright coverage for manual RFQ due-date validation recovery, calendar draft surfacing, readiness warnings, and no-overflow checks.
  - `#393` refreshes the autonomous handoff after the manual RFQ offer export e2e slice.
  - `#392` broadens deterministic Playwright coverage for manual RFQ creation into queue selection plus Offer export copy controls on desktop and mobile.
  - `#391` refreshes the autonomous handoff after the follow-up history diagnostic copy-label slice.
  - `#390` makes Integration health persistence diagnostics explicitly advertise bundled readiness-history context when present.
  - `#389` refreshes the autonomous handoff after the follow-up history Integration health diagnostics slice.
  - `#388` adds readiness-history context to Integration health persistence diagnostics without live connector writes.
  - `#387` refreshes the autonomous handoff after the follow-up readiness history export slice.
  - `#386` adds a deterministic follow-up readiness history export/copy path without live connector writes.
  - `#385` refreshes the autonomous handoff after the follow-up readiness Integration health diagnostics slice.
  - `#384` makes the Integration health follow-up readiness persisted-read summary copyable without live connector writes.
  - `#383` refreshes the autonomous handoff after the follow-up readiness Integration health slice.
  - `#382` surfaces the deterministic follow-up readiness persisted-read model in Integration health without live connector writes.
  - `#381` adds a deterministic follow-up readiness persisted-read diagnostic export/copy path in the Offer readiness history panel.
  - `#380` refreshes the autonomous handoff after the calendar outcome read diagnostics slice.
  - `#379` adds copyable Calendar outcome read diagnostics in Integration health while live Calendar writes remain deferred.
  - `#378` refreshes the autonomous handoff after the calendar outcome read recovery-actions slice.
  - `#377` adds Convex/local/pending/fallback next-action guidance for calendar provider outcome reads in Integration health while live Calendar writes remain deferred.
  - `#376` refreshes the autonomous handoff after the calendar provider outcome read-source Integration health slice.
  - `#375` surfaces calendar provider outcome read-source/fallback health in Integration health while live Calendar writes remain deferred.
  - `#374` refreshes the autonomous handoff after the calendar provider read-sync status slice.
  - `#373` surfaces deterministic local/Convex/fallback read-source status copy and batch counts in the calendar provider outcome history panel while live Calendar writes remain deferred.
  - `#372` refreshes the autonomous handoff after the calendar provider outcome read hydration slice.
  - `#371` hydrates the calendar provider outcome history panel through the optional browser Convex read bridge while keeping local fallback authoritative and provider execution deferred.
  - `#370` adds deterministic local/Convex-style read adapters for calendar provider outcome histories with local fallback, filtered reads, query validation, and clone-safe snapshots.
  - `#369` refreshes the autonomous handoff after the calendar provider outcome history UI slice.
  - `#368` surfaces the deterministic calendar provider outcome history summary/export copy in the existing calendar follow-up status panel with Browser/Playwright QA fallback evidence.
  - `#367` refreshes the autonomous handoff after the calendar provider outcome history summary slice.
  - `#366` adds deterministic calendar provider outcome history summaries/export copy for persisted local provider outcome batches, including restored-record counter validation and distinct empty-batch copy after CodeRabbit review.
  - `#365` refreshes the autonomous handoff after the calendar provider outcome persistence slice.
  - `#364` adds deterministic local persistence snapshots for calendar reschedule provider outcomes, including seeded-record validation, dedupe, clone safety, and read-model status aggregates.
  - `#363` refreshes the autonomous handoff after the calendar reschedule provider outcome UI slice.
  - `#362` surfaces the local/mock calendar provider-outcome read model in the existing follow-up panel with Browser/Playwright QA fallback evidence; CodeRabbit tool warnings and Greptile trial blockers were recorded as nonblocking.
  - `#361` refreshes the autonomous handoff after the calendar reschedule provider outcome read-model slice.
  - `#360` adds a deterministic calendar reschedule provider outcome read-model boundary for local/mock outcomes before UI wiring; CodeRabbit quota and Greptile trial blockers were recorded as nonblocking.
  - `#359` refreshes the autonomous handoff after the calendar reschedule provider outcome adapter slice.
  - `#358` adds deterministic local/mock calendar reschedule provider outcomes for reviewed commands while keeping real Calendar writes behind provider boundaries; CodeRabbit quota and Greptile trial blockers were recorded as nonblocking.
  - `#357` refreshes the autonomous handoff after the calendar reschedule execution history UI slice.
  - `#356` surfaces deterministic calendar reschedule execution history summaries in the existing calendar follow-up status panel, with Browser/Playwright QA fallback evidence.
  - `#355` adds deterministic calendar reschedule execution history summaries/export copy, including a CodeRabbit follow-up fix to derive status/actions from the sorted latest run.
  - `#354` refreshes the autonomous handoff after the calendar reschedule execution read-model UI slice.
  - `#353` surfaces the calendar reschedule execution read model in the existing follow-up status panel as a dry-run-only operator status card, with Browser/Playwright QA fallback evidence.
  - `#352` refreshes the autonomous handoff after the calendar reschedule execution read-model slice.
  - `#351` adds deterministic operator read-model copy/status for persisted calendar follow-up reschedule execution histories before UI/provider wiring.
  - `#350` refreshes the autonomous handoff after the calendar reschedule execution persistence slice.
  - `#349` adds deterministic local persistence snapshots for calendar follow-up reschedule execution audit records, including seeded-record validation, dedupe, clone safety, and command/RFQ/task consistency checks.
  - `#348` refreshes the autonomous handoff after the calendar reschedule execution audit slice.
  - `#347` adds deterministic dry-run/commit execution audit rows for calendar follow-up reschedule plans, including mixed blocked/created handling before live provider execution.
  - `#346` refreshes the autonomous handoff after the calendar reschedule read-model UI slice.
  - `#345` surfaces deterministic calendar follow-up reschedule read-model status, metrics, and next actions in the existing calendar follow-up panel with Browser/Playwright QA fallback evidence.
  - `#344` adds deterministic operator read-model copy/status/actions for persisted calendar follow-up reschedule plan histories.
  - `#343` refreshes the autonomous handoff after the calendar follow-up reschedule persistence slice.
  - `#342` adds deterministic local persistence snapshots for calendar follow-up reschedule plans, including seeded-record validation, dedupe, cloning, and history summaries.
  - `#341` adds a deterministic provider-safe calendar follow-up reschedule command planning boundary while keeping live calendar execution deferred.
  - `#340` refreshes the autonomous handoff after the calendar follow-up reschedule preview slice.
  - `#339` adds deterministic calendar follow-up reschedule-ready/blocked previews for overdue review holds and terminal cancelled holds with desktop/mobile Playwright QA fallback evidence.
  - `#338` refreshes the autonomous handoff after the cross-RFQ connector history slice.
  - `#337` adds deterministic cross-RFQ connector history in the Integration health connector drill-down with desktop/mobile Playwright QA fallback evidence.
  - `#336` refreshes the autonomous handoff after the connector stale-link recovery slice.
  - `#335` adds deterministic stale/blocked connector link recovery actions in the Integration health connector drill-down while keeping healthy RFQ sync unchanged.
  - `#334` refreshes the autonomous handoff after the follow-up readiness read-model UI slice.
  - `#333` surfaces the deterministic follow-up readiness read model in the Offer activity readiness history panel with Browser/Playwright QA fallback evidence.
  - `#332` adds the deterministic follow-up readiness read-model boundary that decides persisted-read ready/pending/partial/review/fallback state from history, sync source, and sync-health summaries.
  - `#331` refreshes the autonomous handoff after the Convex installer opt-in Integration health slice.
  - `#330` wires the guarded installer decision into the existing read-only Integration health Convex install row while local fallback remains the default.
  - `#329` adds the deterministic guarded browser bridge installer decision boundary before any live Convex client or `ConvexProvider` wiring.
  - `#328` surfaces the deterministic guarded browser bridge install plan in Integration health and suppresses overlapping raw runtime/bridge rows when the aggregate plan is present.
  - `#327` adds a deterministic guarded browser bridge install plan before any first-class Convex client wiring.
  - `#326` surfaces deterministic public Convex browser runtime URL readiness in Integration health without changing fallback behavior.
  - `#325` adds deterministic public Convex browser runtime URL probing before any first-class client wiring.
  - `#324` extracts optional browser bridge ID-map counting and lookup normalization into focused workspace domain helpers.
  - `#323` normalizes optional browser bridge local-to-Convex ID map reads before any query or mutation adapter consumes them.
  - `#322` adds deterministic browser bridge identity-map readiness to the optional Convex bridge health surface.
  - `#321` adds a deterministic browser bridge probe adapter on top of the new Convex bridge health domain helper.
  - `#320` extracts deterministic Convex bridge capability health summarization into a focused domain helper.
  - `#319` includes bridge recovery actions in the copied diagnostic export.
  - `#318` adds a copyable Convex bridge capability diagnostic export in Integration health.
  - `#317` adds deterministic recovery actions for partial or missing Convex bridge capabilities.
  - `#316` surfaces configured/missing Convex bridge capabilities inside Integration health.
  - `#315` surfaces optional browser Convex bridge capability health in Integration health so local fallback remains explicit when no browser bridge is configured.
  - `#314` adds compact recent provider-read diagnostic records to Provider review and Integration health.
  - `#313` adds deterministic provider-read diagnostic next-action items in Provider review and Integration health.
  - `#312` makes the Integration health provider-run diagnostics export copyable and adds deterministic selected-RFQ copy/status feedback.
  - `#311` surfaces selected-RFQ provider-read diagnostic status, summary, severity, and recovery copy in Integration health.
  - `#310` adds a deterministic copy action and status feedback for selected-RFQ provider-run diagnostic exports.
  - `#309` surfaces deterministic provider-run read diagnostics/export copy in the Provider review panel.
  - `#308` adds deterministic provider-run read history diagnostics/export copy for operator review.
  - `#307` adds deterministic local persistence snapshots for provider-run read history records.
  - `#306` adds deterministic provider-run read history summaries for future persisted read-health surfaces.
  - `#305` consolidates Provider review and Integration health provider-read sync copy/state behind one deterministic provider-domain helper.
  - `#304` feeds selected-RFQ provider-run read source/fallback state into the broader Integration health summary.
  - `#303` surfaces selected-RFQ provider-run read source/fallback health in the Provider review panel with Convex/local/fallback copy.
  - `#302` hydrates selected-RFQ terminal provider runs through the optional browser Convex bridge and keeps persisted records authoritative over local fallback collisions.
  - `#301` hydrates completed Convex provider-run records into deterministic local audit history with query fallback behavior.
  - `#300` adds a copyable follow-up readiness sync-health diagnostic summary with fallback counts, recency, recovery actions, and retained event IDs.
  - `#299` shows how many older fallback events are hidden when the filtered sync fallback list is capped at six rows.
  - `#298` shows an explicit empty state when a selected read/write fallback filter has no events.
  - `#297` surfaces deterministic newest-first recent fallback events in the Offer sync-health drill-down with All/Read/Write filters.
  - `#296` adds a guarded Review action to the topbar persistence chip so warning/critical fallback health routes operators to the detailed Offer sync panels.
  - `#295` surfaces warning/critical follow-up readiness persistence health in the always-visible topbar persistence chip and keeps generic sync fallback severity aligned with the displayed fallback count.
  - `#294` surfaces warning/critical follow-up readiness persistence health in the Integration health panel so stale fallback history is visible without drilling into the Offer history card.
  - `#293` derives healthy/warning/critical follow-up readiness sync-health severity from fallback status and recency, then surfaces it in the Offer workspace sync-health panel.
  - `#292` adds deterministic operator summary copy for healthy/current/stale follow-up readiness sync-health fallback states and surfaces it in the Offer workspace.
  - `#291` adds injected-clock current/stale recency to follow-up readiness sync-health summaries and surfaces fallback recency in the Offer workspace.
  - `#290` adds deterministic read/write recovery actions to follow-up readiness sync-health summaries and surfaces them in the Offer workspace fallback panel.
  - `#289` classifies follow-up readiness sync-health fallback state as healthy, read fallback, write fallback, or read/write fallback and surfaces operation-specific labels in the Offer workspace.
  - `#288` exposes separate latest read and latest write fallback events in the deterministic follow-up readiness sync-health summary and Offer workspace panel.
  - `#287` applies the existing 12-event sync-health retention limit to restored local workspace state so stale fallback histories cannot grow unbounded after reload.
  - `#286` seeds the global persistence fallback count from restored follow-up readiness sync-health events so the top-level persistence chip and Integration health panel stay consistent after reload.
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
- Offer builder, offer document content, export fixtures, offer lifecycle, release plan, guarded email draft package descriptors, local email draft package persistence snapshots, email draft package history summaries and UI surface, local/mock email draft provider outcomes, provider-backed release command outcome helpers, local provider outcome batch persistence and history summaries/UI surface, provider outcome readiness gates/workspace execution gate/Convex payloads/workflow persistence/client adapter/runtime bridge/operator-visible snapshot UI/persisted-read adapter/runtime hydration, release execution audit/history/fingerprints plus persisted-read adapter/runtime hydration, and follow-up activity read adapters with runtime hydration plus duplicate-safe write planning/release dedupe/manual dedupe/readiness metadata/workspace panel/history summaries/local persistence/readiness-history UI/local-state persistence/unique manual follow-up audit keys/restored-action readiness replay/Convex readiness payload contracts/workflow persistence/client adapter/runtime bridge, operator-visible sync-source summaries, scoped sync-health fallback visibility, read/write fallback history details, reload-safe sync-health replay, global fallback indicator alignment, restored sync-health retention capping, per-operation latest fallback visibility, per-operation sync-health status labels, sync-health recovery actions, fallback recency state, sync-health operator summaries, sync-health severity labels, deterministic readiness read-model decisions, operator-visible readiness read-model UI, and Integration health surfacing for warning/critical sync-health fallback state.
- Gmail offer reply ingestion and persistence that maps accepted, declined, acknowledgement, and follow-up signals into deterministic offer state.
- Calendar planning for RFQ due holds and offer follow-ups behind adapter boundaries, including local/mock provider outcomes, read-model copy/status, operator-visible provider outcome cards, local provider outcome persistence snapshots, provider outcome history summaries/export copy, operator-visible history card/export copy, local/Convex-style provider outcome read adapters, optional browser-bridge hydration, operator-visible read-source status copy, Integration health surfacing for reviewed reschedule command outcome reads, and deterministic recovery actions plus desktop/mobile coverage for Convex/local/pending/fallback outcome reads while live Calendar writes remain deferred.
- Provider adapter boundaries for mock/local/provider AI work, with Convex-backed provider run audit records, query APIs, optional browser runtime read hydration for selected-RFQ terminal provider runs, operator-visible provider-run read sync health in Provider review and Integration health, deterministic provider-run read history summaries, local persistence snapshots for those read-history records, operator diagnostics/export copy for that persisted read-health trail, Provider review UI surfaces for reading/copying fallback/loading diagnostics, Integration health diagnostic status/recovery/export copy, provider-read diagnostic next-action items, optional browser Convex bridge probe health for configured refs and local identity maps, and guarded browser bridge install-plan visibility.
- CAD-like attachment preview models, CAD metadata and geometry descriptor adapter boundaries, review state, manufacturability flags, deterministic preview/thumbnail labels, viewport metadata cards, compact thumbnail cards, metadata-derived geometry preview output contracts, geometry preview UI rendering, geometry review summary checks and UI surfaces, persisted CAD action context, and boundary-aware CAD metadata matching.
- React workspace surfaces for quote queue, workload, capacity, material/outside service planning, provider review filters, CAD metadata review, integration health, connector link drill-downs with cross-RFQ history and stale-link recovery actions, calendar plan previews, calendar follow-up status with execution read-model/history summaries/provider outcome read-source state, offer reply state, release execution history, audit visibility, and dense-control accessibility smoke.

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
   - Read-only non-CNC registry demos now show a guarded process selector, best-price/fastest-lead badges, selected-vs-best summary, quote breakdowns, assumptions, review flags, operator checklist, input-readiness groups, planned input fields, read-only fixture draft values, selector draft coverage, promotion blockers, adapter readiness, preview-only edit controls for sheet-metal/plastics/wire-EDM/fabrication, offer handoff/readiness, deterministic promotion plan contract/panel, local promotion-plan persistence records/snapshot, deterministic promotion action summaries, ready-only promotion draft payloads, canonical command packages, command-package UI, execution audit records, copyable execution summary, surfaced execution audit UI, local execution persistence snapshots, execution history UI, deterministic outcome drafts, outcome draft UI, reviewed-outcome commit-plan UI, local outcome commit persistence, outcome commit history UI, a deterministic promoted quote read model surfaced in the workspace, a deterministic application-plan boundary surfaced in the workspace, local application-plan persistence snapshots surfaced in the workspace, deterministic application execution audit records, workspace-visible application execution audits, local application execution persistence snapshots, application execution history UI, deterministic application execution outcome drafts, application execution outcome draft UI, application outcome commit plans, application outcome commit-plan UI, local application outcome commit persistence, application outcome commit history UI, deterministic application outcome commit read models, deterministic application mutation package descriptors, operator-visible mutation package review surfaces, deterministic mutation package execution audits, local mutation execution persistence snapshots, operator-visible mutation execution history, deterministic mutation execution outcome drafts, operator-visible mutation execution outcome draft review UI, deterministic mutation outcome commit plans/runs, operator-visible mutation outcome commit-plan UI, local mutation outcome commit persistence snapshots, operator-visible mutation outcome commit history, deterministic mutation outcome commit read models, operator-visible mutation outcome commit read-model surfaces, deterministic mutation apply-plan descriptors, operator-visible mutation apply-plan surfaces, local mutation apply-plan persistence snapshots, operator-visible mutation apply-plan history, deterministic mutation apply execution audit records, operator-visible mutation apply execution audits, local mutation apply execution persistence snapshots, operator-visible mutation apply execution history, and an operator-visible deterministic release-readiness card for persisted successful mutation apply executions plus a deterministic offer-wiring readiness boundary for future customer-offer adapters. The active RFQ quote, offer, and release state still remain unchanged until a later adapter applies the package. After this, all non-CNC engines need live offer creation and release adapter integration.
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
   - `#249` adds a local/mock email draft provider adapter that returns release command outcomes without calling Gmail.

6. Production hardening pass.
   - Add loading/error/empty states for persisted workspace reads.
   - Extend accessibility checks beyond the first dense-control keyboard/ARIA smoke into any newly added dense operator surfaces.
   - Keep screenshots or Playwright artifacts out of git unless intentionally documenting visual baselines.

## Review Notes

- CodeRabbit comments have been useful and should be treated as actionable unless clearly irrelevant.
- Greptile quota-only comments are not actionable.
- Keep PRs narrow so reviewers can reason about them.
- Update `ROADMAP.md` when a slice changes product status or moves a next-slice item into the implemented foundation.
- Keep this handoff file current enough that another machine can resume without reading the entire Codex thread history.
