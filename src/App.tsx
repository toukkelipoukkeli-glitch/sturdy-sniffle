import { useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Cuboid,
  FileText,
  GitCompareArrows,
  Inbox,
  Layers3,
  Mail,
  PackageCheck,
  PanelRight,
  RefreshCw,
  Ruler,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"

import { Button } from "./components/ui/button"
import type { CadMetadataResult } from "./domain/integrations/cadMetadata"
import {
  createGmailOfferReplyAdapter,
  type GmailOfferReplySyncResult,
} from "./domain/integrations/gmailOfferReply"
import { createMockGmailRfqProvider, type GmailRfqMessage } from "./domain/integrations/gmailRfq"
import { buildCncOfferDraft, renderOfferText, type OfferDraft } from "./domain/offers/offer"
import { hashProviderInput, type ProviderRunRequest, type ProviderRunResult } from "./domain/providers/ai"
import { buildProviderRunAudit, type ProviderRunAudit } from "./domain/providers/providerRunAudit"
import { calculateCncQuote, type CncQuoteInput, type CncQuoteResult } from "./domain/quoting/cnc"
import type { QuoteProcessKey } from "./domain/quoting/registry"
import type { RfqAttachmentDraft, RfqPartDraft } from "./domain/rfq/intake"
import { buildPartPreviewModel, type PartPreviewModel, type PartPreviewMode } from "./domain/viewer/partPreview"
import {
  compareQuoteScenarios,
  type QuoteComparisonResult,
  type QuoteComparisonScenario,
} from "./domain/workspace/quoteComparison"
import { rankQuoteQueue, type QuoteQueueStatus, type RankedQuoteQueueItem } from "./domain/workspace/quoteQueue"
import { summarizeProcessWorkload, type ProcessWorkloadSummary } from "./domain/workspace/processWorkload"
import { buildWorkspaceAction, type WorkspaceActionRecord } from "./domain/workspace/workspaceActions"
import { createLocalWorkspacePersistence, type WorkspacePersistenceSnapshot } from "./domain/workspace/workspacePersistence"
import "./App.css"

type WorkspaceView = "triage" | "costing" | "offer"

interface QuoteEditState {
  cycleMinutes: number
  quantity: number
  rush: boolean
  setupMinutes: number
}

interface QuoteWorkItem {
  id: string
  customer: string
  contact: string
  subject: string
  received: string
  receivedAt: string
  due: string
  dueAt: string
  priority: "normal" | "rush"
  status: Extract<QuoteQueueStatus, "new" | "triage" | "estimating" | "ready">
  source: "gmail" | "manual" | "import"
  tags: string[]
  quoteInput: CncQuoteInput
  attachments: RfqAttachmentDraft[]
  cadMetadata: CadMetadataResult[]
  notes: string[]
  providerRuns: ProviderRunAudit[]
}

const workItems: QuoteWorkItem[] = [
  {
    id: "rfq-204",
    customer: "North Forge",
    contact: "Sari Virtanen",
    subject: "CNC bracket FB-204-A",
    received: "Today 08:30",
    receivedAt: "2026-06-20T08:30:00+03:00",
    due: "Jun 30",
    dueAt: "2026-06-30T15:00:00+03:00",
    priority: "normal",
    status: "estimating",
    source: "gmail",
    tags: ["CNC milling", "Al 6082", "ISO 2768-M"],
    attachments: [
      {
        fileName: "FB-204-A.step",
        kind: "cad",
        contentType: "model/step",
        sizeBytes: 245760,
      },
      {
        fileName: "FB-204-A.pdf",
        kind: "drawing",
        contentType: "application/pdf",
        sizeBytes: 98304,
      },
    ],
    cadMetadata: [
      buildCadMetadataResult({
        dimensions: { heightMm: 6, lengthMm: 120, widthMm: 80 },
        fileName: "FB-204-A.step",
        format: "step",
        materialText: "Aluminum 6082",
        previewKind: "cad",
        process: "cnc_milling",
      }),
    ],
    notes: ["STEP and drawing attached", "Customer asked for 25 pcs", "Deburr included"],
    providerRuns: [
      buildSampleProviderAudit({
        completedAt: "2026-06-20T08:30:04+03:00",
        metadata: { deterministic: true, fallbackReason: "Provider gemini is not configured; used mock fallback." },
        outputSummary: "Detected CNC milling RFQ, 25 pcs, aluminum 6082, STEP and drawing attached.",
        preferredProvider: "gemini",
        prompt:
          "Extract RFQ fields from buyer@example.test. API key sk-localfixture12345 appears in a test fixture and must be redacted.",
        purpose: "extract",
        resultProvider: "mock",
        startedAt: "2026-06-20T08:30:01+03:00",
        status: "succeeded",
        trace: { quoteId: "quote-204", rfqId: "rfq-204" },
        warnings: ["Provider gemini is not configured; used mock fallback.", "Mock provider output; no external AI service was called."],
      }),
      buildSampleProviderAudit({
        completedAt: "2026-06-20T08:31:02+03:00",
        metadata: { deterministic: true },
        outputSummary: "Summarized customer constraints and highlighted deburr requirement for estimator review.",
        prompt: "Summarize RFQ notes for North Forge using only local workspace context.",
        purpose: "summarize",
        startedAt: "2026-06-20T08:31:00+03:00",
        status: "succeeded",
        trace: { quoteId: "quote-204", rfqId: "rfq-204" },
        warnings: ["Mock provider output; no external AI service was called."],
      }),
    ],
    quoteInput: {
      partNumber: "FB-204-A",
      process: "cnc_milling",
      quantity: 25,
      priority: "normal",
      material: {
        name: "Aluminum 6082",
        densityKgM3: 2700,
        costCentsPerKg: 520,
        yieldFactor: 1.12,
      },
      machine: {
        name: "Haas VF-2",
        hourlyRateCents: 8500,
        setupRateCents: 7000,
        capacityMinutesPerDay: 420,
      },
      rateCard: {
        currency: "EUR",
        setupMinimumCents: 12000,
        minimumOrderCents: 15000,
        marginPercent: 28,
        rushMultiplier: 1.4,
        baseLeadTimeDays: 7,
        rushLeadTimeDays: 4,
      },
      stockDimensions: {
        lengthMm: 120,
        widthMm: 80,
        heightMm: 10,
      },
      finishedDimensions: {
        lengthMm: 110,
        widthMm: 70,
        heightMm: 8,
      },
      operation: {
        setupMinutes: 45,
        programmingMinutes: 30,
        fixtureMinutes: 15,
        cycleMinutesPerPart: 18.5,
        inspectionMinutesPerPart: 1.5,
        consumableCentsPerPart: 180,
      },
      toleranceClass: "ISO 2768-M",
      finish: "Deburred",
    },
  },
  {
    id: "rfq-019",
    customer: "Baltic Hydraulics",
    contact: "Mikael Laine",
    subject: "Turned spacer FB-TURN-019",
    received: "Yesterday 15:44",
    receivedAt: "2026-06-19T15:44:00+03:00",
    due: "Jun 24",
    dueAt: "2026-06-24T09:00:00+03:00",
    priority: "rush",
    status: "triage",
    source: "gmail",
    tags: ["CNC turning", "316L", "+/- 0.05 mm"],
    attachments: [
      {
        fileName: "FB-TURN-019.pdf",
        kind: "drawing",
        contentType: "application/pdf",
        sizeBytes: 112640,
      },
      {
        fileName: "passivation-note.txt",
        kind: "other",
        contentType: "text/plain",
        sizeBytes: 4096,
      },
    ],
    cadMetadata: [
      buildCadMetadataResult({
        dimensions: { lengthMm: 70 },
        fileName: "FB-TURN-019.pdf",
        format: "pdf",
        materialText: "Stainless steel 316L",
        metadataOnly: true,
        previewKind: "drawing",
        process: "cnc_turning",
        provider: "metadata_fallback",
        status: "fallback",
        warnings: ["CAD parser unavailable; using attachment and RFQ metadata only."],
      }),
    ],
    notes: ["Rush lead time requested", "Passivation needed", "Small quantity triggers minimum"],
    providerRuns: [
      buildSampleProviderAudit({
        completedAt: "2026-06-19T15:44:03+03:00",
        errorMessage: "Local Codex invoker is not configured.",
        metadata: { deterministic: true, fallbackReason: "Provider local_codex returned skipped; used mock fallback." },
        outputSummary: "Rush turned spacer RFQ with passivation outside service and minimum-order risk.",
        preferredProvider: "local_codex",
        prompt: "Summarize urgent RFQ from mikael@example.test for estimator queue.",
        purpose: "summarize",
        resultProvider: "mock",
        startedAt: "2026-06-19T15:44:00+03:00",
        status: "succeeded",
        trace: { quoteId: "quote-019", rfqId: "rfq-019" },
        warnings: ["Provider local_codex returned skipped; used mock fallback.", "Mock provider output; no external AI service was called."],
      }),
    ],
    quoteInput: {
      partNumber: "FB-TURN-019",
      process: "cnc_turning",
      quantity: 1,
      priority: "rush",
      material: {
        name: "Stainless steel 316L",
        densityKgM3: 8000,
        costCentsPerKg: 640,
        yieldFactor: 1.08,
      },
      machine: {
        name: "Mazak Quick Turn",
        hourlyRateCents: 9200,
        setupRateCents: 7600,
        capacityMinutesPerDay: 390,
      },
      rateCard: {
        currency: "EUR",
        setupMinimumCents: 9000,
        minimumOrderCents: 50000,
        marginPercent: 25,
        rushMultiplier: 1.5,
        baseLeadTimeDays: 8,
        rushLeadTimeDays: 3,
      },
      stockDimensions: {
        diameterMm: 40,
        lengthMm: 80,
      },
      finishedDimensions: {
        diameterMm: 32,
        lengthMm: 70,
      },
      operation: {
        setupMinutes: 30,
        programmingMinutes: 15,
        cycleMinutesPerPart: 22,
        inspectionMinutesPerPart: 4,
        consumableCentsPerPart: 350,
        outsideServices: [{ label: "Passivation", amountCents: 4500 }],
      },
      toleranceClass: "+/- 0.05 mm",
      finish: "Passivated",
    },
  },
  {
    id: "rfq-331",
    customer: "Arctic Instruments",
    contact: "Leena Korhonen",
    subject: "Prototype sensor housing",
    received: "Jun 17 10:12",
    receivedAt: "2026-06-17T10:12:00+03:00",
    due: "Jul 02",
    dueAt: "2026-07-02T12:00:00+03:00",
    priority: "normal",
    status: "new",
    source: "import",
    tags: ["CNC milling", "Al 7075", "Prototype"],
    attachments: [
      {
        fileName: "AI-331-B-revB.pdf",
        kind: "drawing",
        contentType: "application/pdf",
        sizeBytes: 178240,
      },
    ],
    cadMetadata: [
      buildCadMetadataResult({
        dimensions: { heightMm: 22, lengthMm: 135, widthMm: 78 },
        fileName: "AI-331-B-revB.pdf",
        format: "pdf",
        materialText: "Aluminum 7075",
        metadataOnly: true,
        previewKind: "drawing",
        process: "cnc_milling",
        provider: "metadata_fallback",
        status: "fallback",
        warnings: ["CAD parser unavailable; using attachment and RFQ metadata only."],
      }),
    ],
    notes: ["Imported from shared folder", "Material substitution allowed", "Revision B drawing"],
    providerRuns: [
      buildSampleProviderAudit({
        completedAt: "2026-06-17T10:12:02+03:00",
        errorMessage: "Tavily scout quota exhausted for fixture run.",
        metadata: { retryable: false },
        preferredProvider: "tavily",
        prompt: "Scout comparable prototype housing risks for leena@example.test.",
        purpose: "scout",
        startedAt: "2026-06-17T10:12:00+03:00",
        status: "failed",
        trace: { quoteId: "quote-331", rfqId: "rfq-331" },
        warnings: ["External scout provider unavailable; keep deterministic quote workflow unblocked."],
      }),
    ],
    quoteInput: {
      partNumber: "AI-331-B",
      process: "cnc_milling",
      quantity: 8,
      priority: "normal",
      material: {
        name: "Aluminum 7075",
        densityKgM3: 2810,
        costCentsPerKg: 780,
        yieldFactor: 1.18,
      },
      machine: {
        name: "DMG Mori CMX",
        hourlyRateCents: 9800,
        setupRateCents: 7600,
        capacityMinutesPerDay: 420,
      },
      rateCard: {
        currency: "EUR",
        setupMinimumCents: 14000,
        minimumOrderCents: 24000,
        marginPercent: 32,
        rushMultiplier: 1.45,
        baseLeadTimeDays: 10,
        rushLeadTimeDays: 6,
      },
      stockDimensions: {
        lengthMm: 160,
        widthMm: 95,
        heightMm: 35,
      },
      finishedDimensions: {
        lengthMm: 135,
        widthMm: 78,
        heightMm: 22,
      },
      operation: {
        setupMinutes: 70,
        programmingMinutes: 55,
        fixtureMinutes: 25,
        cycleMinutesPerPart: 42,
        inspectionMinutesPerPart: 6,
        consumableCentsPerPart: 520,
        complexityMultiplier: 1.15,
      },
      toleranceClass: "+/- 0.10 mm",
      finish: "Tumbled",
    },
  },
]

function App() {
  const [selectedId, setSelectedId] = useState(workItems[0].id)
  const [activeView, setActiveView] = useState<WorkspaceView>("costing")
  const [actionsById, setActionsById] = useState<Record<string, WorkspaceActionRecord[]>>({})
  const [editsById, setEditsById] = useState<Record<string, QuoteEditState>>({})
  const [handoffDraftById, setHandoffDraftById] = useState<Record<string, string>>({})
  const [offerRepliesById, setOfferRepliesById] = useState<Record<string, GmailOfferReplySyncResult>>({})
  const [statusById, setStatusById] = useState<Record<string, QuoteQueueStatus>>({})
  const [workspacePersistence] = useState(() => createLocalWorkspacePersistence())
  const [queueNow] = useState(() => new Date().toISOString())
  const selectedItem = workItems.find((item) => item.id === selectedId) ?? workItems[0]
  const selectedActions = actionsById[selectedId] ?? []
  const selectedEdit = editsById[selectedId] ?? defaultEditState(selectedItem)
  const selectedStatus = statusById[selectedId] ?? selectedItem.status
  const handoffDraft = handoffDraftById[selectedId] ?? ""
  const { cycleMinutes, quantity, rush, setupMinutes } = selectedEdit
  const updateSelectedEdit = (patch: Partial<QuoteEditState>) => {
    setEditsById((current) => ({
      ...current,
      [selectedId]: {
        ...defaultEditState(selectedItem),
        ...current[selectedId],
        ...patch,
      },
    }))
  }

  const quoteInput = useMemo<CncQuoteInput>(() => applyQuoteEdit(selectedItem, selectedEdit), [selectedEdit, selectedItem])
  const quote = useMemo(() => calculateCncQuote(quoteInput), [quoteInput])
  const rankedQueue = useMemo(() => {
    const queueInputs = workItems.map((item) => {
      const itemQuoteInput = applyQuoteEdit(item, editsById[item.id] ?? defaultEditState(item))
      const itemQuote = calculateCncQuote(itemQuoteInput)
      const itemStatus = statusById[item.id] ?? item.status
      return {
        id: item.id,
        customerName: item.customer,
        subject: item.subject,
        dueAt: item.dueAt,
        priority: item.priority,
        process: item.quoteInput.process,
        receivedAt: item.receivedAt,
        status: itemStatus,
        estimatedValueCents: itemQuote.totalCents,
      }
    })
    return rankQuoteQueue(queueInputs, { now: queueNow })
  }, [editsById, queueNow, statusById])
  const workloadSummary = useMemo(
    () =>
      summarizeProcessWorkload({
        items: rankedQueue,
        now: queueNow,
        topItemLimit: 2,
      }),
    [queueNow, rankedQueue],
  )
  const selectedQueueItem = rankedQueue.find((item) => item.id === selectedId) ?? rankedQueue[0]
  const scenarioComparison = useMemo(
    () => compareQuoteScenarios(buildScenarioComparisonInputs(selectedItem.quoteInput, quoteInput, quote)),
    [quote, quoteInput, selectedItem],
  )
  const partPreview = useMemo(
    () =>
      buildPartPreviewModel({
        attachments: selectedItem.attachments,
        cadMetadata: selectedItem.cadMetadata,
        part: partDraftForQuoteInput(quoteInput, selectedItem.attachments),
        subject: selectedItem.subject,
      }),
    [quoteInput, selectedItem],
  )
  const offer = useMemo(
    () =>
      buildCncOfferDraft({
        offerNumber: offerNumberFor(selectedItem),
        customer: {
          name: selectedItem.customer,
          contactName: selectedItem.contact,
        },
        issuedAt: "2026-06-19",
        validUntil: "2026-07-03",
        lineDescription: selectedItem.subject,
        notes: selectedItem.notes,
        quote,
        rfqReference: selectedItem.id,
        subject: selectedItem.subject,
      }),
    [quote, selectedItem],
  )
  const offerReplySync = offerRepliesById[selectedId]
  const syncOfferReplies = async () => {
    const adapter = createGmailOfferReplyAdapter({
      fallbackProvider: createMockGmailRfqProvider({ messages: buildOfferReplyMessages(selectedItem, offer) }),
      provider: createMockGmailRfqProvider({ shouldFail: true }),
    })
    const result = await adapter.sync({
      followUpTaskIds: [`follow-up-${selectedItem.id}`],
      maxResults: 5,
      offerNumber: offer.offerNumber,
      query: `offer ${offer.offerNumber}`,
    })
    setOfferRepliesById((current) => ({ ...current, [selectedId]: result }))
  }
  const applyWorkspaceSnapshot = (snapshot: WorkspacePersistenceSnapshot) => {
    setActionsById(snapshot.actionsById)
    setStatusById(snapshot.statusById)
  }
  const recordWorkspaceAction = async (action: WorkspaceActionRecord) => {
    applyWorkspaceSnapshot(await workspacePersistence.recordAction(action))
  }
  const advanceStatus = async () => {
    const toStatus = nextStatusFor(selectedStatus)
    if (!toStatus) {
      return
    }
    const action = buildWorkspaceAction({
      actor: "Sari",
      fromStatus: selectedStatus,
      kind: "status_change",
      occurredAt: new Date().toISOString(),
      rfqId: selectedItem.id,
      toStatus,
    })
    await recordWorkspaceAction(action)
  }
  const saveScenario = async () => {
    await recordWorkspaceAction(
      buildWorkspaceAction({
        actor: "Sari",
        kind: "scenario_saved",
        occurredAt: new Date().toISOString(),
        quoteId: `quote-${selectedItem.id.slice(-3)}`,
        rfqId: selectedItem.id,
        scenarioId: `${selectedItem.id}-current-edits`,
      }),
    )
  }
  const createFollowUp = async () => {
    await recordWorkspaceAction(
      buildWorkspaceAction({
        actor: "Sari",
        followUpDueAt: followUpDueAtFor(selectedItem),
        kind: "follow_up_created",
        occurredAt: new Date().toISOString(),
        offerId: offerNumberFor(selectedItem).toLowerCase(),
        rfqId: selectedItem.id,
      }),
    )
  }
  const addHandoffNote = async () => {
    const note = handoffDraft.trim()
    if (!note) {
      return
    }
    await recordWorkspaceAction(
      buildWorkspaceAction({
        actor: "Sari",
        kind: "handoff_note",
        note,
        occurredAt: new Date().toISOString(),
        rfqId: selectedItem.id,
      }),
    )
    setHandoffDraftById((current) => ({ ...current, [selectedItem.id]: "" }))
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            FB
          </div>
          <div>
            <h1>FactoryBid OS</h1>
            <p>Quote workspace</p>
          </div>
        </div>
        <div className="topbar-actions">
          <Button
            onClick={() => {
              setActiveView("offer")
              void syncOfferReplies()
            }}
            type="button"
            variant="outline"
            size="sm"
          >
            <Mail aria-hidden="true" />
            Gmail sync
          </Button>
          <Button type="button" variant="outline" size="sm">
            <CalendarDays aria-hidden="true" />
            Due holds
          </Button>
          <Button onClick={() => setActiveView("offer")} type="button" size="sm">
            <FileText aria-hidden="true" />
            Draft offer
          </Button>
        </div>
      </header>

      <section className="workspace-grid" aria-label="Quote workspace">
        <aside className="queue-panel" aria-label="RFQ queue">
          <div className="panel-heading">
            <span className="eyebrow">
              <Inbox aria-hidden="true" />
              RFQ queue
            </span>
            <span className="queue-count">{workItems.length}</span>
          </div>
          <div className="queue-filters" aria-label="Queue filters">
            <Button type="button" variant="secondary" size="sm">
              Due soon
            </Button>
            <Button type="button" variant="ghost" size="sm">
              Rush
            </Button>
            <Button type="button" variant="ghost" size="sm">
              CNC
            </Button>
          </div>
          <div className="queue-list">
            {rankedQueue.map((queueItem) => {
              const item = workItems.find((candidate) => candidate.id === queueItem.id) ?? workItems[0]
              return (
              <button
                className="queue-item"
                data-active={item.id === selectedId}
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                type="button"
              >
                <span className="queue-item-main">
                  <span className="queue-rank">#{queueItem.rank}</span>
                  <span className="customer">{item.customer}</span>
                  <span className="subject">{item.subject}</span>
                </span>
                <span className="queue-item-meta">
                  <StatusBadge status={statusById[item.id] ?? item.status} />
                  <QueueUrgencyBadge item={queueItem} />
                </span>
              </button>
              )
            })}
          </div>
        </aside>

        <section className="work-panel" aria-label="Selected RFQ">
          <div className="rfq-header">
            <div>
              <div className="rfq-kicker">
                {selectedItem.source.toUpperCase()} · {selectedItem.received}
              </div>
              <h2>{selectedItem.subject}</h2>
              <p>
                {selectedItem.customer} · {selectedItem.contact}
              </p>
            </div>
            <div className="rfq-header-actions">
              <PriorityBadge priority={rush ? "rush" : "normal"} />
              <Button type="button" variant="outline" size="icon" title="Open attachments" aria-label="Open attachments">
                <PanelRight aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="tag-row" aria-label="RFQ tags">
            {selectedItem.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <nav className="view-tabs" aria-label="Workspace views">
            <SegmentButton active={activeView === "triage"} icon={<Inbox aria-hidden="true" />} onClick={() => setActiveView("triage")}>
              Triage
            </SegmentButton>
            <SegmentButton
              active={activeView === "costing"}
              icon={<Calculator aria-hidden="true" />}
              onClick={() => setActiveView("costing")}
            >
              Costing
            </SegmentButton>
            <SegmentButton active={activeView === "offer"} icon={<FileText aria-hidden="true" />} onClick={() => setActiveView("offer")}>
              Offer
            </SegmentButton>
          </nav>

          <WorkloadPanel selectedQueueItem={selectedQueueItem} summary={workloadSummary} />

          {activeView === "triage" ? (
            <TriageView
              actions={selectedActions}
              handoffDraft={handoffDraft}
              item={selectedItem}
              onAddHandoffNote={addHandoffNote}
              onAdvanceStatus={advanceStatus}
              onCreateFollowUp={createFollowUp}
              onHandoffDraftChange={(value) => setHandoffDraftById((current) => ({ ...current, [selectedItem.id]: value }))}
              onSaveScenario={saveScenario}
              status={selectedStatus}
            />
          ) : null}
          {activeView === "costing" ? (
            <CostingView
              cycleMinutes={cycleMinutes}
              partPreview={partPreview}
              quantity={quantity}
              quote={quote}
              rush={rush}
              scenarioComparison={scenarioComparison}
              selectedItem={selectedItem}
              setCycleMinutes={(value) => updateSelectedEdit({ cycleMinutes: value })}
              setQuantity={(value) => updateSelectedEdit({ quantity: value })}
              setRush={(value) => updateSelectedEdit({ rush: value })}
              setSetupMinutes={(value) => updateSelectedEdit({ setupMinutes: value })}
              setupMinutes={setupMinutes}
            />
          ) : null}
          {activeView === "offer" ? <OfferView offer={offer} replySync={offerReplySync} onSyncReplies={syncOfferReplies} /> : null}
        </section>

        <aside className="inspector-panel" aria-label="Quote inspector">
          <div className="panel-heading">
            <span className="eyebrow">
              <PackageCheck aria-hidden="true" />
              Quote total
            </span>
            <span className="lead-time">{quote.leadTimeDays} days</span>
          </div>
          <div className="total-box">
            <span>{formatCurrency(quote.totalCents, quote.currency)}</span>
            <small>
              {formatCurrency(quote.unitPriceCents, quote.currency)} x {quote.quantity}
              {quote.unitRemainderCents > 0 ? ` + ${formatCurrency(quote.unitRemainderCents, quote.currency)}` : ""}
            </small>
          </div>
          <div className="breakdown-list">
            {quote.breakdown.map((line) => (
              <div className="breakdown-row" key={line.key}>
                <span>{line.label}</span>
                <strong>{formatCurrency(line.amountCents, quote.currency)}</strong>
              </div>
            ))}
          </div>
          <div className="review-flags">
            {quote.warnings.length > 0 ? (
              quote.warnings.map((warning) => (
                <div className="flag" key={warning}>
                  <AlertTriangle aria-hidden="true" />
                  <span>{warning}</span>
                </div>
              ))
            ) : (
              <div className="flag ok">
                <CheckCircle2 aria-hidden="true" />
                <span>No calculator flags</span>
              </div>
            )}
          </div>
          <ProviderRunReviewPanel audits={selectedItem.providerRuns} />
        </aside>
      </section>
    </main>
  )
}

function ProviderRunReviewPanel({ audits }: { audits: ProviderRunAudit[] }) {
  const latestAudit = audits[0]
  if (!latestAudit) {
    return null
  }

  return (
    <section className="provider-review" aria-label="Provider review">
      <div className="provider-review-heading">
        <span className="eyebrow">
          <ShieldCheck aria-hidden="true" />
          Provider review
        </span>
        <span className={`provider-status provider-status-${latestAudit.status}`}>{latestAudit.status}</span>
      </div>
      <div className="provider-run-list">
        {audits.map((audit) => (
          <article className="provider-run-card" key={audit.runKey}>
            <div className="provider-run-topline">
              <strong>{humanizeKey(audit.purpose)}</strong>
              <span>{formatProvider(audit.provider)}</span>
            </div>
            <p className="provider-excerpt">{audit.promptExcerpt}</p>
            {audit.outputSummary ? <p className="provider-output">{audit.outputSummary}</p> : null}
            {audit.errorMessage ? <p className="provider-error">{audit.errorMessage}</p> : null}
            <div className="provider-meta-grid">
              <Metric label="Adapter" value={audit.adapterVersion} />
              <Metric label="Duration" value={`${audit.durationMs} ms`} />
              <Metric label="Hash" value={audit.inputHash} />
            </div>
            {Object.keys(audit.metadata).length > 0 ? (
              <div className="provider-metadata" aria-label="Provider metadata">
                {Object.entries(audit.metadata).map(([key, value]) => (
                  <span key={key}>
                    {humanizeKey(key)}: {String(value)}
                  </span>
                ))}
              </div>
            ) : null}
            {audit.warnings.length > 0 ? (
              <div className="provider-warning-list">
                {audit.warnings.map((warning) => (
                  <div className="flag" key={warning}>
                    <AlertTriangle aria-hidden="true" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function TriageView({
  actions,
  handoffDraft,
  item,
  onAddHandoffNote,
  onAdvanceStatus,
  onCreateFollowUp,
  onHandoffDraftChange,
  onSaveScenario,
  status,
}: {
  actions: WorkspaceActionRecord[]
  handoffDraft: string
  item: QuoteWorkItem
  onAddHandoffNote: () => void
  onAdvanceStatus: () => void
  onCreateFollowUp: () => void
  onHandoffDraftChange: (value: string) => void
  onSaveScenario: () => void
  status: QuoteQueueStatus
}) {
  const nextStatus = nextStatusFor(status)

  return (
    <div className="workspace-section">
      <div className="section-title">
        <h3>RFQ intake</h3>
        <StatusBadge status={status} />
      </div>
      <div className="intake-grid">
        <Metric label="Due" value={item.due} />
        <Metric label="Source" value={item.source.toUpperCase()} />
        <Metric label="Contact" value={item.contact} />
      </div>
      <section className="operator-actions" aria-label="Operator actions">
        <div className="operator-action-grid">
          <Button disabled={!nextStatus} onClick={onAdvanceStatus} type="button" variant="outline" size="sm">
            <CheckCircle2 aria-hidden="true" />
            {nextStatus ? `Move to ${humanizeKey(nextStatus)}` : "Terminal status"}
          </Button>
          <Button onClick={onSaveScenario} type="button" variant="outline" size="sm">
            <GitCompareArrows aria-hidden="true" />
            Save scenario
          </Button>
          <Button onClick={onCreateFollowUp} type="button" variant="outline" size="sm">
            <CalendarDays aria-hidden="true" />
            Create follow-up
          </Button>
        </div>
        <div className="handoff-editor">
          <label className="offer-text-field">
            <span>Handoff note</span>
            <textarea
              aria-label="Handoff note"
              onChange={(event) => onHandoffDraftChange(event.target.value)}
              placeholder="Confirm material certs before sending."
              value={handoffDraft}
            />
          </label>
          <Button disabled={!handoffDraft.trim()} onClick={onAddHandoffNote} type="button" size="sm">
            <FileText aria-hidden="true" />
            Add note
          </Button>
        </div>
      </section>
      <div className="note-list">
        {item.notes.map((note) => (
          <div className="note-row" key={note}>
            <CheckCircle2 aria-hidden="true" />
            <span>{note}</span>
          </div>
        ))}
      </div>
      <ActionTimeline actions={actions} />
    </div>
  )
}

function ActionTimeline({ actions }: { actions: WorkspaceActionRecord[] }) {
  return (
    <section className="action-timeline" aria-label="Action timeline">
      <div className="section-title">
        <h3>Action timeline</h3>
        <span className="queue-count">{actions.length}</span>
      </div>
      {actions.length === 0 ? (
        <div className="empty-action-state">No operator actions recorded for this RFQ.</div>
      ) : (
        <div className="action-list">
          {actions.map((action) => (
            <article className="action-row" data-kind={action.activityKind} key={action.key}>
              <div>
                <strong>{humanizeKey(action.kind)}</strong>
                <span>{action.activityMessage}</span>
              </div>
              <div>
                <span>{action.actor}</span>
                <strong>{formatShortDateTime(action.occurredAt)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function WorkloadPanel({
  selectedQueueItem,
  summary,
}: {
  selectedQueueItem: RankedQuoteQueueItem
  summary: ProcessWorkloadSummary
}) {
  return (
    <section className="workload-panel" aria-label="Process workload">
      <div className="workload-summary">
        <div>
          <span className="eyebrow">
            <Layers3 aria-hidden="true" />
            Workload
          </span>
          <strong>{summary.totalOpenItems} open RFQs</strong>
        </div>
        <div>
          <span className="eyebrow">
            <TrendingUp aria-hidden="true" />
            Queue risk
          </span>
          <strong>
            #{selectedQueueItem.rank} · {humanizeKey(selectedQueueItem.urgency)}
          </strong>
        </div>
      </div>
      <div className="workload-buckets">
        {summary.buckets.map((bucket) => (
          <div className="workload-bucket" key={bucket.process}>
            <div>
              <span>{formatProcess(bucket.process)}</span>
              <strong>{bucket.openItemCount} open</strong>
            </div>
            <div>
              <span>Risk</span>
              <strong>{bucket.riskScore}</strong>
            </div>
            <div>
              <span>Value</span>
              <strong>{formatCurrency(bucket.estimatedValueCents, "EUR")}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CostingView({
  cycleMinutes,
  partPreview,
  quantity,
  quote,
  rush,
  scenarioComparison,
  selectedItem,
  setCycleMinutes,
  setQuantity,
  setRush,
  setSetupMinutes,
  setupMinutes,
}: {
  cycleMinutes: number
  partPreview: PartPreviewModel
  quantity: number
  quote: CncQuoteResult
  rush: boolean
  scenarioComparison: QuoteComparisonResult
  selectedItem: QuoteWorkItem
  setCycleMinutes: (value: number) => void
  setQuantity: (value: number) => void
  setRush: (value: boolean) => void
  setSetupMinutes: (value: number) => void
  setupMinutes: number
}) {
  return (
    <div className="workspace-section">
      <div className="section-title">
        <h3>Part costing</h3>
        <span className="calculator-version">{quote.calculatorVersion}</span>
      </div>
      <div className="part-strip">
        <Metric label="Part" value={selectedItem.quoteInput.partNumber} />
        <Metric label="Process" value={formatProcess(selectedItem.quoteInput.process)} />
        <Metric label="Material" value={selectedItem.quoteInput.material.name} />
        <Metric label="Machine" value={selectedItem.quoteInput.machine.name} />
      </div>
      <PartPreviewPanel preview={partPreview} />
      <div className="assumption-grid">
        <label className="field">
          <span>Quantity</span>
          <input min={1} onChange={(event) => setQuantity(toPositiveInteger(event.target.value))} type="number" value={quantity} />
        </label>
        <label className="field">
          <span>Setup minutes</span>
          <input min={0} onChange={(event) => setSetupMinutes(toNumber(event.target.value))} type="number" value={setupMinutes} />
        </label>
        <label className="field">
          <span>Cycle minutes</span>
          <input
            min={0.1}
            onChange={(event) => setCycleMinutes(toPositiveNumber(event.target.value))}
            step={0.1}
            type="number"
            value={cycleMinutes}
          />
        </label>
        <label className="toggle-field">
          <input checked={rush} onChange={(event) => setRush(event.target.checked)} type="checkbox" />
          <span>Rush</span>
        </label>
      </div>
      <label className="range-field">
        <span>Cycle time sensitivity</span>
        <input
          max={80}
          min={4}
          onChange={(event) => setCycleMinutes(toPositiveNumber(event.target.value))}
          step={0.5}
          type="range"
          value={cycleMinutes}
        />
      </label>
      <ScenarioComparisonPanel comparison={scenarioComparison} />
      <div className="assumption-list">
        {quote.assumptions.map((assumption) => (
          <div className="assumption-row" key={assumption.key}>
            <span>{humanizeKey(assumption.key)}</span>
            <strong>{assumption.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScenarioComparisonPanel({ comparison }: { comparison: QuoteComparisonResult }) {
  return (
    <section className="scenario-comparison" aria-label="Quote scenario comparison">
      <div className="scenario-comparison-heading">
        <div>
          <span className="eyebrow">
            <GitCompareArrows aria-hidden="true" />
            Scenario comparison
          </span>
          <strong>
            {comparison.partNumber} · {comparison.quantity} pcs
          </strong>
        </div>
        <span className="recommended-pill">Recommended</span>
      </div>
      <div className="scenario-list">
        {comparison.rows.map((row) => (
          <div className="scenario-row" data-recommended={row.id === comparison.recommendedScenarioId} key={row.id}>
            <div className="scenario-rank">#{row.rank}</div>
            <div className="scenario-name">
              <strong>{row.label}</strong>
              <span>{row.recommendationReasons.join(" ")}</span>
            </div>
            <div className="scenario-metric">
              <span>Total</span>
              <strong>{formatCurrency(row.totalCents, comparison.currency)}</strong>
              <small>{formatSignedCurrencyDelta(row.priceDeltaCents, comparison.currency)}</small>
            </div>
            <div className="scenario-metric">
              <span>Lead</span>
              <strong>{row.leadTimeDays} days</strong>
              <small>{formatSignedDays(row.leadTimeDeltaDays)}</small>
            </div>
            <div className="scenario-score">
              <span>Score</span>
              <strong>{row.score}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PartPreviewPanel({ preview }: { preview: PartPreviewModel }) {
  return (
    <section className="part-preview" aria-label="Part preview">
      <div className="preview-viewport" data-mode={preview.primaryMode}>
        <div className="preview-icon" aria-hidden="true">
          <Cuboid />
        </div>
        <div>
          <span>{formatPreviewMode(preview.primaryMode)}</span>
          <strong>{preview.primaryAttachmentName ?? preview.partNumber}</strong>
        </div>
      </div>
      <div className="preview-side">
        <div className="preview-mode-row" aria-label="Preview modes">
          {preview.availableModes.map((mode) => (
            <span className="preview-mode-chip" data-active={mode === preview.primaryMode} key={mode}>
              {formatPreviewMode(mode)}
            </span>
          ))}
        </div>
        <div className="measurement-list" aria-label="Measurements">
          {preview.measurementOverlays.map((measurement) => (
            <div className="measurement-row" key={measurement.key}>
              <Ruler aria-hidden="true" />
              <span>{measurement.label}</span>
              <strong>{measurement.valueMm} mm</strong>
            </div>
          ))}
        </div>
        <CadMetadataPanel preview={preview} />
        <div className="attachment-list" aria-label="Attachments">
          {preview.attachments.map((attachment) => (
            <div className="attachment-row" data-primary={attachment.primary} key={attachment.fileName}>
              <FileText aria-hidden="true" />
              <span>{attachment.fileName}</span>
              <strong>{attachment.kind}</strong>
            </div>
          ))}
        </div>
        {preview.warnings.length > 0 ? (
          <div className="preview-warning-list">
            {preview.warnings.map((warning) => (
              <div className="flag" key={warning}>
                <AlertTriangle aria-hidden="true" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function CadMetadataPanel({ preview }: { preview: PartPreviewModel }) {
  if (preview.cadMetadata.length === 0) {
    return null
  }

  return (
    <div className="cad-metadata-list" aria-label="CAD metadata">
      {preview.cadMetadata.map((metadata) => (
        <div className="cad-metadata-row" data-metadata-only={metadata.metadataOnly} key={metadata.fileName}>
          <div>
            <span>{metadata.format.toUpperCase()}</span>
            <strong>{metadata.fileName}</strong>
          </div>
          <div>
            <span>{humanizeKey(metadata.provider)}</span>
            <strong>{metadata.status}</strong>
          </div>
          <div>
            <span>Material</span>
            <strong>{metadata.materialText ?? preview.metadata.materialText ?? "Unknown"}</strong>
          </div>
          <div>
            <span>Process</span>
            <strong>{metadata.process ? humanizeKey(metadata.process) : preview.metadata.process ? humanizeKey(preview.metadata.process) : "Unknown"}</strong>
          </div>
        </div>
      ))}
    </div>
  )
}

function OfferView({
  offer,
  onSyncReplies,
  replySync,
}: {
  offer: OfferDraft
  onSyncReplies: () => void
  replySync?: GmailOfferReplySyncResult
}) {
  const offerText = renderOfferText(offer)

  return (
    <div className="workspace-section">
      <div className="section-title">
        <h3>Offer draft</h3>
        <span className="offer-number">{offer.offerNumber}</span>
      </div>
      <div className="offer-layout">
        <Metric label="Customer" value={offer.customer.name} />
        <Metric label="Validity" value={`Until ${offer.validUntil}`} />
        <Metric label="Lead time" value={`${maxLeadTimeDays(offer)} working days`} />
        <Metric label="Total" value={formatCurrency(offer.totalCents, offer.currency)} />
      </div>
      <div className="terms-list">
        {offer.terms.map((term) => (
          <div key={term.key}>{term.value}</div>
        ))}
      </div>
      <OfferReplyPanel replySync={replySync} onSyncReplies={onSyncReplies} />
      <label className="offer-text-field">
        <span>Plain text offer</span>
        <textarea aria-label="Plain text offer" readOnly value={offerText} />
      </label>
    </div>
  )
}

function OfferReplyPanel({
  onSyncReplies,
  replySync,
}: {
  onSyncReplies: () => void
  replySync?: GmailOfferReplySyncResult
}) {
  const matchedRecords = replySync?.records.filter((record) => record.parsed.matched) ?? []

  return (
    <section className="offer-reply-panel" aria-label="Offer reply sync">
      <div className="offer-reply-heading">
        <div>
          <span className="eyebrow">
            <Mail aria-hidden="true" />
            Customer replies
          </span>
          <strong>{replySync ? `${matchedRecords.length} matched reply signals` : "Ready to sync from Gmail"}</strong>
        </div>
        <Button onClick={onSyncReplies} type="button" variant="outline" size="sm">
          <RefreshCw aria-hidden="true" />
          Sync replies
        </Button>
      </div>
      {replySync ? (
        <>
          <div className="offer-reply-summary">
            <Metric label="Provider" value={replySync.provider} />
            <Metric label="Status" value={replySync.status} />
            <Metric label="Query" value={replySync.query} />
          </div>
          <div className="offer-reply-list">
            {replySync.records.map((record) => (
              <article className="offer-reply-card" data-matched={record.parsed.matched} key={record.message.id}>
                <div>
                  <strong>{record.message.subject}</strong>
                  <span>{record.message.senderName ?? record.message.senderEmail ?? "Unknown sender"}</span>
                </div>
                <div>
                  <span>{record.parsed.signal ? humanizeKey(record.parsed.signal) : "No offer match"}</span>
                  <strong>{record.parsed.event ? humanizeKey(record.parsed.event.kind) : "Ignored"}</strong>
                </div>
              </article>
            ))}
          </div>
          {replySync.warnings.length > 0 ? (
            <div className="provider-warning-list">
              {replySync.warnings.map((warning) => (
                <div className="flag" key={warning}>
                  <AlertTriangle aria-hidden="true" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function SegmentButton({
  active,
  children,
  icon,
  onClick,
}: {
  active: boolean
  children: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button className="segment-button" data-active={active} onClick={onClick} type="button">
      {icon}
      <span>{children}</span>
    </button>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StatusBadge({ status }: { status: QuoteQueueStatus }) {
  return <span className={`status-badge status-${status}`}>{status}</span>
}

function PriorityBadge({ priority }: { priority: QuoteWorkItem["priority"] }) {
  return (
    <span className={`priority-badge priority-${priority}`}>
      <Clock3 aria-hidden="true" />
      {priority}
    </span>
  )
}

function QueueUrgencyBadge({ item }: { item: RankedQuoteQueueItem }) {
  const label = item.urgency === "normal" ? `${item.daysUntilDue}d` : humanizeKey(item.urgency)
  return (
    <span className={`urgency-badge urgency-${item.urgency}`}>
      <Clock3 aria-hidden="true" />
      {label}
    </span>
  )
}

function toNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function toPositiveNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0.1
}

function toPositiveInteger(value: string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function defaultEditState(item: QuoteWorkItem): QuoteEditState {
  return {
    cycleMinutes: item.quoteInput.operation.cycleMinutesPerPart,
    quantity: item.quoteInput.quantity,
    rush: item.quoteInput.priority === "rush",
    setupMinutes: item.quoteInput.operation.setupMinutes,
  }
}

function applyQuoteEdit(item: QuoteWorkItem, edit: QuoteEditState): CncQuoteInput {
  return {
    ...item.quoteInput,
    quantity: edit.quantity,
    priority: edit.rush ? "rush" : "normal",
    operation: {
      ...item.quoteInput.operation,
      setupMinutes: edit.setupMinutes,
      cycleMinutesPerPart: edit.cycleMinutes,
    },
  }
}

function buildScenarioComparisonInputs(
  baseInput: CncQuoteInput,
  currentInput: CncQuoteInput,
  currentQuote: CncQuoteResult,
): QuoteComparisonScenario[] {
  const normalizedBaseInput: CncQuoteInput = {
    ...baseInput,
    quantity: currentInput.quantity,
  }
  const standardInput: CncQuoteInput = {
    ...currentInput,
    priority: "normal",
  }
  const rushInput: CncQuoteInput = {
    ...currentInput,
    priority: "rush",
  }

  return [
    { id: "current", label: "Current edits", quote: currentQuote },
    { id: "baseline", label: "RFQ baseline", quote: calculateCncQuote(normalizedBaseInput) },
    { id: "standard", label: "Standard lead time", quote: calculateCncQuote(standardInput) },
    { id: "rush", label: "Rush expedite", quote: calculateCncQuote(rushInput) },
  ]
}

function partDraftForQuoteInput(quoteInput: CncQuoteInput, attachments: RfqAttachmentDraft[]): RfqPartDraft {
  const dimensions = quoteInput.finishedDimensions ?? quoteInput.stockDimensions

  return {
    partNumber: quoteInput.partNumber,
    process: quoteInput.process,
    materialText: quoteInput.material.name,
    quantity: quoteInput.quantity,
    dimensions: {
      lengthMm: dimensions.lengthMm,
      widthMm: dimensions.widthMm,
      heightMm: dimensions.heightMm,
    },
    attachmentNames: attachments.map((attachment) => attachment.fileName),
  }
}

function buildSampleProviderAudit({
  completedAt,
  errorMessage,
  metadata,
  outputSummary,
  preferredProvider = "mock",
  prompt,
  purpose,
  resultProvider = preferredProvider,
  startedAt,
  status,
  trace,
  warnings,
}: {
  completedAt: string
  errorMessage?: string
  metadata: ProviderRunResult["metadata"]
  outputSummary?: string
  preferredProvider?: ProviderRunRequest["preferredProvider"]
  prompt: string
  purpose: ProviderRunRequest["purpose"]
  resultProvider?: ProviderRunResult["provider"]
  startedAt: string
  status: ProviderRunResult["status"]
  trace: ProviderRunRequest["trace"]
  warnings: string[]
}) {
  const request: ProviderRunRequest = {
    input: {
      fixture: "workspace-provider-review",
      rfqId: trace?.rfqId ?? "",
    },
    preferredProvider,
    prompt,
    purpose,
    trace,
  }
  const result: ProviderRunResult = {
    adapterVersion: resultProvider === "mock" ? "provider-adapter.v1.mock" : `provider-adapter.v1.${resultProvider}`,
    errorMessage,
    inputHash: hashProviderInput(request),
    metadata,
    outputSummary,
    provider: resultProvider,
    purpose,
    status,
    warnings,
  }

  return buildProviderRunAudit({
    completedAt,
    request,
    result,
    startedAt,
  })
}

function buildCadMetadataResult({
  dimensions,
  fileName,
  format,
  materialText,
  metadataOnly = false,
  previewKind,
  process,
  provider = "heuristic",
  status = "succeeded",
  warnings = [],
}: {
  dimensions: CadMetadataResult["dimensions"]
  fileName: string
  format: CadMetadataResult["format"]
  materialText?: string
  metadataOnly?: boolean
  previewKind: CadMetadataResult["previewKind"]
  process?: CadMetadataResult["process"]
  provider?: CadMetadataResult["provider"]
  status?: CadMetadataResult["status"]
  warnings?: string[]
}): CadMetadataResult {
  return {
    adapterVersion: "cad-metadata.v1",
    dimensions,
    fileName,
    format,
    materialText,
    metadataOnly,
    previewKind,
    process,
    provider,
    status,
    units: dimensions ? "mm" : "unknown",
    warnings,
  }
}

function offerNumberFor(item: QuoteWorkItem) {
  return `OFFER-${item.id.slice(-3).toUpperCase()}`
}

function nextStatusFor(status: QuoteQueueStatus): QuoteQueueStatus | undefined {
  const transitions: Partial<Record<QuoteQueueStatus, QuoteQueueStatus>> = {
    new: "triage",
    triage: "estimating",
    estimating: "ready",
    ready: "sent",
    sent: "won",
  }
  return transitions[status]
}

function followUpDueAtFor(item: QuoteWorkItem) {
  const due = new Date(item.dueAt)
  due.setUTCDate(due.getUTCDate() + 3)
  due.setUTCHours(7, 0, 0, 0)
  return due.toISOString()
}

function buildOfferReplyMessages(item: QuoteWorkItem, offer: OfferDraft): GmailRfqMessage[] {
  const followUpTaskId = `follow-up-${item.id}`
  const accepted = item.priority === "rush"
  const replyText = accepted
    ? `We accept offer ${offer.offerNumber}. Please proceed and close follow-up ${followUpTaskId}.`
    : `Thanks for the offer ${offer.offerNumber}. We will review internally this week.`

  return [
    {
      fromHeader: `${item.contact} <${item.contact.toLowerCase().replace(/\s+/g, ".")}@example.test>`,
      id: `${item.id}-reply-001`,
      plainText: replyText,
      receivedAt: "2026-06-20T11:15:00+03:00",
      senderEmail: `${item.contact.toLowerCase().replace(/\s+/g, ".")}@example.test`,
      senderName: item.contact,
      snippet: replyText,
      subject: `Re: ${offer.offerNumber} ${item.subject}`,
      threadId: `${item.id}-offer-thread`,
    },
    {
      fromHeader: `${item.contact} <${item.contact.toLowerCase().replace(/\s+/g, ".")}@example.test>`,
      id: `${item.id}-reply-002`,
      plainText: `Received offer ${offer.offerNumber}, thanks for the quote. This closes follow-up ${followUpTaskId}.`,
      receivedAt: "2026-06-20T11:16:00+03:00",
      senderEmail: `${item.contact.toLowerCase().replace(/\s+/g, ".")}@example.test`,
      senderName: item.contact,
      snippet: `Received offer ${offer.offerNumber}, thanks for the quote.`,
      subject: `Re: follow-up ${offer.offerNumber}`,
      threadId: `${item.id}-offer-thread`,
    },
    {
      fromHeader: "Purchasing <purchasing@example.test>",
      id: `${item.id}-reply-ignored`,
      plainText: "Can you also send a separate quote for the spare fixture?",
      receivedAt: "2026-06-20T11:18:00+03:00",
      senderEmail: "purchasing@example.test",
      senderName: "Purchasing",
      snippet: "Separate quote request",
      subject: "Separate fixture request",
      threadId: `${item.id}-side-thread`,
    },
  ]
}

function maxLeadTimeDays(offer: OfferDraft) {
  return Math.max(...offer.items.map((item) => item.leadTimeDays))
}

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat("en-FI", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(cents / 100)
}

function formatSignedCurrencyDelta(cents: number, currency: string) {
  if (cents === 0) {
    return formatCurrency(0, currency)
  }
  const sign = cents > 0 ? "+" : "-"
  return `${sign} ${formatCurrency(Math.abs(cents), currency)}`
}

function formatSignedDays(days: number) {
  if (days === 0) {
    return "0 days"
  }
  return `${days > 0 ? "+" : ""}${days} days`
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat("en-FI", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value))
}

function formatProcess(process: QuoteProcessKey) {
  switch (process) {
    case "cnc_milling":
      return "CNC milling"
    case "cnc_turning":
      return "CNC turning"
    case "fabrication":
      return "Fabrication"
    case "plastic":
      return "Plastic"
    case "sheet_metal":
      return "Sheet metal"
    case "wire_edm":
      return "Wire EDM"
  }
}

function formatPreviewMode(mode: PartPreviewMode) {
  switch (mode) {
    case "cad":
      return "CAD"
    case "drawing":
      return "Drawing"
    case "photo":
      return "Photo"
    case "spreadsheet":
      return "Sheet"
    case "metadata":
      return "Metadata"
  }
}

function formatProvider(provider: ProviderRunAudit["provider"]): string {
  switch (provider) {
    case "local_codex":
      return "Local Codex"
    case "gemini":
      return "Gemini"
    case "tavily":
      return "Tavily"
    case "elevenlabs":
      return "ElevenLabs"
    case "mock":
      return "Mock"
  }
}

function humanizeKey(key: string) {
  return key.replaceAll("_", " ")
}

export default App
