# FactoryBid OS Roadmap

FactoryBid OS is a production-grade automatic tarjouslaskenta system for factories. Core quote math stays deterministic, testable, and usable without AI; AI and external services sit behind explicit provider adapters with local/mock fallbacks.

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

## Near-Term PR Slices

- Convex schema and local generation workflow.
- RFQ intake data types, fixtures, and deterministic parser scaffold.
- First CNC quote calculator with unit-test fixtures.
- Quote workspace shell using shadcn/ui primitives.
- Offer builder data model and plain-text export.
- Provider adapter interface with mock and local fallbacks.
