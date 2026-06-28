import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import {
  AlertTriangle,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CloudOff,
  Copy,
  Cuboid,
  Database,
  Download,
  ExternalLink,
  Factory,
  FileDown,
  FileText,
  GitCompareArrows,
  Inbox,
  Layers3,
  Mail,
  PackageCheck,
  PanelRight,
  Plus,
  RefreshCw,
  Ruler,
  ShieldCheck,
  TimerReset,
  TrendingUp,
  Truck,
} from "lucide-react"

import { Button } from "./components/ui/button"
import type { CadMetadataResult } from "./domain/integrations/cadMetadata"
import {
  createCalendarRfqScheduler,
  createMockCalendarRfqProvider,
  buildRfqCalendarPlan,
  type CalendarRfqPlan,
  type CalendarRfqEventDraft,
} from "./domain/integrations/calendarRfq"
import {
  createConnectorRfqSyncOrchestrator,
  type ConnectorRfqSyncRecord,
  type ConnectorRfqSyncResult,
} from "./domain/integrations/connectorSync"
import {
  buildConnectorLinkDrilldown,
  type ConnectorLinkDrilldown,
  type ConnectorLinkDrilldownFilter,
  type ConnectorLinkDrilldownItem,
} from "./domain/integrations/connectorLinkDrilldown"
import {
  createLocalConnectorSyncPersistence,
  type ConnectorSyncPersistenceSnapshot,
} from "./domain/integrations/connectorSyncPersistence"
import {
  createGmailOfferReplyAdapter,
  type GmailOfferReplySyncResult,
} from "./domain/integrations/gmailOfferReply"
import {
  createGmailRfqIntakeAdapter,
  createMockGmailRfqProvider,
  type GmailRfqIntakeRecord,
  type GmailRfqMessage,
} from "./domain/integrations/gmailRfq"
import { DEFAULT_OFFER_TERMS, buildCncOfferDraft, type OfferDraft, type OfferTerm } from "./domain/offers/offer"
import {
  buildOfferLifecycleTimeline,
  type OfferLifecycleEventInput,
  type OfferLifecycleTimeline,
} from "./domain/offers/offerLifecycle"
import {
  buildOfferExportPackage,
  type OfferAlternateQuoteInput,
  type OfferExportPackage,
} from "./domain/offers/offerExportPackage"
import {
  buildOfferReleaseExecutionRun,
  type OfferReleaseCommandOutcomeInput,
  type OfferReleaseCommandExecutionStatus,
  type OfferReleaseExecutionRun,
} from "./domain/offers/offerReleaseExecution"
import {
  summarizeOfferReleaseExecutionHistory,
  type OfferReleaseExecutionHistorySummary,
} from "./domain/offers/offerReleaseExecutionHistory"
import {
  buildOfferReleasePlan,
  type OfferReleaseCommandStatus,
  type OfferReleasePlan,
} from "./domain/offers/offerReleasePlan"
import {
  evaluateOfferSendReadiness,
  type OfferSendReadinessCheckStatus,
  type OfferSendReadinessResult,
} from "./domain/offers/offerSendReadiness"
import {
  createConvexOfferReplySyncPersistence,
  createLocalOfferReplySyncPersistence,
  type OfferReplySyncPersistenceSnapshot,
} from "./domain/offers/offerReplySyncPersistence"
import {
  buildOfferReplyStateSummary,
  type OfferReplyStateFilter,
  type OfferReplyStateSummary,
} from "./domain/offers/offerReplyState"
import { hashProviderInput, type ProviderRunRequest, type ProviderRunResult } from "./domain/providers/ai"
import {
  buildProviderRunHistorySummary,
  type ProviderRunHistoryFilter,
} from "./domain/providers/providerRunHistory"
import { buildProviderRunAudit, type ProviderRunAudit } from "./domain/providers/providerRunAudit"
import type { CncQuoteInput, CncQuoteResult } from "./domain/quoting/cnc"
import type { FabricationInputEditPatch, FabricationInputEditState } from "./domain/quoting/fabricationInputEdits"
import {
  buildNonCncInputEditState,
  calculateEditedNonCncQuote,
  listNonCncInputEditAdapters,
  type NonCncInputEditAdapterSummary,
} from "./domain/quoting/nonCncInputEditRegistry"
import { buildNonCncQuotePromotionActionSummary } from "./domain/quoting/nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage } from "./domain/quoting/nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft } from "./domain/quoting/nonCncQuotePromotionDraft"
import { buildNonCncQuotePromotionExecutionRun, type NonCncQuotePromotionExecutionRun } from "./domain/quoting/nonCncQuotePromotionExecution"
import { buildNonCncQuotePromotionExecutionOutcomeDraft } from "./domain/quoting/nonCncQuotePromotionExecutionOutcomeDraft"
import {
  createLocalNonCncQuotePromotionExecutionPersistence,
  type NonCncQuotePromotionExecutionPersistenceSnapshot,
} from "./domain/quoting/nonCncQuotePromotionExecutionPersistence"
import {
  createLocalNonCncQuotePromotionPersistence,
  type NonCncQuotePromotionPersistenceSnapshot,
} from "./domain/quoting/nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan, type NonCncQuotePromotionPlan } from "./domain/quoting/nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes, PROCESS_DEMO_QUOTES_VERSION, type ProcessDemoQuote } from "./domain/quoting/processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview, type ProcessQuotePreviewOption } from "./domain/quoting/processQuotePreview"
import { buildProcessCapabilityMatrix, type ProcessCapabilityMatrix } from "./domain/quoting/processCapability"
import type { PlasticsInputEditPatch, PlasticsInputEditState } from "./domain/quoting/plasticsInputEdits"
import type { QuoteProcessKey } from "./domain/quoting/registry"
import type { SheetMetalInputEditPatch, SheetMetalInputEditState } from "./domain/quoting/sheetMetalInputEdits"
import type { WireEdmInputEditPatch, WireEdmInputEditState } from "./domain/quoting/wireEdmInputEdits"
import type { ParsedRfqIntake, RfqAttachmentDraft, RfqExtractedField, RfqIntakeSource, RfqPartDraft } from "./domain/rfq/intake"
import {
  evaluateRfqIntakeReadiness,
  type RfqIntakeReadinessCheckStatus,
  type RfqIntakeReadinessResult,
} from "./domain/rfq/intakeReadiness"
import {
  MANUAL_MATERIAL_PRESETS,
  buildManualCncQuoteInput,
  manualMaterialPreset,
  type ManualCncProcess,
  type ManualMaterialKey,
  type ManualPriority,
} from "./domain/rfq/manualRfq"
import { buildPartPreviewModel, type PartPreviewModel, type PartPreviewMode } from "./domain/viewer/partPreview"
import {
  buildCapacityCommitmentPlan,
  type CapacityCommitmentPlan,
  type CapacityItemCommitment,
  type CapacityProcessCommitment,
} from "./domain/workspace/capacityCommitment"
import {
  buildMaterialAvailabilityPlan,
  type MaterialAvailabilityCommitment,
  type MaterialAvailabilityPlan,
  type MaterialInventoryLot,
  type MaterialSupplierOption,
} from "./domain/workspace/materialAvailability"
import {
  buildOutsideServicePlan,
  type OutsideServiceCommitment,
  type OutsideServicePlan,
  type OutsideServiceSupplierRule,
} from "./domain/workspace/outsideServicePlanner"
import {
  buildCalendarFollowUpStatus,
  type CalendarFollowUpStatus,
  type CalendarFollowUpStatusFilter,
  type CalendarFollowUpStatusTask,
} from "./domain/workspace/calendarFollowUpStatus"
import {
  summarizeWorkspaceIntegrationStatus,
  type IntegrationStatusSource,
  type WorkspaceIntegrationStatus,
} from "./domain/workspace/integrationStatus"
import {
  evaluateQuoteApproval,
  type QuoteApprovalCheckStatus,
  type QuoteApprovalCustomerPolicy,
  type QuoteApprovalDecision,
} from "./domain/workspace/quoteApproval"
import {
  evaluateQuoteReleaseGate,
  type QuoteReleaseGateCheckStatus,
  type QuoteReleaseGateDecision,
} from "./domain/workspace/quoteReleaseGate"
import {
  compareQuoteScenarios,
  type QuoteComparisonResult,
  type QuoteComparisonScenario,
} from "./domain/workspace/quoteComparison"
import { rankQuoteQueue, type QuoteQueueStatus, type RankedQuoteQueueItem } from "./domain/workspace/quoteQueue"
import { summarizeProcessWorkload, type ProcessWorkloadSummary } from "./domain/workspace/processWorkload"
import { calculateWorkspaceCncQuote } from "./domain/workspace/workspaceCncQuote"
import { buildWorkspaceAction, type WorkspaceActionRecord } from "./domain/workspace/workspaceActions"
import type { WorkspacePersistenceSnapshot } from "./domain/workspace/workspacePersistence"
import {
  createWorkspacePersistenceRuntime,
  type WorkspacePersistenceBridge,
  type WorkspacePersistenceMode,
} from "./domain/workspace/workspacePersistenceRuntime"
import "./App.css"

type WorkspaceView = "triage" | "costing" | "offer"

interface RfqFieldPatch {
  commit?: boolean
  customer?: string
  contact?: string
  subject?: string
  dueDate?: string
  materialKey?: ManualMaterialKey
  process?: ManualCncProcess
  toleranceClass?: string
  finish?: string
  notesText?: string
}

interface OfferDraftEditState {
  notesText: string
  revisionReason: string
  termsText: string
  validUntil: string
}

interface ReleaseReviewState {
  note: string
  reviewedAt: string
  reviewedBy: string
}

interface CadReviewOverrideState {
  acknowledgedFlags: string[]
  correctionNotes?: CadReviewCorrectionNotes
  note: string
  reviewedAt: string
  reviewedBy: string
}

interface CadReviewCorrectionNotes {
  dimensions?: string
  material?: string
  process?: string
}

interface WorkspaceRuntimeContext {
  clock: {
    now: string
    today: string
  }
  operator: {
    id: string
    name: string
  }
  timezone: string
}

type OfferExportEventKind = "copy_text" | "download_pdf" | "download_text"

interface OfferExportHistoryEvent {
  fileName?: string
  id: string
  kind: OfferExportEventKind
  message: string
  occurredAt: string
  status: "failed" | "succeeded"
}

interface WorkspaceLocalState {
  actionsById: Record<string, WorkspaceActionRecord[]>
  activeView: WorkspaceView
  cadReviewOverridesById: Record<string, CadReviewOverrideState>
  editsById: Record<string, Partial<QuoteEditState>>
  offerDraftEditsById: Record<string, Partial<OfferDraftEditState>>
  offerExportEventsById: Record<string, OfferExportHistoryEvent[]>
  offerLifecycleEventsById: Record<string, OfferLifecycleEventInput[]>
  primaryAttachmentById: Record<string, string>
  releaseExecutionRunsById: Record<string, OfferReleaseExecutionRun[]>
  releaseReviewsById: Record<string, ReleaseReviewState>
  selectedId: string
  statusById: Record<string, QuoteQueueStatus>
  version: 1
  workItems: QuoteWorkItem[]
}

const workspaceLocalStorageKey = "factorybid.workspace.v1"
const defaultWorkspaceRuntimeContext: WorkspaceRuntimeContext = {
  clock: {
    now: "2026-06-20T09:00:00+03:00",
    today: "2026-06-20",
  },
  operator: {
    id: "operator-sari",
    name: "Sari",
  },
  timezone: "Europe/Helsinki",
}
const demoToday = defaultWorkspaceRuntimeContext.clock.today
const defaultWorkspaceTimezone = defaultWorkspaceRuntimeContext.timezone
const capacityPlanningDays = 5
const defaultDailyCapacityMinutesByProcess: Record<QuoteProcessKey, number> = {
  cnc_milling: 420,
  cnc_turning: 360,
  fabrication: 480,
  plastic: 420,
  sheet_metal: 450,
  wire_edm: 300,
}
const outsideServiceSupplierRules: OutsideServiceSupplierRule[] = [
  {
    bufferDays: 1,
    leadTimeDays: 3,
    match: "passivation",
    supplierName: "Nordic Surface Works",
  },
  {
    bufferDays: 2,
    leadTimeDays: 5,
    match: "anodizing",
    minimumCostCents: 9000,
    supplierName: "Arctic Anodize",
  },
  {
    bufferDays: 2,
    leadTimeDays: 6,
    match: "heat",
    supplierName: "HeatPro Tampere",
  },
  {
    bufferDays: 2,
    leadTimeDays: 4,
    match: "plating",
    supplierName: "Baltic Plating Co.",
  },
]
const materialInventoryLots: MaterialInventoryLot[] = [
  {
    availableKg: 10,
    id: "lot-al-6082-rack-a2",
    location: "Rack A2",
    materialName: "Aluminum 6082",
    reservedKg: 1,
  },
  {
    availableKg: 0.25,
    certificateStatus: "missing",
    id: "lot-316l-bin-s1",
    location: "Bin S1",
    materialName: "Stainless steel 316L",
  },
  {
    availableKg: 3.5,
    id: "lot-al-7075-rack-a8",
    location: "Rack A8",
    materialName: "Aluminum 7075",
    reservedKg: 0.5,
  },
]
const materialSupplierOptions: MaterialSupplierOption[] = [
  {
    leadTimeDays: 5,
    match: "aluminum_6082",
    minimumOrderKg: 5,
    supplierName: "MetalHub Helsinki",
  },
  {
    leadTimeDays: 4,
    match: "aluminum_7075",
    minimumOrderKg: 10,
    supplierName: "Aero Alloy Supply",
  },
  {
    leadTimeDays: 3,
    match: "stainless_steel_316l",
    minimumOrderKg: 3,
    supplierName: "Stainless Stock Oy",
  },
]
const emptyConnectorSnapshot: ConnectorSyncPersistenceSnapshot = {
  payloads: [],
  syncCount: 0,
}
const providerRunHistoryFilters: ProviderRunHistoryFilter[] = [
  "all",
  "warnings",
  "fallbacks",
  "failed",
  "skipped",
  "succeeded",
]
const connectorLinkDrilldownFilters: ConnectorLinkDrilldownFilter[] = [
  "all",
  "gmail",
  "calendar",
  "attention",
  "activity",
]
const calendarFollowUpStatusFilters: CalendarFollowUpStatusFilter[] = ["all", "open", "completed", "review"]
const offerLifecycleFollowUpDueAt = "2026-06-27T09:00:00+03:00"

interface QuoteEditState {
  cycleMinutes: number
  machineHourlyRateCents: number
  marginPercent: number
  materialCostCentsPerKg: number
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

const initialWorkItems: QuoteWorkItem[] = [
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

interface QueueFilterState {
  cnc: boolean
  due: boolean
  rush: boolean
}

const QUEUE_DUE_SOON_DAYS = 3

function queueItemMatchesFilters(item: RankedQuoteQueueItem, filters: QueueFilterState): boolean {
  if (filters.rush && item.priority !== "rush") {
    return false
  }
  if (filters.cnc && item.process !== "cnc_milling" && item.process !== "cnc_turning") {
    return false
  }
  if (filters.due && item.daysUntilDue > QUEUE_DUE_SOON_DAYS) {
    return false
  }
  return true
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(kilobytes < 10 ? 1 : 0)} KB`
  }
  return `${(kilobytes / 1024).toFixed(1)} MB`
}

function App() {
  const [workspaceContext] = useState(defaultWorkspaceRuntimeContext)
  const workspaceNow = workspaceContext.clock.now
  const workspaceToday = workspaceContext.clock.today
  const workspaceOperatorName = workspaceContext.operator.name
  const workspaceTimezone = workspaceContext.timezone
  const [workspaceLocalState] = useState(() => readWorkspaceLocalState())
  const restoredWorkItems = workspaceLocalState?.workItems ?? initialWorkItems
  const [workItems, setWorkItems] = useState<QuoteWorkItem[]>(restoredWorkItems)
  const [selectedId, setSelectedId] = useState(() => restoredSelectedId(workspaceLocalState, restoredWorkItems))
  const [activeView, setActiveView] = useState<WorkspaceView>(workspaceLocalState?.activeView ?? "costing")
  const [queueFilters, setQueueFilters] = useState<QueueFilterState>({ cnc: false, due: false, rush: false })
  const [showAttachments, setShowAttachments] = useState(false)
  const [isCreatingRfq, setIsCreatingRfq] = useState(false)
  const [actionsById, setActionsById] = useState<Record<string, WorkspaceActionRecord[]>>(workspaceLocalState?.actionsById ?? {})
  const [cadReviewOverridesById, setCadReviewOverridesById] = useState<Record<string, CadReviewOverrideState>>(
    workspaceLocalState?.cadReviewOverridesById ?? {},
  )
  const [cadReviewDraftById, setCadReviewDraftById] = useState<Record<string, string>>({})
  const [cadCorrectionDraftById, setCadCorrectionDraftById] = useState<Record<string, CadReviewCorrectionNotes>>({})
  const [connectorSnapshotsById, setConnectorSnapshotsById] = useState<Record<string, ConnectorSyncPersistenceSnapshot>>({})
  const [connectorSyncErrorCountById, setConnectorSyncErrorCountById] = useState<Record<string, number>>({})
  const [editsById, setEditsById] = useState<Record<string, Partial<QuoteEditState>>>(workspaceLocalState?.editsById ?? {})
  const [handoffDraftById, setHandoffDraftById] = useState<Record<string, string>>({})
  const [offerDraftEditsById, setOfferDraftEditsById] = useState<Record<string, Partial<OfferDraftEditState>>>(
    workspaceLocalState?.offerDraftEditsById ?? {},
  )
  const [offerExportEventsById, setOfferExportEventsById] = useState<Record<string, OfferExportHistoryEvent[]>>(
    workspaceLocalState?.offerExportEventsById ?? {},
  )
  const [offerRepliesById, setOfferRepliesById] = useState<Record<string, GmailOfferReplySyncResult>>({})
  const [offerReplyPersistenceSnapshotsById, setOfferReplyPersistenceSnapshotsById] = useState<Record<string, OfferReplySyncPersistenceSnapshot>>({})
  const [offerLifecycleEventsById, setOfferLifecycleEventsById] = useState<Record<string, OfferLifecycleEventInput[]>>(
    workspaceLocalState?.offerLifecycleEventsById ?? {},
  )
  const [primaryAttachmentById, setPrimaryAttachmentById] = useState<Record<string, string>>(workspaceLocalState?.primaryAttachmentById ?? {})
  const [releaseExecutionRunsById, setReleaseExecutionRunsById] = useState<Record<string, OfferReleaseExecutionRun[]>>(
    workspaceLocalState?.releaseExecutionRunsById ?? {},
  )
  const [releaseReviewsById, setReleaseReviewsById] = useState<Record<string, ReleaseReviewState>>(
    workspaceLocalState?.releaseReviewsById ?? {},
  )
  const [connectorSyncingById, setConnectorSyncingById] = useState<Record<string, boolean>>({})
  const [persistenceSyncErrorCount, setPersistenceSyncErrorCount] = useState(0)
  const [statusById, setStatusById] = useState<Record<string, QuoteQueueStatus>>(workspaceLocalState?.statusById ?? {})
  const connectorSyncLocksRef = useRef(new Set<string>())
  const manualRfqCountRef = useRef(highestManualRfqCounter(workItems))
  const releaseExecutionLocksRef = useRef(new Set<string>())
  const [workspacePersistenceRuntime] = useState(() =>
    createWorkspacePersistenceRuntime({
      convex: createBrowserConvexWorkspaceBridge(),
      initialSnapshot: {
        actionsById: workspaceLocalState?.actionsById ?? {},
        statusById: workspaceLocalState?.statusById ?? {},
      },
      onSyncError: () => setPersistenceSyncErrorCount((count) => count + 1),
    }),
  )
  const workspacePersistence = workspacePersistenceRuntime.adapter
  useEffect(() => {
    writeWorkspaceLocalState({
      actionsById,
      activeView,
      cadReviewOverridesById,
      editsById,
      offerDraftEditsById,
      offerExportEventsById,
      offerLifecycleEventsById,
      primaryAttachmentById,
      releaseExecutionRunsById,
      releaseReviewsById,
      selectedId,
      statusById,
      version: 1,
      workItems,
    })
  }, [
    actionsById,
    activeView,
    cadReviewOverridesById,
    editsById,
    offerDraftEditsById,
    offerExportEventsById,
    offerLifecycleEventsById,
    primaryAttachmentById,
    releaseExecutionRunsById,
    releaseReviewsById,
    selectedId,
    statusById,
    workItems,
  ])
  const queueNow = workspaceNow
  const selectedItem = workItems.find((item) => item.id === selectedId) ?? workItems[0]
  const selectedActions = useMemo(() => actionsById[selectedId] ?? [], [actionsById, selectedId])
  const selectedEdit = editStateForItem(selectedItem, editsById[selectedId])
  const selectedStatus = statusById[selectedId] ?? selectedItem.status
  const selectedConnectorSnapshot = connectorSnapshotsById[selectedId] ?? emptyConnectorSnapshot
  const selectedConnectorSyncErrorCount = connectorSyncErrorCountById[selectedId] ?? 0
  const selectedConnectorSyncing = connectorSyncingById[selectedId] ?? false
  const selectedRfqCalendarPlan = useMemo(
    () =>
      buildRfqCalendarPlan({
        parsedRfq: parsedRfqForCalendarPlan(selectedItem),
        rfqId: selectedItem.id,
        timezone: workspaceTimezone,
      }),
    [selectedItem, workspaceTimezone],
  )
  const handoffDraft = handoffDraftById[selectedId] ?? ""
  const selectedOfferExportEvents = offerExportEventsById[selectedId] ?? []
  const selectedReleaseExecutionRuns = useMemo(
    () => releaseExecutionRunsById[selectedId] ?? [],
    [releaseExecutionRunsById, selectedId],
  )
  const selectedReleaseReview = releaseReviewsById[selectedId]
  const selectedOfferDraftEdit = useMemo(
    () => offerDraftEditStateForItem(selectedItem, offerDraftEditsById[selectedId]),
    [offerDraftEditsById, selectedId, selectedItem],
  )
  const { cycleMinutes, machineHourlyRateCents, marginPercent, materialCostCentsPerKg, quantity, rush, setupMinutes } = selectedEdit
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
  const updateSelectedOfferDraftEdit = (patch: Partial<OfferDraftEditState>) => {
    setOfferDraftEditsById((current) => ({
      ...current,
      [selectedId]: {
        ...defaultOfferDraftEditState(selectedItem),
        ...current[selectedId],
        ...patch,
      },
    }))
  }
  const recordSelectedOfferExportEvent = (event: Omit<OfferExportHistoryEvent, "id" | "occurredAt">) => {
    setOfferExportEventsById((current) => {
      const events = current[selectedId] ?? []
      const nextIndex = events.length + 1
      return {
        ...current,
        [selectedId]: [
          ...events,
          {
            ...event,
            id: `${selectedId}:offer-export:${nextIndex}`,
            occurredAt: workspaceNow,
          },
        ],
      }
    })
  }
  const updateSelectedRfqFields = (patch: RfqFieldPatch) => {
    setWorkItems((current) =>
      current.map((item) => {
        if (item.id !== selectedId) {
          return item
        }

        const customer = normalizeEditableText(patch.customer, item.customer, patch.commit)
        const contact = normalizeEditableText(patch.contact, item.contact, patch.commit)
        const subject = normalizeEditableText(patch.subject, item.subject, patch.commit)
        const quoteInput = applyRfqFieldPatch(item.quoteInput, patch)
        const dueDate = normalizeManualDueDate(patch.dueDate?.trim() ? patch.dueDate : dateInputValueFor(item.dueAt), dateInputValueFor(item.dueAt))

        return {
          ...item,
          customer,
          contact,
          subject,
          due: patch.dueDate === undefined ? item.due : formatManualDueLabel(dueDate),
          dueAt: patch.dueDate === undefined ? item.dueAt : manualDueAtFor(dueDate, dateInputValueFor(item.dueAt)),
          quoteInput,
          tags: quoteInput === item.quoteInput ? item.tags : buildManualTags(quoteInput),
          notes: patch.notesText === undefined ? item.notes : parseEditableNotes(patch.notesText),
        }
      }),
    )
  }

  const selectedCadReviewOverride = cadReviewOverridesById[selectedId]
  const quoteInput = useMemo<CncQuoteInput>(() => applyQuoteEdit(selectedItem, selectedEdit), [selectedEdit, selectedItem])
  const quote = useMemo(
    () => applyCadReviewCorrectionAssumptions(calculateWorkspaceCncQuote(quoteInput), selectedCadReviewOverride?.correctionNotes),
    [quoteInput, selectedCadReviewOverride?.correctionNotes],
  )
  const rankedQueue = useMemo(() => {
    const queueInputs = workItems.map((item) => {
      const itemQuoteInput = applyQuoteEdit(item, editStateForItem(item, editsById[item.id]))
      const itemQuote = calculateWorkspaceCncQuote(itemQuoteInput)
      const itemStatus = statusById[item.id] ?? item.status
      return {
        id: item.id,
        customerName: customerLabelFor(item),
        subject: subjectLabelFor(item),
        dueAt: item.dueAt,
        priority: item.priority,
        process: item.quoteInput.process,
        receivedAt: item.receivedAt,
        status: itemStatus,
        estimatedValueCents: itemQuote.totalCents,
      }
    })
    return rankQuoteQueue(queueInputs, { now: queueNow })
  }, [editsById, queueNow, statusById, workItems])
  const visibleQueue = useMemo(
    () => rankedQueue.filter((queueItem) => queueItemMatchesFilters(queueItem, queueFilters)),
    [queueFilters, rankedQueue],
  )
  const activeQueueFilterCount = (Object.values(queueFilters) as boolean[]).filter(Boolean).length
  const toggleQueueFilter = (key: keyof QueueFilterState) =>
    setQueueFilters((current) => ({ ...current, [key]: !current[key] }))
  const capacityCommitmentPlan = useMemo(
    () =>
      buildCapacityCommitmentPlan({
        dailyCapacityMinutesByProcess: buildDailyCapacityMinutesByProcess(workItems),
        items: workItems.map((item) => {
          const itemQuoteInput = applyQuoteEdit(item, editStateForItem(item, editsById[item.id]))
          const itemQuote = calculateWorkspaceCncQuote(itemQuoteInput)
          return {
            customerName: customerLabelFor(item),
            dueAt: item.dueAt,
            estimatedValueCents: itemQuote.totalCents,
            estimatedWorkMinutes: estimateCapacityWorkMinutes(itemQuoteInput),
            id: item.id,
            priority: itemQuoteInput.priority,
            process: itemQuoteInput.process,
            receivedAt: item.receivedAt,
            status: statusById[item.id] ?? item.status,
            subject: subjectLabelFor(item),
          }
        }),
        now: queueNow,
        planningDays: capacityPlanningDays,
      }),
    [editsById, queueNow, statusById, workItems],
  )
  const selectedCapacityCommitment = useMemo(
    () => findCommitmentForItem(capacityCommitmentPlan, selectedId),
    [capacityCommitmentPlan, selectedId],
  )
  const outsideServicePlan = useMemo(
    () =>
      buildOutsideServicePlan({
        items: workItems.map((item) => {
          const itemQuoteInput = applyQuoteEdit(item, editStateForItem(item, editsById[item.id]))
          const itemQuote = calculateWorkspaceCncQuote(itemQuoteInput)
          return {
            customerName: customerLabelFor(item),
            dueAt: item.dueAt,
            estimatedValueCents: itemQuote.totalCents,
            id: item.id,
            outsideServices: (itemQuoteInput.operation.outsideServices ?? []).map((service) => ({
              ...service,
              status: outsideServiceStatusFor(item, service.label),
            })),
            priority: itemQuoteInput.priority,
            process: itemQuoteInput.process,
            receivedAt: item.receivedAt,
            status: statusById[item.id] ?? item.status,
            subject: subjectLabelFor(item),
          }
        }),
        now: queueNow,
        supplierRules: outsideServiceSupplierRules,
      }),
    [editsById, queueNow, statusById, workItems],
  )
  const materialAvailabilityPlan = useMemo(
    () =>
      buildMaterialAvailabilityPlan({
        inventoryLots: materialInventoryLots,
        items: workItems.map((item) => {
          const itemQuoteInput = applyQuoteEdit(item, editStateForItem(item, editsById[item.id]))
          return {
            customerName: customerLabelFor(item),
            dueAt: item.dueAt,
            id: item.id,
            materialName: itemQuoteInput.material.name,
            priority: itemQuoteInput.priority,
            process: itemQuoteInput.process,
            receivedAt: item.receivedAt,
            requiredKg: estimateMaterialRequirementKg(itemQuoteInput),
            status: statusById[item.id] ?? item.status,
            subject: subjectLabelFor(item),
          }
        }),
        now: queueNow,
        purchaseBufferDays: 1,
        supplierOptions: materialSupplierOptions,
      }),
    [editsById, queueNow, statusById, workItems],
  )
  const selectedMaterialCommitment = useMemo(
    () => materialAvailabilityPlan.commitments.find((commitment) => commitment.itemId === selectedId),
    [materialAvailabilityPlan, selectedId],
  )
  const selectedOutsideServiceCommitments = useMemo(
    () => outsideServicePlan.commitments.filter((commitment) => commitment.itemId === selectedId),
    [outsideServicePlan, selectedId],
  )
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
  const processCapabilityMatrix = useMemo(() => buildProcessCapabilityMatrix(), [])
  const processDemoQuotes = useMemo(() => buildProcessDemoQuotes(), [])
  const rfqIntakeReadiness = useMemo(
    () => evaluateRfqIntakeReadiness(parsedRfqForWorkItem(selectedItem), { nowDate: workspaceToday }),
    [selectedItem, workspaceToday],
  )
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
        preferredPrimaryAttachmentName: primaryAttachmentById[selectedId],
        subject: selectedItem.subject,
      }),
    [primaryAttachmentById, quoteInput, selectedId, selectedItem],
  )
  const selectedCadReviewDraft = cadReviewDraftById[selectedId] ?? ""
  const selectedCadCorrectionDraft = {
    ...selectedCadReviewOverride?.correctionNotes,
    ...cadCorrectionDraftById[selectedId],
  }
  const setSelectedCadCorrectionDraft = (field: keyof CadReviewCorrectionNotes, value: string) => {
    setCadCorrectionDraftById((current) => ({
      ...current,
      [selectedId]: {
        ...current[selectedId],
        [field]: value,
      },
    }))
  }
  const saveSelectedCadCorrections = () => {
    const correctionNotes = normalizeCadReviewCorrectionNotes(selectedCadCorrectionDraft)
    if (!correctionNotes && !selectedCadReviewOverride) {
      return
    }
    setCadReviewOverridesById((current) => ({
      ...current,
      [selectedId]: {
        acknowledgedFlags: current[selectedId]?.acknowledgedFlags ?? [],
        correctionNotes,
        note: current[selectedId]?.note ?? "",
        reviewedAt: workspaceNow,
        reviewedBy: workspaceOperatorName,
      },
    }))
  }
  const acknowledgeSelectedCadFlags = () => {
    if (partPreview.manufacturabilityFlags.length === 0) {
      return
    }
    setCadReviewOverridesById((current) => ({
      ...current,
      [selectedId]: {
        acknowledgedFlags: [...partPreview.manufacturabilityFlags],
        correctionNotes: normalizeCadReviewCorrectionNotes(selectedCadCorrectionDraft) ?? current[selectedId]?.correctionNotes,
        note:
          selectedCadReviewDraft.trim() ||
          `Operator acknowledged ${partPreview.manufacturabilityFlags.length} manufacturability flag${partPreview.manufacturabilityFlags.length === 1 ? "" : "s"}.`,
        reviewedAt: workspaceNow,
        reviewedBy: workspaceOperatorName,
      },
    }))
  }
  const resetSelectedCadReview = () => {
    setCadReviewOverridesById((current) => {
      const next = { ...current }
      delete next[selectedId]
      return next
    })
  }
  const offer = useMemo(
    () =>
      buildCncOfferDraft({
        offerNumber: offerNumberFor(selectedItem),
        customer: {
          email: contactEmailFor(selectedItem),
          name: customerLabelFor(selectedItem),
          contactName: selectedItem.contact,
        },
        issuedAt: workspaceToday,
        validUntil: selectedOfferDraftEdit.validUntil.trim() || defaultOfferDraftEditState(selectedItem).validUntil,
        lineDescription: subjectLabelFor(selectedItem),
        notes: parseEditableNotes(selectedOfferDraftEdit.notesText),
        quote,
        revision: {
          createdAt: workspaceToday,
          createdBy: workspaceOperatorName,
          reason: selectedOfferDraftEdit.revisionReason.trim() || "Initial draft",
        },
        rfqReference: selectedItem.id,
        subject: subjectLabelFor(selectedItem),
        terms: parseOfferTermsText(selectedOfferDraftEdit.termsText),
      }),
    [quote, selectedItem, selectedOfferDraftEdit, workspaceOperatorName, workspaceToday],
  )
  const offerExportPackage = useMemo(
    () =>
      buildOfferExportPackage({
        offer,
        alternates: buildOfferAlternateInputs(quoteInput),
      }),
    [offer, quoteInput],
  )
  const offerLifecycle = useMemo(
    () => buildOfferLifecycleTimeline(offer, offerLifecycleEventsById[selectedId] ?? []),
    [offer, offerLifecycleEventsById, selectedId],
  )
  const offerFollowUpScheduledAt = useMemo(() => latestOfferFollowUpScheduledAt(selectedActions, offer), [offer, selectedActions])
  const offerSendReadiness = useMemo(
    () =>
      evaluateOfferSendReadiness({
        exportPackage: offerExportPackage,
        followUpScheduledAt: offerFollowUpScheduledAt,
        nowDate: workspaceToday,
        offer,
      }),
    [offer, offerExportPackage, offerFollowUpScheduledAt, workspaceToday],
  )
  const quoteApproval = useMemo(
    () =>
      evaluateQuoteApproval({
        capacityCommitment: selectedCapacityCommitment,
        customer: approvalCustomerPolicyFor(selectedItem),
        quote,
        reviewedAt: workspaceToday,
      }),
    [quote, selectedCapacityCommitment, selectedItem, workspaceToday],
  )
  const quoteReleaseGate = useMemo(
    () =>
      evaluateQuoteReleaseGate({
        approval: quoteApproval,
        capacityCommitment: selectedCapacityCommitment,
        checkedAt: workspaceNow,
        intakeReadiness: rfqIntakeReadiness,
        materialCommitment: selectedMaterialCommitment,
        offerNumber: offer.offerNumber,
        offerSendReadiness,
        outsideServiceCommitments: selectedOutsideServiceCommitments,
        rfqId: selectedItem.id,
      }),
    [
      offer.offerNumber,
      offerSendReadiness,
      quoteApproval,
      rfqIntakeReadiness,
      selectedCapacityCommitment,
      selectedItem.id,
      selectedMaterialCommitment,
      selectedOutsideServiceCommitments,
      workspaceNow,
    ],
  )
  const offerReleasePlan = useMemo(
    () =>
      buildOfferReleasePlan({
        actor: workspaceOperatorName,
        currentRfqStatus: selectedStatus,
        exportPackage: offerExportPackage,
        followUpDueAt: offerFollowUpScheduledAt,
        followUpTaskId: `follow-up-${selectedItem.id}`,
        offer,
        offerId: offer.offerNumber.toLowerCase(),
        releaseGate: quoteReleaseGate,
        reviewedBy: selectedReleaseReview?.reviewedBy,
        reviewNote: selectedReleaseReview?.note,
        rfqId: selectedItem.id,
        timezone: workspaceTimezone,
      }),
    [
      offer,
      offerExportPackage,
      offerFollowUpScheduledAt,
      quoteReleaseGate,
      selectedReleaseReview,
      selectedItem.id,
      selectedStatus,
      workspaceOperatorName,
      workspaceTimezone,
    ],
  )
  const offerReleaseExecutionPreview = useMemo(
    () =>
      buildOfferReleaseExecutionRun({
        actor: workspaceOperatorName,
        executedAt: workspaceNow,
        mode: "dry_run",
        plan: offerReleasePlan,
      }),
    [offerReleasePlan, workspaceNow, workspaceOperatorName],
  )
  const offerReleaseExecution = selectedReleaseExecutionRuns.at(-1) ?? offerReleaseExecutionPreview
  const offerReleaseHistory = useMemo(
    () => summarizeOfferReleaseExecutionHistory([offerReleaseExecutionPreview, ...selectedReleaseExecutionRuns]),
    [offerReleaseExecutionPreview, selectedReleaseExecutionRuns],
  )
  const offerReplySync = offerRepliesById[selectedId]
  const offerReplySnapshot = offerReplyPersistenceSnapshotsById[selectedId]
  const integrationStatus = useMemo(
    () =>
      summarizeWorkspaceIntegrationStatus({
        connectorErrorCount: selectedConnectorSyncErrorCount,
        connectorSnapshot: selectedConnectorSnapshot,
        followUpScheduledAt: offerFollowUpScheduledAt,
        persistenceMode: workspacePersistenceRuntime.mode,
        providerRuns: selectedItem.providerRuns,
        replySync: offerReplySync,
        rfqId: selectedItem.id,
        syncErrorCount: persistenceSyncErrorCount,
      }),
    [
      offerFollowUpScheduledAt,
      offerReplySync,
      persistenceSyncErrorCount,
      selectedConnectorSyncErrorCount,
      selectedConnectorSnapshot,
      selectedItem.id,
      selectedItem.providerRuns,
      workspacePersistenceRuntime.mode,
    ],
  )
  const syncConnectorInbox = async () => {
    const item = selectedItem
    const rfqId = item.id
    if (connectorSyncLocksRef.current.has(rfqId)) {
      return
    }

    connectorSyncLocksRef.current.add(rfqId)
    setConnectorSyncingById((current) => ({ ...current, [rfqId]: true }))

    const connectorSnapshot = connectorSnapshotsById[rfqId] ?? emptyConnectorSnapshot
    const fallbackMessages = buildConnectorRfqMessages(item)
    const orchestrator = createConnectorRfqSyncOrchestrator({
      calendarScheduler: createCalendarRfqScheduler({
        fallbackProvider: createMockCalendarRfqProvider(),
        provider: createMockCalendarRfqProvider(),
      }),
      gmailAdapter: createGmailRfqIntakeAdapter({
        fallbackProvider: createMockGmailRfqProvider({ messages: fallbackMessages }),
        provider: createMockGmailRfqProvider({ messages: fallbackMessages }),
      }),
      resolveRfqId: (record) => gmailRecordRfqId(record, rfqId),
    })
    const persistence = createLocalConnectorSyncPersistence({
      initialSnapshot: connectorSnapshot,
      payloadOptions: {
        actorName: "FactoryBid connector",
        resolveRfqId: (candidateRfqId) => (candidateRfqId === rfqId ? rfqId : undefined),
      },
    })

    try {
      const result = await orchestrator.syncRfqInbox({
        dueReminderMinutes: 30,
        gmail: {
          maxResults: 2,
          query: "rfq",
        },
        quoteWorkMinutes: 120,
        timezone: workspaceTimezone,
      })
      const snapshot = await persistence.recordSync(result)
      setConnectorSnapshotsById((current) => ({ ...current, [rfqId]: snapshot }))
      const importedItems = importedWorkItemsFromConnectorSync(result, rfqId)
      if (importedItems.length > 0) {
        setWorkItems((current) => {
          const seenIds = new Set(current.map((workItem) => workItem.id))
          const nextImports = importedItems.filter((workItem) => {
            if (seenIds.has(workItem.id)) {
              return false
            }
            seenIds.add(workItem.id)
            return true
          })
          return nextImports.length > 0 ? [...nextImports, ...current] : current
        })
      }
    } catch {
      setConnectorSyncErrorCountById((current) => ({ ...current, [rfqId]: (current[rfqId] ?? 0) + 1 }))
    } finally {
      connectorSyncLocksRef.current.delete(rfqId)
      setConnectorSyncingById((current) => ({ ...current, [rfqId]: false }))
    }
  }
  const syncOfferReplies = async () => {
    try {
      const adapter = createGmailOfferReplyAdapter({
        fallbackProvider: createMockGmailRfqProvider({ messages: buildOfferReplyMessages(selectedItem, offer) }),
        provider: createMockGmailRfqProvider({ shouldFail: true }),
      })
      const localOfferId = offer.offerNumber.toLowerCase()
      const localQuoteId = `quote-${selectedItem.id.slice(-3)}`
      const previousSnapshot = offerReplyPersistenceSnapshotsById[selectedId]
      const localPersistence = createLocalOfferReplySyncPersistence({
        initialSnapshot: previousSnapshot,
        payloadOptions: {
          actorName: "FactoryBid replies",
          offerId: localOfferId,
          quoteId: localQuoteId,
          rfqId: selectedItem.id,
        },
      })
      const convexBridge = createBrowserConvexOfferReplyBridge()
      const convexOfferId = convexBridge?.resolveOfferId(localOfferId)
      const persistence =
        convexBridge && convexOfferId
          ? createConvexOfferReplySyncPersistence({
              fallback: localPersistence,
              mutationRef: convexBridge.mutationRef,
              onSyncError: () => setPersistenceSyncErrorCount((count) => count + 1),
              payloadOptions: {
                actorName: "FactoryBid replies",
                offerId: convexOfferId,
                quoteId: convexBridge.resolveQuoteId(localQuoteId),
                rfqId: convexBridge.resolveRfqId(selectedItem.id),
              },
              runMutation: convexBridge.runMutation,
            })
          : localPersistence
      const result = await adapter.sync({
        followUpTaskIds: [`follow-up-${selectedItem.id}`],
        maxResults: 5,
        offerNumber: offer.offerNumber,
        query: `offer ${offer.offerNumber}`,
      })
      const snapshot = await persistence.recordSync(result)
      setOfferReplyPersistenceSnapshotsById((current) => ({ ...current, [selectedId]: snapshot }))
      setOfferRepliesById((current) => ({ ...current, [selectedId]: result }))
    } catch {
      setPersistenceSyncErrorCount((count) => count + 1)
    }
  }
  const appendOfferLifecycleEvent = (event: OfferLifecycleEventInput) => {
    const rfqId = selectedId
    setOfferLifecycleEventsById((current) => ({
      ...current,
      [rfqId]: [...(current[rfqId] ?? []), event],
    }))
  }
  const markOfferSent = () => {
    appendOfferLifecycleEvent({
      actor: workspaceOperatorName,
      kind: "sent",
      note: `Sent customer-ready offer ${offer.offerNumber}.`,
      occurredAt: workspaceNow,
    })
  }
  const scheduleOfferLifecycleFollowUp = () => {
    appendOfferLifecycleEvent({
      actor: workspaceOperatorName,
      followUpDueAt: offerLifecycleFollowUpDueAt,
      followUpTaskId: offerLifecycleFollowUpTaskId(selectedItem.id),
      kind: "follow_up_scheduled",
      note: "Calendar hold prepared for offer follow-up.",
      occurredAt: workspaceNow,
    })
  }
  const completeOfferLifecycleFollowUp = () => {
    const task = offerLifecycle.followUpTasks.find((candidate) => candidate.status === "open")
    if (!task) {
      return
    }
    appendOfferLifecycleEvent({
      actor: workspaceOperatorName,
      followUpTaskId: task.id,
      kind: "follow_up_completed",
      note: "Operator confirmed the follow-up was completed.",
      occurredAt: workspaceNow,
    })
  }
  const acceptOffer = () => {
    appendOfferLifecycleEvent({
      actor: selectedItem.contact,
      kind: "accepted",
      note: "Customer accepted the offer.",
      occurredAt: workspaceNow,
    })
  }
  const declineOffer = () => {
    appendOfferLifecycleEvent({
      actor: selectedItem.contact,
      kind: "declined",
      note: "Customer declined the offer.",
      occurredAt: workspaceNow,
    })
  }
  const markReleaseReviewed = () => {
    setReleaseReviewsById((current) => ({
      ...current,
      [selectedId]: {
        note: `Manager reviewed ${quoteReleaseGate.warningCount} release warning${quoteReleaseGate.warningCount === 1 ? "" : "s"}.`,
        reviewedAt: workspaceNow,
        reviewedBy: workspaceOperatorName,
      },
    }))
  }
  const executeReleasePlan = async () => {
    const executionRfqId = selectedId
    const alreadyCommitted = selectedReleaseExecutionRuns.some((run) => run.mode === "commit" && run.status === "succeeded")
    if (offerReleasePlan.status !== "ready" || alreadyCommitted || releaseExecutionLocksRef.current.has(executionRfqId)) {
      return
    }

    releaseExecutionLocksRef.current.add(executionRfqId)
    try {
      const run = buildOfferReleaseExecutionRun({
        actor: workspaceOperatorName,
        commandOutcomes: buildLocalReleaseCommandOutcomes(offerReleasePlan),
        executedAt: workspaceNow,
        mode: "commit",
        plan: offerReleasePlan,
      })

      for (const action of run.workspaceActions) {
        await recordWorkspaceAction(action)
      }
      setReleaseExecutionRunsById((current) => ({
        ...current,
        [executionRfqId]: [...(current[executionRfqId] ?? []), run],
      }))
      if (run.lifecycleEvents.length > 0) {
        setOfferLifecycleEventsById((current) => ({
          ...current,
          [executionRfqId]: [...(current[executionRfqId] ?? []), ...run.lifecycleEvents],
        }))
      }
    } finally {
      releaseExecutionLocksRef.current.delete(executionRfqId)
    }
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
      actor: workspaceOperatorName,
      fromStatus: selectedStatus,
      kind: "status_change",
      occurredAt: workspaceNow,
      rfqId: selectedItem.id,
      toStatus,
    })
    await recordWorkspaceAction(action)
  }
  const saveScenario = async () => {
    await recordWorkspaceAction(
      buildWorkspaceAction({
        actor: workspaceOperatorName,
        kind: "scenario_saved",
        occurredAt: workspaceNow,
        quoteId: `quote-${selectedItem.id.slice(-3)}`,
        rfqId: selectedItem.id,
        scenarioId: `${selectedItem.id}-current-edits`,
      }),
    )
  }
  const createFollowUp = async () => {
    await recordWorkspaceAction(
      buildWorkspaceAction({
        actor: workspaceOperatorName,
        followUpDueAt: followUpDueAtFor(selectedItem),
        kind: "follow_up_created",
        occurredAt: workspaceNow,
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
        actor: workspaceOperatorName,
        kind: "handoff_note",
        note,
        occurredAt: workspaceNow,
        rfqId: selectedItem.id,
      }),
    )
    setHandoffDraftById((current) => ({ ...current, [selectedItem.id]: "" }))
  }
  const createRfq = (values: ManualRfqFormValues) => {
    manualRfqCountRef.current += 1
    const id = `rfq-manual-${manualRfqCountRef.current}`
    const quoteInput = buildManualCncQuoteInput({
      partNumber: values.partNumber,
      process: values.process,
      materialKey: values.materialKey,
      quantity: values.quantity,
      priority: values.priority,
      setupMinutes: values.setupMinutes,
      cycleMinutesPerPart: values.cycleMinutesPerPart,
      toleranceClass: values.toleranceClass,
      finish: values.finish,
    })
    const notes = values.notes
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
    const newItem: QuoteWorkItem = {
      id,
      customer: values.customer.trim() || "New customer",
      contact: values.contact.trim(),
      subject: values.subject.trim() || quoteInput.partNumber,
      received: "Just now",
      receivedAt: workspaceNow,
      due: formatManualDueLabel(values.dueDate),
      dueAt: manualDueAtFor(values.dueDate),
      priority: values.priority,
      status: "new",
      source: "manual",
      tags: buildManualTags(quoteInput),
      quoteInput,
      attachments: [],
      cadMetadata: [],
      notes,
      providerRuns: [],
    }
    setWorkItems((current) => [newItem, ...current])
    setSelectedId(id)
    setActiveView("triage")
    setIsCreatingRfq(false)
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
          <PersistenceStatus
            label={workspacePersistenceRuntime.label}
            mode={workspacePersistenceRuntime.mode}
            syncErrorCount={persistenceSyncErrorCount}
          />
          <Button
            disabled={selectedConnectorSyncing}
            onClick={() => {
              void syncConnectorInbox()
            }}
            type="button"
            variant="outline"
            size="sm"
          >
            <Mail aria-hidden="true" />
            RFQ sync
          </Button>
          <Button
            onClick={() => {
              setActiveView("offer")
              void syncOfferReplies()
            }}
            type="button"
            variant="outline"
            size="sm"
          >
            <RefreshCw aria-hidden="true" />
            Reply sync
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
            <span className="queue-count">
              {activeQueueFilterCount > 0 ? `${visibleQueue.length}/${workItems.length}` : workItems.length}
            </span>
          </div>
          <Button
            className="new-rfq-button"
            onClick={() => setIsCreatingRfq(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus aria-hidden="true" />
            New RFQ
          </Button>
          <div className="queue-filters" role="group" aria-label="Queue filters">
            <Button
              aria-pressed={queueFilters.due}
              onClick={() => toggleQueueFilter("due")}
              size="sm"
              type="button"
              variant={queueFilters.due ? "secondary" : "ghost"}
            >
              Due soon
            </Button>
            <Button
              aria-pressed={queueFilters.rush}
              onClick={() => toggleQueueFilter("rush")}
              size="sm"
              type="button"
              variant={queueFilters.rush ? "secondary" : "ghost"}
            >
              Rush
            </Button>
            <Button
              aria-pressed={queueFilters.cnc}
              onClick={() => toggleQueueFilter("cnc")}
              size="sm"
              type="button"
              variant={queueFilters.cnc ? "secondary" : "ghost"}
            >
              CNC
            </Button>
          </div>
          <div className="queue-list">
            {visibleQueue.map((queueItem) => {
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
            {visibleQueue.length === 0 ? (
              <div className="queue-empty" role="status">
                <Inbox aria-hidden="true" />
                <span>No RFQs match these filters.</span>
                <Button
                  onClick={() => setQueueFilters({ cnc: false, due: false, rush: false })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Clear filters
                </Button>
              </div>
            ) : null}
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
              <Button
                aria-controls="rfq-attachments"
                aria-expanded={showAttachments}
                aria-label="Open attachments"
                onClick={() => setShowAttachments((open) => !open)}
                size="sm"
                title="Open attachments"
                type="button"
                variant="outline"
              >
                <PanelRight aria-hidden="true" />
                {selectedItem.attachments.length}
              </Button>
            </div>
          </div>

          {showAttachments ? (
            <div className="attachment-disclosure" id="rfq-attachments" aria-label="RFQ attachments">
              {selectedItem.attachments.map((attachment, index) => (
                <div className="attachment-disclosure-row" key={`${attachment.fileName}:${attachment.kind}:${attachment.sizeBytes ?? "unknown"}:${index}`}>
                  <FileText aria-hidden="true" />
                  <span className="attachment-name">{attachment.fileName}</span>
                  <span className="attachment-kind">{humanizeKey(attachment.kind)}</span>
                  {attachment.sizeBytes !== undefined ? (
                    <span className="attachment-size">{formatFileSize(attachment.sizeBytes)}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

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
          <ProcessCapabilityPanel activeProcess={selectedItem.quoteInput.process} matrix={processCapabilityMatrix} />
          <ProcessDemoQuotesPanel demos={processDemoQuotes} />
          <CapacityCommitmentPanel plan={capacityCommitmentPlan} selectedItem={selectedItem} />
          <MaterialAvailabilityPanel plan={materialAvailabilityPlan} selectedItem={selectedItem} />
          <OutsideServicePanel plan={outsideServicePlan} selectedItem={selectedItem} />

          {activeView === "triage" ? (
            <TriageView
              actions={selectedActions}
              followUpNow={queueNow}
              followUpReplySync={offerReplySync}
              handoffDraft={handoffDraft}
              item={selectedItem}
              onAddHandoffNote={addHandoffNote}
              onAdvanceStatus={advanceStatus}
              onCreateFollowUp={createFollowUp}
              onHandoffDraftChange={(value) => setHandoffDraftById((current) => ({ ...current, [selectedItem.id]: value }))}
              onUpdateFields={updateSelectedRfqFields}
              onSaveScenario={saveScenario}
              readiness={rfqIntakeReadiness}
              status={selectedStatus}
            />
          ) : null}
          {activeView === "costing" ? (
            <CostingView
              cadReviewDraft={selectedCadReviewDraft}
              cadCorrectionDraft={selectedCadCorrectionDraft}
              cadReviewOverride={selectedCadReviewOverride}
              cycleMinutes={cycleMinutes}
              partPreview={partPreview}
              machineHourlyRateCents={machineHourlyRateCents}
              marginPercent={marginPercent}
              materialCostCentsPerKg={materialCostCentsPerKg}
              quantity={quantity}
              quote={quote}
              rush={rush}
              scenarioComparison={scenarioComparison}
              selectedItem={selectedItem}
              onAcknowledgeCadFlags={acknowledgeSelectedCadFlags}
              onCadReviewDraftChange={(value) => setCadReviewDraftById((current) => ({ ...current, [selectedId]: value }))}
              onCadCorrectionDraftChange={setSelectedCadCorrectionDraft}
              onPrimaryAttachmentChange={(fileName) => setPrimaryAttachmentById((current) => ({ ...current, [selectedId]: fileName }))}
              onResetCadReview={resetSelectedCadReview}
              onSaveCadCorrections={saveSelectedCadCorrections}
              setCycleMinutes={(value) => updateSelectedEdit({ cycleMinutes: value })}
              setMachineHourlyRateCents={(value) => updateSelectedEdit({ machineHourlyRateCents: value })}
              setMarginPercent={(value) => updateSelectedEdit({ marginPercent: value })}
              setMaterialCostCentsPerKg={(value) => updateSelectedEdit({ materialCostCentsPerKg: value })}
              setQuantity={(value) => updateSelectedEdit({ quantity: value })}
              setRush={(value) => updateSelectedEdit({ rush: value })}
              setSetupMinutes={(value) => updateSelectedEdit({ setupMinutes: value })}
              setupMinutes={setupMinutes}
            />
          ) : null}
          {activeView === "offer" ? (
            <OfferView
              approval={quoteApproval}
              exportPackage={offerExportPackage}
              lifecycle={offerLifecycle}
              offer={offer}
              offerDraftEdit={selectedOfferDraftEdit}
              offerExportEvents={selectedOfferExportEvents}
              onAcceptOffer={acceptOffer}
              onCompleteFollowUp={completeOfferLifecycleFollowUp}
              onDeclineOffer={declineOffer}
              onDraftEditChange={updateSelectedOfferDraftEdit}
              onExecuteRelease={executeReleasePlan}
              onMarkReleaseReviewed={markReleaseReviewed}
              onMarkSent={markOfferSent}
              onRecordExportEvent={recordSelectedOfferExportEvent}
              onScheduleFollowUp={scheduleOfferLifecycleFollowUp}
              readiness={offerSendReadiness}
              releaseGate={quoteReleaseGate}
              releaseExecution={offerReleaseExecution}
              releaseHistory={offerReleaseHistory}
              releasePlan={offerReleasePlan}
              releaseReview={selectedReleaseReview}
              replySnapshot={offerReplySnapshot}
              replySync={offerReplySync}
              onSyncReplies={syncOfferReplies}
            />
          ) : null}
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
          <IntegrationStatusPanel
            calendarPlan={selectedRfqCalendarPlan}
            connectorSnapshot={selectedConnectorSnapshot}
            isConnectorSyncing={selectedConnectorSyncing}
            onSyncConnector={syncConnectorInbox}
            onSyncReplies={syncOfferReplies}
            rfqId={selectedItem.id}
            status={integrationStatus}
          />
          <ProviderRunReviewPanel audits={selectedItem.providerRuns} />
        </aside>
      </section>
      {isCreatingRfq ? <RfqCreateDialog onCancel={() => setIsCreatingRfq(false)} onCreate={createRfq} /> : null}
    </main>
  )
}

interface ManualRfqFormValues {
  customer: string
  contact: string
  subject: string
  partNumber: string
  process: ManualCncProcess
  materialKey: ManualMaterialKey
  quantity: number
  priority: ManualPriority
  dueDate: string
  setupMinutes: number
  cycleMinutesPerPart: number
  toleranceClass: string
  finish: string
  notes: string
}

function readWorkspaceLocalState(): WorkspaceLocalState | undefined {
  if (typeof window === "undefined") {
    return undefined
  }

  try {
    const raw = window.localStorage.getItem(workspaceLocalStorageKey)
    return raw ? parseWorkspaceLocalState(JSON.parse(raw)) : undefined
  } catch {
    return undefined
  }
}

function writeWorkspaceLocalState(state: WorkspaceLocalState) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(workspaceLocalStorageKey, JSON.stringify(state))
  } catch {
    // Browser storage may be disabled or full; keep the in-memory workspace usable.
  }
}

function parseWorkspaceLocalState(value: unknown): WorkspaceLocalState | undefined {
  if (!isObjectRecord(value) || value.version !== 1 || !Array.isArray(value.workItems) || value.workItems.length === 0) {
    return undefined
  }

  if (!value.workItems.every(isPersistedQuoteWorkItem)) {
    return undefined
  }

  const actionsById = optionalRecordOfArrays(value.actionsById, isWorkspaceActionRecord)
  const cadReviewOverridesById = optionalRecordOfValues(value.cadReviewOverridesById, isCadReviewOverrideState)
  const editsById = optionalRecordOfValues(value.editsById, isQuoteEditStatePatch)
  const offerDraftEditsById = optionalRecordOfValues(value.offerDraftEditsById, isOfferDraftEditStatePatch)
  const offerExportEventsById = optionalRecordOfArrays(value.offerExportEventsById, isOfferExportHistoryEvent)
  const offerLifecycleEventsById = optionalRecordOfArrays(value.offerLifecycleEventsById, isOfferLifecycleEventInput)
  const primaryAttachmentById = value.primaryAttachmentById === undefined ? {} : isRecordOfStrings(value.primaryAttachmentById) ? value.primaryAttachmentById : undefined
  const releaseExecutionRunsById = optionalRecordOfArrays(value.releaseExecutionRunsById, isOfferReleaseExecutionRun)
  const releaseReviewsById = optionalRecordOfValues(value.releaseReviewsById, isReleaseReviewState)
  const statusById = optionalRecordOfValues(value.statusById, isQuoteQueueStatus)
  if (
    !actionsById ||
    !cadReviewOverridesById ||
    !editsById ||
    !offerDraftEditsById ||
    !offerExportEventsById ||
    !offerLifecycleEventsById ||
    !primaryAttachmentById ||
    !releaseReviewsById ||
    !statusById
  ) {
    return undefined
  }

  const workItems = value.workItems
  const activeView = value.activeView === "triage" || value.activeView === "costing" || value.activeView === "offer" ? value.activeView : "costing"
  const selectedId =
    typeof value.selectedId === "string" && workItems.some((item) => item.id === value.selectedId)
      ? value.selectedId
      : fallbackSelectedId(workItems)

  return {
    actionsById,
    activeView,
    cadReviewOverridesById,
    editsById,
    offerDraftEditsById,
    offerExportEventsById,
    offerLifecycleEventsById,
    primaryAttachmentById,
    releaseExecutionRunsById: releaseExecutionRunsById ?? {},
    releaseReviewsById,
    selectedId,
    statusById,
    version: 1,
    workItems,
  }
}

function restoredSelectedId(state: WorkspaceLocalState | undefined, workItems: QuoteWorkItem[]): string {
  if (state?.selectedId && workItems.some((item) => item.id === state.selectedId)) {
    return state.selectedId
  }
  return fallbackSelectedId(workItems)
}

function fallbackSelectedId(workItems: QuoteWorkItem[]): string {
  return workItems[0]?.id ?? initialWorkItems[0].id
}

function parsedRfqForCalendarPlan(item: QuoteWorkItem): ParsedRfqIntake {
  return {
    attachments: item.attachments,
    currency: "EUR",
    customerName: item.customer,
    dueAt: optionalTimestampFor(item.dueAt),
    extractedFields: [],
    parts: [
      {
        attachmentNames: item.attachments.map((attachment) => attachment.fileName),
        description: item.subject,
        materialText: item.quoteInput.material.name,
        partNumber: item.quoteInput.partNumber,
        process: item.quoteInput.process,
        quantity: item.quoteInput.quantity,
      },
    ],
    priority: item.priority,
    receivedAt: new Date(item.receivedAt).getTime(),
    subject: subjectLabelFor(item),
    summary: item.notes.join(" "),
  }
}

function optionalRecordOfValues<T>(value: unknown, isValue: (item: unknown) => item is T): Record<string, T> | undefined {
  if (value === undefined) {
    return {}
  }
  if (!isObjectRecord(value)) {
    return undefined
  }

  const entries = Object.entries(value)
  if (!entries.every(([, item]) => isValue(item))) {
    return undefined
  }
  return Object.fromEntries(entries) as Record<string, T>
}

function optionalRecordOfArrays<T>(value: unknown, isValue: (item: unknown) => item is T): Record<string, T[]> | undefined {
  if (value === undefined) {
    return {}
  }
  if (!isObjectRecord(value)) {
    return undefined
  }

  const entries = Object.entries(value)
  if (!entries.every(([, items]) => Array.isArray(items) && items.every(isValue))) {
    return undefined
  }
  return Object.fromEntries(entries) as Record<string, T[]>
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  return isObjectRecord(value) && Object.values(value).every((item) => typeof item === "string")
}

function isPersistedQuoteWorkItem(value: unknown): value is QuoteWorkItem {
  return (
    isObjectRecord(value) &&
    typeof value.id === "string" &&
    typeof value.customer === "string" &&
    typeof value.contact === "string" &&
    typeof value.subject === "string" &&
    typeof value.received === "string" &&
    typeof value.receivedAt === "string" &&
    typeof value.due === "string" &&
    typeof value.dueAt === "string" &&
    isPriority(value.priority) &&
    (value.status === "new" || value.status === "triage" || value.status === "estimating" || value.status === "ready") &&
    (value.source === "gmail" || value.source === "manual" || value.source === "import") &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string") &&
    Array.isArray(value.attachments) &&
    Array.isArray(value.cadMetadata) &&
    Array.isArray(value.notes) &&
    value.notes.every((note) => typeof note === "string") &&
    Array.isArray(value.providerRuns) &&
    isCncQuoteInput(value.quoteInput)
  )
}

function isCncQuoteInput(value: unknown): value is CncQuoteInput {
  return (
    isObjectRecord(value) &&
    typeof value.partNumber === "string" &&
    (value.process === "cnc_milling" || value.process === "cnc_turning") &&
    isFiniteNumber(value.quantity) &&
    isPriority(value.priority) &&
    isCncMaterial(value.material) &&
    isCncMachine(value.machine) &&
    isCncRateCard(value.rateCard) &&
    isCncDimensions(value.stockDimensions) &&
    (value.finishedDimensions === undefined || isCncDimensions(value.finishedDimensions)) &&
    isCncOperation(value.operation) &&
    (value.toleranceClass === undefined || typeof value.toleranceClass === "string") &&
    (value.finish === undefined || typeof value.finish === "string")
  )
}

function isCncMaterial(value: unknown) {
  return (
    isObjectRecord(value) &&
    typeof value.name === "string" &&
    isFiniteNumber(value.densityKgM3) &&
    isFiniteNumber(value.costCentsPerKg) &&
    (value.yieldFactor === undefined || isFiniteNumber(value.yieldFactor))
  )
}

function isCncMachine(value: unknown) {
  return (
    isObjectRecord(value) &&
    typeof value.name === "string" &&
    isFiniteNumber(value.hourlyRateCents) &&
    isFiniteNumber(value.setupRateCents) &&
    (value.capacityMinutesPerDay === undefined || isFiniteNumber(value.capacityMinutesPerDay))
  )
}

function isCncRateCard(value: unknown) {
  return (
    isObjectRecord(value) &&
    (value.currency === "EUR" || value.currency === "USD" || value.currency === "GBP") &&
    isFiniteNumber(value.setupMinimumCents) &&
    isFiniteNumber(value.minimumOrderCents) &&
    isFiniteNumber(value.marginPercent) &&
    isFiniteNumber(value.rushMultiplier) &&
    isFiniteNumber(value.baseLeadTimeDays) &&
    (value.rushLeadTimeDays === undefined || isFiniteNumber(value.rushLeadTimeDays))
  )
}

function isCncDimensions(value: unknown) {
  return (
    isObjectRecord(value) &&
    (value.lengthMm === undefined || isFiniteNumber(value.lengthMm)) &&
    (value.widthMm === undefined || isFiniteNumber(value.widthMm)) &&
    (value.heightMm === undefined || isFiniteNumber(value.heightMm)) &&
    (value.diameterMm === undefined || isFiniteNumber(value.diameterMm))
  )
}

function isCncOperation(value: unknown) {
  return (
    isObjectRecord(value) &&
    isFiniteNumber(value.setupMinutes) &&
    isFiniteNumber(value.cycleMinutesPerPart) &&
    (value.programmingMinutes === undefined || isFiniteNumber(value.programmingMinutes)) &&
    (value.fixtureMinutes === undefined || isFiniteNumber(value.fixtureMinutes)) &&
    (value.inspectionMinutesPerPart === undefined || isFiniteNumber(value.inspectionMinutesPerPart)) &&
    (value.consumableCentsPerPart === undefined || isFiniteNumber(value.consumableCentsPerPart)) &&
    (value.complexityMultiplier === undefined || isFiniteNumber(value.complexityMultiplier)) &&
    (value.outsideServices === undefined ||
      (Array.isArray(value.outsideServices) &&
        value.outsideServices.every(
          (service) =>
            isObjectRecord(service) && typeof service.label === "string" && isFiniteNumber(service.amountCents),
        )))
  )
}

function isQuoteEditStatePatch(value: unknown): value is Partial<QuoteEditState> {
  return (
    isObjectRecord(value) &&
    isFiniteNumber(value.cycleMinutes) &&
    (value.machineHourlyRateCents === undefined || isFiniteNumber(value.machineHourlyRateCents)) &&
    (value.marginPercent === undefined || isFiniteNumber(value.marginPercent)) &&
    (value.materialCostCentsPerKg === undefined || isFiniteNumber(value.materialCostCentsPerKg)) &&
    isFiniteNumber(value.quantity) &&
    typeof value.rush === "boolean" &&
    isFiniteNumber(value.setupMinutes)
  )
}

function isOfferDraftEditStatePatch(value: unknown): value is Partial<OfferDraftEditState> {
  return (
    isObjectRecord(value) &&
    (value.notesText === undefined || typeof value.notesText === "string") &&
    (value.revisionReason === undefined || typeof value.revisionReason === "string") &&
    (value.termsText === undefined || typeof value.termsText === "string") &&
    (value.validUntil === undefined || typeof value.validUntil === "string")
  )
}

function isOfferExportHistoryEvent(value: unknown): value is OfferExportHistoryEvent {
  return (
    isObjectRecord(value) &&
    typeof value.id === "string" &&
    (value.kind === "copy_text" || value.kind === "download_pdf" || value.kind === "download_text") &&
    typeof value.message === "string" &&
    typeof value.occurredAt === "string" &&
    (value.status === "failed" || value.status === "succeeded") &&
    (value.fileName === undefined || typeof value.fileName === "string")
  )
}

function isReleaseReviewState(value: unknown): value is ReleaseReviewState {
  return (
    isObjectRecord(value) &&
    typeof value.note === "string" &&
    typeof value.reviewedAt === "string" &&
    typeof value.reviewedBy === "string"
  )
}

function isCadReviewOverrideState(value: unknown): value is CadReviewOverrideState {
  return (
    isObjectRecord(value) &&
    Array.isArray(value.acknowledgedFlags) &&
    value.acknowledgedFlags.every((flag) => typeof flag === "string") &&
    (value.correctionNotes === undefined || isCadReviewCorrectionNotes(value.correctionNotes)) &&
    typeof value.note === "string" &&
    typeof value.reviewedAt === "string" &&
    typeof value.reviewedBy === "string"
  )
}

function isCadReviewCorrectionNotes(value: unknown): value is CadReviewCorrectionNotes {
  return (
    isObjectRecord(value) &&
    (value.dimensions === undefined || typeof value.dimensions === "string") &&
    (value.material === undefined || typeof value.material === "string") &&
    (value.process === undefined || typeof value.process === "string")
  )
}

function normalizeCadReviewCorrectionNotes(notes: CadReviewCorrectionNotes): CadReviewCorrectionNotes | undefined {
  const normalized = {
    dimensions: notes.dimensions?.trim() || undefined,
    material: notes.material?.trim() || undefined,
    process: notes.process?.trim() || undefined,
  }
  return normalized.dimensions || normalized.material || normalized.process ? normalized : undefined
}

function cadReviewCorrectionNotesEqual(left: CadReviewCorrectionNotes | undefined, right: CadReviewCorrectionNotes | undefined): boolean {
  return (
    (left?.dimensions ?? "") === (right?.dimensions ?? "") &&
    (left?.material ?? "") === (right?.material ?? "") &&
    (left?.process ?? "") === (right?.process ?? "")
  )
}

function applyCadReviewCorrectionAssumptions(quote: CncQuoteResult, correctionNotes: CadReviewCorrectionNotes | undefined): CncQuoteResult {
  const normalized = correctionNotes ? normalizeCadReviewCorrectionNotes(correctionNotes) : undefined
  if (!normalized) {
    return quote
  }

  return {
    ...quote,
    assumptions: [
      ...quote.assumptions,
      ...(normalized.dimensions ? [{ key: "cad_review_dimensions", value: normalized.dimensions }] : []),
      ...(normalized.material ? [{ key: "cad_review_material", value: normalized.material }] : []),
      ...(normalized.process ? [{ key: "cad_review_process", value: normalized.process }] : []),
    ],
  }
}

function isOfferReleaseExecutionRun(value: unknown): value is OfferReleaseExecutionRun {
  return (
    isObjectRecord(value) &&
    value.executionVersion === "offer-release-execution.v1" &&
    typeof value.executionFingerprint === "string" &&
    typeof value.actor === "string" &&
    typeof value.executedAt === "string" &&
    typeof value.releaseAt === "string" &&
    (value.mode === "commit" || value.mode === "dry_run") &&
    isOfferReleaseExecutionStatus(value.status) &&
    typeof value.offerId === "string" &&
    typeof value.offerNumber === "string" &&
    typeof value.rfqId === "string" &&
    value.planVersion === "offer-release-plan.v1" &&
    Array.isArray(value.commands) &&
    value.commands.every(isOfferReleaseCommandExecution) &&
    Array.isArray(value.lifecycleEvents) &&
    value.lifecycleEvents.every(isOfferLifecycleEventInput) &&
    Array.isArray(value.workspaceActions) &&
    value.workspaceActions.every(isWorkspaceActionRecord) &&
    Array.isArray(value.calendarEvents) &&
    value.calendarEvents.every(isCalendarRfqEventDraft) &&
    Array.isArray(value.nextActions) &&
    value.nextActions.every((action) => typeof action === "string") &&
    Array.isArray(value.warnings) &&
    value.warnings.every((warning) => typeof warning === "string")
  )
}

function isCalendarRfqEventDraft(value: unknown): value is CalendarRfqEventDraft {
  return (
    isObjectRecord(value) &&
    (value.kind === "quote_due" || value.kind === "quote_work_hold" || value.kind === "offer_follow_up") &&
    typeof value.title === "string" &&
    typeof value.startAt === "string" &&
    typeof value.endAt === "string" &&
    typeof value.timezone === "string" &&
    (value.description === undefined || typeof value.description === "string") &&
    isRecordOfStrings(value.metadata)
  )
}

function isOfferReleaseCommandExecution(value: unknown): value is OfferReleaseExecutionRun["commands"][number] {
  return (
    isObjectRecord(value) &&
    typeof value.key === "string" &&
    (value.kind === "calendar_follow_up" ||
      value.kind === "email_draft" ||
      value.kind === "lifecycle_follow_up" ||
      value.kind === "lifecycle_sent" ||
      value.kind === "manager_review" ||
      value.kind === "workspace_follow_up" ||
      value.kind === "workspace_status") &&
    typeof value.label === "string" &&
    typeof value.detail === "string" &&
    (value.status === "applied" ||
      value.status === "blocked" ||
      value.status === "failed" ||
      value.status === "pending" ||
      value.status === "prepared" ||
      value.status === "requires_review") &&
    typeof value.idempotencyKey === "string" &&
    (value.externalId === undefined || typeof value.externalId === "string") &&
    (value.message === undefined || typeof value.message === "string") &&
    Array.isArray(value.warnings) &&
    value.warnings.every((warning) => typeof warning === "string")
  )
}

function isWorkspaceActionRecord(value: unknown): value is WorkspaceActionRecord {
  return (
    isObjectRecord(value) &&
    value.actionVersion === "workspace-action.v1" &&
    typeof value.key === "string" &&
    typeof value.actor === "string" &&
    (value.kind === "status_change" || value.kind === "scenario_saved" || value.kind === "follow_up_created" || value.kind === "handoff_note") &&
    typeof value.occurredAt === "string" &&
    typeof value.rfqId === "string" &&
    (value.fromStatus === undefined || isQuoteQueueStatus(value.fromStatus)) &&
    (value.toStatus === undefined || isQuoteQueueStatus(value.toStatus)) &&
    (value.activityKind === "status_change" ||
      value.activityKind === "quote_update" ||
      value.activityKind === "calendar_event" ||
      value.activityKind === "note") &&
    typeof value.activityMessage === "string"
  )
}

function isOfferLifecycleEventInput(value: unknown): value is OfferLifecycleEventInput {
  return (
    isObjectRecord(value) &&
    (value.kind === "sent" ||
      value.kind === "accepted" ||
      value.kind === "declined" ||
      value.kind === "follow_up_scheduled" ||
      value.kind === "follow_up_completed" ||
      value.kind === "note_added") &&
    typeof value.actor === "string" &&
    typeof value.occurredAt === "string" &&
    (value.followUpDueAt === undefined || typeof value.followUpDueAt === "string") &&
    (value.followUpTaskId === undefined || typeof value.followUpTaskId === "string") &&
    (value.note === undefined || typeof value.note === "string")
  )
}

function isQuoteQueueStatus(value: unknown): value is QuoteQueueStatus {
  return value === "new" || value === "triage" || value === "estimating" || value === "ready" || value === "sent" || value === "won" || value === "lost"
}

function isOfferReleaseExecutionStatus(value: unknown): value is OfferReleaseExecutionRun["status"] {
  return (
    value === "blocked" ||
    value === "failed" ||
    value === "needs_review" ||
    value === "partial" ||
    value === "pending" ||
    value === "prepared" ||
    value === "succeeded"
  )
}

function isPriority(value: unknown): value is QuoteWorkItem["priority"] {
  return value === "normal" || value === "rush"
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function highestManualRfqCounter(items: QuoteWorkItem[]): number {
  return items.reduce((highest, item) => {
    const match = item.id.match(/^rfq-manual-(\d+)$/)
    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)
}

function buildManualTags(quoteInput: CncQuoteInput): string[] {
  const tags = [formatProcess(quoteInput.process), quoteInput.material.name]
  if (quoteInput.toleranceClass) {
    tags.push(quoteInput.toleranceClass)
  }
  return tags
}

function gmailRecordRfqId(record: GmailRfqIntakeRecord, currentRfqId: string): string {
  return record.messageId === `${currentRfqId}-gmail-message` ? currentRfqId : importedRfqIdForGmailRecord(record)
}

function importedRfqIdForGmailRecord(record: GmailRfqIntakeRecord): string {
  const externalId = record.threadId?.trim() || record.messageId
  return `rfq-import-${slugForId(externalId)}`
}

function importedWorkItemsFromConnectorSync(result: ConnectorRfqSyncResult, currentRfqId: string): QuoteWorkItem[] {
  const statusByRfqId = new Map(result.records.map((record) => [record.rfqId, record]))
  return result.gmail.records.flatMap((record) => {
    const rfqId = record.messageId === `${currentRfqId}-gmail-message` ? currentRfqId : importedRfqIdForGmailRecord(record)
    if (rfqId === currentRfqId) {
      return []
    }

    const syncRecord = statusByRfqId.get(rfqId)
    return [workItemFromParsedConnectorRecord({ parsedRfq: record.parsed, rfqId, syncRecord })]
  })
}

function workItemFromParsedConnectorRecord({
  parsedRfq,
  rfqId,
  syncRecord,
}: {
  parsedRfq: ParsedRfqIntake
  rfqId: string
  syncRecord: ConnectorRfqSyncRecord | undefined
}): QuoteWorkItem {
  const primaryPart = parsedRfq.parts[0]
  const process = manualProcessForParsedPart(primaryPart)
  const materialKey = manualMaterialKeyForParsedPart(primaryPart)
  const partNumber = primaryPart?.partNumber.trim() || rfqId.replace(/^rfq-import-/, "").toUpperCase()
  const quantity = primaryPart?.quantity ?? 1
  const priority = parsedRfq.priority === "rush" ? "rush" : "normal"
  const dueAt = parsedRfq.dueAt === undefined ? manualDueAtFor(defaultManualDueDate()) : new Date(parsedRfq.dueAt).toISOString()
  const quoteInput = buildManualCncQuoteInput({
    cycleMinutesPerPart: process === "cnc_turning" ? 14 : 18,
    finish: "",
    materialKey,
    partNumber,
    priority,
    process,
    quantity,
    setupMinutes: process === "cnc_turning" ? 35 : 45,
    toleranceClass: "",
  })

  return {
    attachments: parsedRfq.attachments,
    cadMetadata: [],
    contact: parsedRfq.contactEmail ?? "Imported RFQ contact",
    customer: parsedRfq.customerName ?? "Imported customer",
    due: formatManualDueLabel(dueAt.slice(0, 10)),
    dueAt,
    id: rfqId,
    notes: [
      `Imported from Gmail RFQ sync as ${rfqId}.`,
      ...(syncRecord ? [`Calendar sync status: ${humanizeKey(syncRecord.status)}.`] : []),
      ...(syncRecord?.warnings ?? []),
    ],
    priority,
    providerRuns: [],
    quoteInput,
    received: `Imported ${formatShortDateTime(new Date(parsedRfq.receivedAt).toISOString())}`,
    receivedAt: new Date(parsedRfq.receivedAt).toISOString(),
    source: "import",
    status: "new",
    subject: parsedRfq.subject,
    tags: buildManualTags(quoteInput),
  }
}

function manualProcessForParsedPart(part: RfqPartDraft | undefined): ManualCncProcess {
  return part?.process === "cnc_turning" ? "cnc_turning" : "cnc_milling"
}

function manualMaterialKeyForParsedPart(part: RfqPartDraft | undefined): ManualMaterialKey {
  const material = part?.materialText?.toLowerCase() ?? ""
  if (material.includes("7075")) {
    return "aluminum_7075"
  }
  if (material.includes("316")) {
    return "stainless_316l"
  }
  if (material.includes("s355") || material.includes("steel")) {
    return "steel_s355"
  }
  if (material.includes("brass")) {
    return "brass_cuzn"
  }
  if (material.includes("pom") || material.includes("acetal")) {
    return "pom_acetal"
  }
  return "aluminum_6082"
}

function slugForId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "gmail-rfq"
}

function customerLabelFor(item: QuoteWorkItem): string {
  return item.customer.trim() || "Unconfirmed customer"
}

function customerKeyFor(item: QuoteWorkItem): string {
  return item.customer.trim()
}

function subjectLabelFor(item: QuoteWorkItem): string {
  return item.subject.trim() || item.quoteInput.partNumber
}

function formatManualDueLabel(dateValue: string): string {
  const parsed = parseManualDueDate(dateValue)
  if (!parsed) {
    return "No due date"
  }
  return parsed.toLocaleDateString("en-US", { day: "2-digit", month: "short" })
}

function dateInputValueFor(timestamp: string): string {
  const match = timestamp.match(/^\d{4}-\d{2}-\d{2}/)
  return normalizeManualDueDate(match?.[0] ?? "", demoToday)
}

function manualDueAtFor(dateValue: string, fallback = defaultManualDueDate()): string {
  return zonedDateTimeIso(normalizeManualDueDate(dateValue, fallback), defaultWorkspaceTimezone, 12)
}

function normalizeManualDueDate(dateValue: string, fallback: string): string {
  return parseManualDueDate(dateValue) ? dateValue.trim() : fallback
}

function parseManualDueDate(dateValue: string): Date | undefined {
  const dateParts = parseManualDueDateParts(dateValue)
  if (!dateParts) {
    return undefined
  }
  const { day, month, year } = dateParts
  const parsed = new Date(year, month - 1, day, 12)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return undefined
  }
  return parsed
}

function parseManualDueDateParts(dateValue: string): { day: number; month: number; year: number } | undefined {
  const trimmed = dateValue.trim()
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return undefined
  }
  const [, yearText, monthText, dayText] = match
  return {
    day: Number(dayText),
    month: Number(monthText),
    year: Number(yearText),
  }
}

function zonedDateTimeIso(dateValue: string, timezone: string, hour: number): string {
  const dateParts = parseManualDueDateParts(dateValue)
  if (!dateParts || !parseManualDueDate(dateValue)) {
    throw new Error("Cannot build a timestamp from an invalid due date.")
  }
  const targetWallClockUtc = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, hour)
  const initialOffsetMinutes = timeZoneOffsetMinutes(new Date(targetWallClockUtc), timezone)
  const initialInstant = new Date(targetWallClockUtc - initialOffsetMinutes * 60_000)
  const resolvedOffsetMinutes = timeZoneOffsetMinutes(initialInstant, timezone)
  return new Date(targetWallClockUtc - resolvedOffsetMinutes * 60_000).toISOString()
}

function timeZoneOffsetMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(date)
  const valueFor = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "0"
  const asUtc = Date.UTC(
    Number(valueFor("year")),
    Number(valueFor("month")) - 1,
    Number(valueFor("day")),
    Number(valueFor("hour")) % 24,
    Number(valueFor("minute")),
    Number(valueFor("second")),
  )
  return (asUtc - date.getTime()) / 60_000
}

function optionalTimestampFor(value: string): number | undefined {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : undefined
}

function normalizeOptionalText(value: string | undefined, fallback: string | undefined): string | undefined {
  if (value === undefined) {
    return fallback
  }
  return value.trim() || undefined
}

function normalizeEditableText(value: string | undefined, fallback: string, commit = false): string {
  if (value === undefined) {
    return fallback
  }
  return commit ? value.trim() : value
}

function applyRfqFieldPatch(quoteInput: CncQuoteInput, patch: RfqFieldPatch): CncQuoteInput {
  const materialPreset = patch.materialKey ? manualMaterialPreset(patch.materialKey) : undefined
  const quoteInputPatch: Partial<CncQuoteInput> = {}

  if (patch.process !== undefined) {
    const dimensions = cncDimensionsForProcess(patch.process, quoteInput)
    quoteInputPatch.process = patch.process
    quoteInputPatch.stockDimensions = dimensions.stock
    quoteInputPatch.finishedDimensions = dimensions.finished
  }

  if (materialPreset) {
    quoteInputPatch.material = {
      ...quoteInput.material,
      costCentsPerKg: materialPreset.costCentsPerKg,
      densityKgM3: materialPreset.densityKgM3,
      name: materialPreset.name,
      yieldFactor: materialPreset.yieldFactor,
    }
  }

  if (patch.toleranceClass !== undefined) {
    quoteInputPatch.toleranceClass = normalizeOptionalText(patch.toleranceClass, quoteInput.toleranceClass)
  }

  if (patch.finish !== undefined) {
    quoteInputPatch.finish = normalizeOptionalText(patch.finish, quoteInput.finish)
  }

  if (Object.keys(quoteInputPatch).length === 0) {
    return quoteInput
  }

  return {
    ...quoteInput,
    ...quoteInputPatch,
  }
}

function materialKeyForQuoteInput(quoteInput: CncQuoteInput): ManualMaterialKey | undefined {
  return MANUAL_MATERIAL_PRESETS.find((preset) => preset.name === quoteInput.material.name)?.key
}

function cncDimensionsForProcess(
  process: ManualCncProcess,
  quoteInput: CncQuoteInput,
): {
  finished: CncQuoteInput["finishedDimensions"]
  stock: CncQuoteInput["stockDimensions"]
} {
  const stock = quoteInput.stockDimensions
  const finished = quoteInput.finishedDimensions

  if (process === "cnc_turning") {
    const finishedDiameter = Math.max(finished?.diameterMm ?? 0, finished?.widthMm ?? 0, finished?.heightMm ?? 0) || 32
    const stockDiameter = Math.max(stock.diameterMm ?? 0, stock.widthMm ?? 0, stock.heightMm ?? 0) || 40

    return {
      finished: {
        diameterMm: finishedDiameter,
        lengthMm: finished?.lengthMm ?? stock.lengthMm ?? 80,
      },
      stock: {
        diameterMm: stockDiameter,
        lengthMm: stock.lengthMm ?? finished?.lengthMm ?? 90,
      },
    }
  }

  return {
    finished: {
      heightMm: finished?.heightMm ?? finished?.diameterMm ?? 18,
      lengthMm: finished?.lengthMm ?? stock.lengthMm ?? 110,
      widthMm: finished?.widthMm ?? finished?.diameterMm ?? 70,
    },
    stock: {
      heightMm: stock.heightMm ?? stock.diameterMm ?? 25,
      lengthMm: stock.lengthMm ?? finished?.lengthMm ?? 120,
      widthMm: stock.widthMm ?? stock.diameterMm ?? 80,
    },
  }
}

function rfqFieldProvenanceByKey(item: QuoteWorkItem): Record<string, RfqExtractedField> {
  return Object.fromEntries(parsedRfqForWorkItem(item).extractedFields.map((field) => [field.key, field]))
}

function parseEditableNotes(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function defaultOfferDraftEditState(item: QuoteWorkItem): OfferDraftEditState {
  return {
    notesText: item.notes.join("\n"),
    revisionReason: "Initial draft",
    termsText: formatOfferTermsText(DEFAULT_OFFER_TERMS),
    validUntil: "2026-07-03",
  }
}

function offerDraftEditStateForItem(item: QuoteWorkItem, edit: Partial<OfferDraftEditState> | undefined): OfferDraftEditState {
  return {
    ...defaultOfferDraftEditState(item),
    ...edit,
  }
}

function formatOfferTermsText(terms: readonly OfferTerm[]): string {
  return terms.map((term) => `${term.label}: ${term.value}`).join("\n")
}

function parseOfferTermsText(value: string): OfferTerm[] {
  const terms = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const separatorIndex = line.indexOf(":")
      const label = separatorIndex > 0 ? line.slice(0, separatorIndex).trim() : `Term ${index + 1}`
      const termValue = separatorIndex > 0 ? line.slice(separatorIndex + 1).trim() : line

      return {
        key: `custom_${index + 1}`,
        label,
        value: termValue,
      }
    })
    .filter((term) => term.label && term.value)

  return terms.length > 0 ? terms : [...DEFAULT_OFFER_TERMS]
}

function defaultManualDueDate(): string {
  const base = new Date(`${demoToday}T12:00:00`)
  base.setDate(base.getDate() + 7)
  return base.toISOString().slice(0, 10)
}

function RfqCreateDialog({
  onCancel,
  onCreate,
}: {
  onCancel: () => void
  onCreate: (values: ManualRfqFormValues) => void
}) {
  const [values, setValues] = useState<ManualRfqFormValues>({
    customer: "",
    contact: "",
    subject: "",
    partNumber: "",
    process: "cnc_milling",
    materialKey: "aluminum_6082",
    quantity: 1,
    priority: "normal",
    dueDate: defaultManualDueDate(),
    setupMinutes: 30,
    cycleMinutesPerPart: 12,
    toleranceClass: "",
    finish: "",
    notes: "",
  })
  const update = <K extends keyof ManualRfqFormValues>(key: K, value: ManualRfqFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))
  const canSubmit = values.customer.trim() !== "" && values.partNumber.trim() !== "" && parseManualDueDate(values.dueDate) !== undefined

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canSubmit) {
      onCreate(values)
    }
  }

  return (
    <div className="rfq-dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        aria-label="Create RFQ"
        aria-modal="true"
        className="rfq-dialog"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onCancel()
          }
        }}
        role="dialog"
      >
        <form className="rfq-dialog-form" onSubmit={handleSubmit}>
          <div className="rfq-dialog-header">
            <h2>New RFQ</h2>
            <p>Capture a manual request for quote. Fields use shop defaults you can refine in costing.</p>
          </div>
          <div className="rfq-dialog-grid">
            <label className="field">
              <span>Customer *</span>
              <input autoFocus onChange={(event) => update("customer", event.target.value)} required value={values.customer} />
            </label>
            <label className="field">
              <span>Contact</span>
              <input onChange={(event) => update("contact", event.target.value)} value={values.contact} />
            </label>
            <label className="field rfq-dialog-span">
              <span>Subject</span>
              <input
                onChange={(event) => update("subject", event.target.value)}
                placeholder="e.g. CNC bracket production batch"
                value={values.subject}
              />
            </label>
            <label className="field">
              <span>Part number *</span>
              <input onChange={(event) => update("partNumber", event.target.value)} required value={values.partNumber} />
            </label>
            <label className="field">
              <span>Process</span>
              <select onChange={(event) => update("process", event.target.value as ManualCncProcess)} value={values.process}>
                <option value="cnc_milling">CNC milling</option>
                <option value="cnc_turning">CNC turning</option>
              </select>
            </label>
            <label className="field">
              <span>Material</span>
              <select onChange={(event) => update("materialKey", event.target.value as ManualMaterialKey)} value={values.materialKey}>
                {MANUAL_MATERIAL_PRESETS.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Quantity</span>
              <input
                min={1}
                onChange={(event) => update("quantity", toPositiveInteger(event.target.value))}
                type="number"
                value={values.quantity}
              />
            </label>
            <label className="field">
              <span>Priority</span>
              <select onChange={(event) => update("priority", event.target.value as ManualPriority)} value={values.priority}>
                <option value="normal">Normal</option>
                <option value="rush">Rush</option>
              </select>
            </label>
            <label className="field">
              <span>Due date</span>
              <input onChange={(event) => update("dueDate", event.target.value)} required type="date" value={values.dueDate} />
            </label>
            <label className="field">
              <span>Setup minutes</span>
              <input
                min={0}
                onChange={(event) => update("setupMinutes", toNumber(event.target.value))}
                type="number"
                value={values.setupMinutes}
              />
            </label>
            <label className="field">
              <span>Cycle minutes / part</span>
              <input
                min={0.1}
                onChange={(event) => update("cycleMinutesPerPart", toPositiveNumber(event.target.value))}
                step={0.1}
                type="number"
                value={values.cycleMinutesPerPart}
              />
            </label>
            <label className="field">
              <span>Tolerance</span>
              <input onChange={(event) => update("toleranceClass", event.target.value)} placeholder="e.g. ISO 2768-M" value={values.toleranceClass} />
            </label>
            <label className="field">
              <span>Finish</span>
              <input onChange={(event) => update("finish", event.target.value)} placeholder="e.g. Deburred" value={values.finish} />
            </label>
            <label className="field rfq-dialog-span">
              <span>Notes</span>
              <textarea onChange={(event) => update("notes", event.target.value)} placeholder="One note per line" value={values.notes} />
            </label>
          </div>
          <div className="rfq-dialog-actions">
            <Button onClick={onCancel} size="sm" type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={!canSubmit} size="sm" type="submit">
              <Plus aria-hidden="true" />
              Create RFQ
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PersistenceStatus({
  label,
  mode,
  syncErrorCount,
}: {
  label: string
  mode: WorkspacePersistenceMode
  syncErrorCount: number
}) {
  const Icon = mode === "convex" ? Database : CloudOff

  return (
    <div className="persistence-chip" data-mode={mode} aria-label="Persistence status">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      {syncErrorCount > 0 ? <strong>{syncErrorCount} sync fallback</strong> : null}
    </div>
  )
}

function IntegrationStatusPanel({
  calendarPlan,
  connectorSnapshot,
  isConnectorSyncing,
  onSyncConnector,
  onSyncReplies,
  rfqId,
  status,
}: {
  calendarPlan: CalendarRfqPlan
  connectorSnapshot: ConnectorSyncPersistenceSnapshot
  isConnectorSyncing: boolean
  onSyncConnector: () => void
  onSyncReplies: () => void
  rfqId: string
  status: WorkspaceIntegrationStatus
}) {
  const [connectorFilter, setConnectorFilter] = useState<ConnectorLinkDrilldownFilter>("all")
  const connectorDrilldown = useMemo(
    () => buildConnectorLinkDrilldown(connectorSnapshot, { filter: connectorFilter, limit: 6, rfqId }),
    [connectorFilter, connectorSnapshot, rfqId],
  )

  return (
    <section className="integration-status-panel" aria-label="Integration health">
      <div className="integration-status-heading">
        <div>
          <span className="eyebrow">
            <Database aria-hidden="true" />
            Integration health
          </span>
          <strong>{integrationHealthStatusLabel(status.status)}</strong>
        </div>
        <span className={`integration-overall-status integration-overall-status-${status.status}`}>
          {humanizeKey(status.status)}
        </span>
      </div>
      <div className="integration-action-row">
        <Button disabled={isConnectorSyncing} onClick={() => void onSyncConnector()} type="button" variant="outline" size="sm">
          <Mail aria-hidden="true" />
          {isConnectorSyncing ? "Syncing" : "RFQ sync"}
        </Button>
        <Button onClick={() => void onSyncReplies()} type="button" variant="outline" size="sm">
          <RefreshCw aria-hidden="true" />
          Reply sync
        </Button>
      </div>
      <div className="integration-source-list">
        {status.sources.map((source) => (
          <IntegrationSourceRow key={source.key} source={source} />
        ))}
      </div>
      <RfqCalendarPlanPreview plan={calendarPlan} />
      <ConnectorLinkDrilldownPanel
        drilldown={connectorDrilldown}
        filter={connectorFilter}
        onFilterChange={setConnectorFilter}
      />
      {status.warnings.length > 0 ? (
        <div className="provider-warning-list">
          {status.warnings.slice(0, 3).map((warning) => (
            <div className="flag" key={warning}>
              <AlertTriangle aria-hidden="true" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function RfqCalendarPlanPreview({ plan }: { plan: CalendarRfqPlan }) {
  return (
    <section className="rfq-calendar-plan-preview" aria-label="RFQ calendar plan preview">
      <div className="rfq-calendar-plan-heading">
        <span>
          <CalendarDays aria-hidden="true" />
          RFQ calendar plan
        </span>
        <strong>{plan.events.length} drafts</strong>
      </div>
      {plan.events.length > 0 ? (
        <div className="rfq-calendar-plan-list">
          {plan.events.map((event) => (
            <article className="rfq-calendar-plan-row" key={`${event.kind}:${event.startAt}:${event.title}`}>
              <span className="rfq-calendar-plan-icon" aria-hidden="true">
                <CalendarDays />
              </span>
              <div>
                <strong>{event.title}</strong>
                <span>
                  {formatCalendarEventRange(event)} · {event.timezone}
                </span>
                {event.description ? <small>{event.description}</small> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="provider-history-empty" role="status">
          No RFQ calendar drafts.
        </div>
      )}
      {plan.warnings.length > 0 ? (
        <div className="provider-warning-list">
          {plan.warnings.map((warning) => (
            <div className="flag" key={warning}>
              <AlertTriangle aria-hidden="true" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function ConnectorLinkDrilldownPanel({
  drilldown,
  filter,
  onFilterChange,
}: {
  drilldown: ConnectorLinkDrilldown
  filter: ConnectorLinkDrilldownFilter
  onFilterChange: (filter: ConnectorLinkDrilldownFilter) => void
}) {
  return (
    <section className="connector-drilldown" aria-label="Connector link drill-down">
      <div className="connector-drilldown-summary">
        <Metric label="Links" value={String(drilldown.summary.linkCount)} />
        <Metric label="Gmail" value={String(drilldown.summary.gmailLinkCount)} />
        <Metric label="Calendar" value={String(drilldown.summary.calendarLinkCount)} />
        <Metric label="Activity" value={String(drilldown.summary.activityCount)} />
      </div>
      <div className="connector-drilldown-filters" aria-label="Connector drill-down filters">
        {connectorLinkDrilldownFilters.map((drilldownFilter) => (
          <Button
            aria-pressed={filter === drilldownFilter}
            className={filter === drilldownFilter ? "connector-drilldown-filter-active" : undefined}
            key={drilldownFilter}
            onClick={() => onFilterChange(drilldownFilter)}
            size="sm"
            type="button"
            variant="outline"
          >
            {connectorLinkDrilldownFilterLabel(drilldownFilter, drilldown)}
          </Button>
        ))}
      </div>
      <div className="connector-drilldown-list">
        {drilldown.items.length > 0 ? (
          drilldown.items.map((item) => <ConnectorLinkDrilldownRow item={item} key={item.key} />)
        ) : (
          <div className="provider-history-empty" role="status">
            No connector records match {humanizeKey(filter)}.
          </div>
        )}
      </div>
    </section>
  )
}

function ConnectorLinkDrilldownRow({ item }: { item: ConnectorLinkDrilldownItem }) {
  return (
    <article className="connector-drilldown-row" data-kind={item.kind} data-status={item.status}>
      <span className="integration-source-icon" aria-hidden="true">
        <ConnectorLinkDrilldownIcon item={item} />
      </span>
      <div>
        <strong>{item.label}</strong>
        <span>{item.detail}</span>
      </div>
      <span className="integration-source-status">
        {item.externalUrl ? (
          <a href={item.externalUrl} rel="noreferrer" target="_blank">
            <ExternalLink aria-hidden="true" />
            Open
          </a>
        ) : (
          humanizeKey(String(item.status ?? item.kind))
        )}
      </span>
    </article>
  )
}

function ConnectorLinkDrilldownIcon({ item }: { item: ConnectorLinkDrilldownItem }) {
  if (item.kind === "activity") {
    return <Clock3 aria-hidden="true" />
  }
  if (item.provider === "calendar") {
    return <CalendarDays aria-hidden="true" />
  }
  return <Mail aria-hidden="true" />
}

function connectorLinkDrilldownFilterLabel(
  filter: ConnectorLinkDrilldownFilter,
  drilldown: ConnectorLinkDrilldown,
): string {
  switch (filter) {
    case "all":
      return `All ${drilldown.summary.linkCount + drilldown.summary.activityCount}`
    case "gmail":
      return `Gmail ${drilldown.summary.gmailLinkCount}`
    case "calendar":
      return `Calendar ${drilldown.summary.calendarLinkCount}`
    case "attention":
      return `Attention ${drilldown.summary.blockedCount + drilldown.summary.staleCount}`
    case "activity":
      return `Activity ${drilldown.summary.activityCount}`
  }
}

function IntegrationSourceRow({ source }: { source: IntegrationStatusSource }) {
  return (
    <article className="integration-source-row" data-severity={source.severity}>
      <span className="integration-source-icon" aria-hidden="true">
        <IntegrationSourceIcon source={source} />
      </span>
      <div>
        <strong>{source.label}</strong>
        <span>{source.detail}</span>
      </div>
      <span className="integration-source-status">
        {source.count !== undefined ? `${source.count} ` : ""}
        {humanizeKey(source.status)}
      </span>
    </article>
  )
}

function IntegrationSourceIcon({ source }: { source: IntegrationStatusSource }) {
  if (source.key === "connector" || source.key === "offer_replies") {
    return <Mail aria-hidden="true" />
  }
  if (source.key === "calendar_follow_up") {
    return <CalendarDays aria-hidden="true" />
  }
  if (source.key === "provider_runs") {
    return <ShieldCheck aria-hidden="true" />
  }
  if (source.status === "local" || source.status === "fallback") {
    return <CloudOff aria-hidden="true" />
  }
  return <Database aria-hidden="true" />
}

function ProviderRunReviewPanel({ audits }: { audits: ProviderRunAudit[] }) {
  const [filter, setFilter] = useState<ProviderRunHistoryFilter>("all")
  const latestAudit = audits[0]
  if (!latestAudit) {
    return null
  }
  const history = buildProviderRunHistorySummary(audits, { filter })
  const auditByRunKey = new Map(audits.map((audit) => [audit.runKey, audit]))
  const visibleAudits = history.events
    .map((event) => auditByRunKey.get(event.runKey))
    .filter((audit): audit is ProviderRunAudit => audit !== undefined)

  return (
    <section className="provider-review" aria-label="Provider review">
      <div className="provider-review-heading">
        <span className="eyebrow">
          <ShieldCheck aria-hidden="true" />
          Provider review
        </span>
        <span className={`provider-status provider-status-${latestAudit.status}`}>{latestAudit.status}</span>
      </div>
      <div className="provider-history-summary" aria-label="Provider run history summary">
        <Metric label="Runs" value={String(history.totalRuns)} />
        <Metric label="Warnings" value={String(history.warningCount)} />
        <Metric label="Fallbacks" value={String(history.fallbackCount)} />
        <Metric label="Failed" value={String(history.failedCount)} />
      </div>
      <div className="provider-history-filters" aria-label="Provider run history filters">
        {providerRunHistoryFilters.map((historyFilter) => (
          <Button
            aria-pressed={filter === historyFilter}
            className={filter === historyFilter ? "provider-history-filter-active" : undefined}
            key={historyFilter}
            onClick={() => setFilter(historyFilter)}
            size="sm"
            type="button"
            variant="outline"
          >
            {providerHistoryFilterLabel(historyFilter, history)}
          </Button>
        ))}
      </div>
      <div className="provider-run-list">
        {visibleAudits.length > 0 ? (
          visibleAudits.map((audit) => (
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
          ))
        ) : (
          <div className="provider-history-empty" role="status">
            No provider runs match {humanizeKey(filter)}.
          </div>
        )}
      </div>
    </section>
  )
}

function providerHistoryFilterLabel(
  filter: ProviderRunHistoryFilter,
  history: ReturnType<typeof buildProviderRunHistorySummary>,
): string {
  switch (filter) {
    case "all":
      return `All ${history.totalRuns}`
    case "failed":
      return `Failed ${history.failedCount}`
    case "fallbacks":
      return `Fallbacks ${history.fallbackCount}`
    case "skipped":
      return `Skipped ${history.skippedCount}`
    case "succeeded":
      return `Succeeded ${history.succeededCount}`
    case "warnings":
      return `Warnings ${history.warningCount}`
  }
}

function TriageView({
  actions,
  followUpNow,
  followUpReplySync,
  handoffDraft,
  item,
  onAddHandoffNote,
  onAdvanceStatus,
  onCreateFollowUp,
  onHandoffDraftChange,
  onUpdateFields,
  onSaveScenario,
  readiness,
  status,
}: {
  actions: WorkspaceActionRecord[]
  followUpNow: string
  followUpReplySync?: GmailOfferReplySyncResult
  handoffDraft: string
  item: QuoteWorkItem
  onAddHandoffNote: () => void
  onAdvanceStatus: () => void
  onCreateFollowUp: () => void
  onHandoffDraftChange: (value: string) => void
  onUpdateFields: (patch: RfqFieldPatch) => void
  onSaveScenario: () => void
  readiness: RfqIntakeReadinessResult
  status: QuoteQueueStatus
}) {
  const nextStatus = nextStatusFor(status)
  const notesText = item.notes.join("\n")
  const dueDate = dateInputValueFor(item.dueAt)
  const materialKey = materialKeyForQuoteInput(item.quoteInput)
  const provenanceByKey = rfqFieldProvenanceByKey(item)

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
      <section className="rfq-field-editor" aria-label="Editable RFQ fields">
        <div className="rfq-field-editor-heading">
          <span className="eyebrow">
            <FileText aria-hidden="true" />
            Intake fields
          </span>
          <span className="rfq-provenance-chip">{item.source.toUpperCase()} reviewed</span>
        </div>
        <div className="rfq-field-grid">
          <label className="field">
            <span className="rfq-field-label">
              <span>Customer</span>
              <RfqFieldProvenanceBadge field={provenanceByKey.customer_name} />
            </span>
            <input
              aria-label="RFQ customer"
              onBlur={(event) => onUpdateFields({ commit: true, customer: event.target.value })}
              onChange={(event) => onUpdateFields({ customer: event.target.value })}
              value={item.customer}
            />
          </label>
          <label className="field">
            <span className="rfq-field-label">
              <span>Contact</span>
              <RfqFieldProvenanceBadge field={provenanceByKey.contact_name ?? provenanceByKey.contact_email} />
            </span>
            <input
              aria-label="RFQ contact"
              onBlur={(event) => onUpdateFields({ commit: true, contact: event.target.value })}
              onChange={(event) => onUpdateFields({ contact: event.target.value })}
              value={item.contact}
            />
          </label>
          <label className="field rfq-field-span">
            <span className="rfq-field-label">
              <span>Subject</span>
              <RfqFieldProvenanceBadge field={provenanceByKey.subject} />
            </span>
            <input
              aria-label="RFQ subject"
              onBlur={(event) => onUpdateFields({ commit: true, subject: event.target.value })}
              onChange={(event) => onUpdateFields({ subject: event.target.value })}
              value={item.subject}
            />
          </label>
          <label className="field">
            <span className="rfq-field-label">
              <span>Process</span>
              <RfqFieldProvenanceBadge field={provenanceByKey.process} />
            </span>
            <select aria-label="RFQ process" onChange={(event) => onUpdateFields({ process: event.target.value as ManualCncProcess })} value={item.quoteInput.process}>
              <option value="cnc_milling">CNC milling</option>
              <option value="cnc_turning">CNC turning</option>
            </select>
          </label>
          <label className="field">
            <span className="rfq-field-label">
              <span>Material</span>
              <RfqFieldProvenanceBadge field={provenanceByKey.material} />
            </span>
            <select
              aria-label="RFQ material"
              onChange={(event) => onUpdateFields({ materialKey: event.target.value as ManualMaterialKey })}
              value={materialKey ?? "custom"}
            >
              {materialKey ? null : <option value="custom">{item.quoteInput.material.name}</option>}
              {MANUAL_MATERIAL_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="rfq-field-label">
              <span>Due date</span>
              <RfqFieldProvenanceBadge field={provenanceByKey.due_at} />
            </span>
            <input aria-label="RFQ due date" onChange={(event) => onUpdateFields({ dueDate: event.target.value })} type="date" value={dueDate} />
          </label>
          <label className="field">
            <span className="rfq-field-label">
              <span>Tolerance</span>
              <RfqFieldProvenanceBadge field={provenanceByKey.tolerance} />
            </span>
            <input
              aria-label="RFQ tolerance"
              onChange={(event) => onUpdateFields({ toleranceClass: event.target.value })}
              placeholder="ISO 2768-M"
              value={item.quoteInput.toleranceClass ?? ""}
            />
          </label>
          <label className="field">
            <span className="rfq-field-label">
              <span>Finish</span>
              <RfqFieldProvenanceBadge field={provenanceByKey.finish} />
            </span>
            <input
              aria-label="RFQ finish"
              onChange={(event) => onUpdateFields({ finish: event.target.value })}
              placeholder="Deburred"
              value={item.quoteInput.finish ?? ""}
            />
          </label>
          <label className="field rfq-field-span">
            <span>Notes</span>
            <textarea
              aria-label="RFQ notes"
              onChange={(event) => onUpdateFields({ notesText: event.target.value })}
              placeholder="One note per line"
              value={notesText}
            />
          </label>
        </div>
      </section>
      <RfqIntakeReadinessPanel readiness={readiness} />
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
      <CalendarFollowUpStatusPanel
        actions={actions}
        now={followUpNow}
        offerId={offerNumberFor(item).toLowerCase()}
        replySync={followUpReplySync}
        rfqId={item.id}
      />
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

function RfqFieldProvenanceBadge({ field }: { field?: RfqExtractedField }) {
  const label = field ? `${field.source.label} ${Math.round(field.confidence * 100)}%` : "Operator"
  const title = field ? `${field.source.label} extraction confidence ${Math.round(field.confidence * 100)}%` : "Operator-entered field"

  return (
    <span className="rfq-field-source" title={title}>
      {label}
    </span>
  )
}

function RfqIntakeReadinessPanel({ readiness }: { readiness: RfqIntakeReadinessResult }) {
  return (
    <section className="rfq-readiness-panel" aria-label="RFQ intake readiness">
      <div className="rfq-readiness-heading">
        <div>
          <span className="eyebrow">
            <ShieldCheck aria-hidden="true" />
            Intake readiness
          </span>
          <strong>{rfqReadinessStatusLabel(readiness.status)}</strong>
        </div>
        <span className={`rfq-readiness-status rfq-readiness-status-${readiness.status}`}>{humanizeKey(readiness.status)}</span>
      </div>
      <div className="rfq-readiness-summary">
        <Metric label="Blockers" value={String(readiness.blockerCount)} />
        <Metric label="Warnings" value={String(readiness.warningCount)} />
        <Metric label="Parts" value={String(readiness.partCount)} />
      </div>
      <div className="rfq-readiness-checks">
        {readiness.checks.map((check) => (
          <div className="rfq-readiness-check" data-status={check.status} key={check.key}>
            <RfqReadinessCheckIcon status={check.status} />
            <div>
              <strong>{check.label}</strong>
              <span>{check.detail}</span>
            </div>
          </div>
        ))}
      </div>
      {readiness.issues.length > 0 ? (
        <div className="rfq-readiness-issues">
          {readiness.issues.map((issue, index) => (
            <div className="flag" key={`${issue.key}-${issue.partNumber ?? "rfq"}-${index}`}>
              <AlertTriangle aria-hidden="true" />
              <span>{issue.partNumber ? `${issue.partNumber}: ${issue.detail}` : issue.detail}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function CalendarFollowUpStatusPanel({
  actions,
  now,
  offerId,
  replySync,
  rfqId,
}: {
  actions: WorkspaceActionRecord[]
  now: string
  offerId: string
  replySync?: GmailOfferReplySyncResult
  rfqId: string
}) {
  const [filter, setFilter] = useState<CalendarFollowUpStatusFilter>("all")
  const status = useMemo(
    () => buildCalendarFollowUpStatus({ actions, filter, now, offerId, replySync, rfqId }),
    [actions, filter, now, offerId, replySync, rfqId],
  )

  return (
    <section className="calendar-follow-up-panel" aria-label="Calendar follow-up status">
      <div className="calendar-follow-up-heading">
        <div>
          <span className="eyebrow">
            <CalendarDays aria-hidden="true" />
            Calendar follow-up
          </span>
          <strong>{calendarFollowUpStatusLabel(status)}</strong>
        </div>
        <span className={`calendar-follow-up-chip calendar-follow-up-chip-${calendarFollowUpStatusTone(status)}`}>
          {status.summary.taskCount === 0 ? "pending" : `${status.summary.taskCount} task${status.summary.taskCount === 1 ? "" : "s"}`}
        </span>
      </div>
      <div className="calendar-follow-up-summary">
        <Metric label="Open" value={String(status.summary.openCount)} />
        <Metric label="Completed" value={String(status.summary.completedCount)} />
        <Metric label="Review" value={String(status.summary.reviewCount + status.summary.cancelledCount)} />
      </div>
      <div className="calendar-follow-up-filters" aria-label="Calendar follow-up filters">
        {calendarFollowUpStatusFilters.map((statusFilter) => (
          <Button
            aria-pressed={filter === statusFilter}
            className={filter === statusFilter ? "calendar-follow-up-filter-active" : undefined}
            key={statusFilter}
            onClick={() => setFilter(statusFilter)}
            size="sm"
            type="button"
            variant="outline"
          >
            {calendarFollowUpFilterLabel(statusFilter, status)}
          </Button>
        ))}
      </div>
      <div className="calendar-follow-up-list">
        {status.tasks.length > 0 ? (
          status.tasks.map((task) => <CalendarFollowUpStatusRow key={task.key} task={task} />)
        ) : (
          <div className="provider-history-empty" role="status">
            No calendar follow-ups match {humanizeKey(filter)}.
          </div>
        )}
      </div>
      {status.warnings.length > 0 ? (
        <div className="provider-warning-list">
          {status.warnings.slice(0, 2).map((warning) => (
            <div className="flag" key={warning}>
              <AlertTriangle aria-hidden="true" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function CalendarFollowUpStatusRow({ task }: { task: CalendarFollowUpStatusTask }) {
  return (
    <article className="calendar-follow-up-row" data-status={task.status}>
      <span className="integration-source-icon" aria-hidden="true">
        <CalendarFollowUpStatusIcon status={task.status} />
      </span>
      <div>
        <strong>{calendarFollowUpTaskLabel(task)}</strong>
        <span>{task.detail}</span>
      </div>
      <span className="integration-source-status">{humanizeKey(task.status)}</span>
    </article>
  )
}

function CalendarFollowUpStatusIcon({ status }: { status: CalendarFollowUpStatusTask["status"] }) {
  if (status === "completed") {
    return <CheckCircle2 aria-hidden="true" />
  }
  if (status === "review" || status === "cancelled") {
    return <AlertTriangle aria-hidden="true" />
  }
  return <Clock3 aria-hidden="true" />
}

function calendarFollowUpStatusLabel(status: CalendarFollowUpStatus) {
  if (status.summary.taskCount === 0) {
    return "No follow-up scheduled"
  }
  if (status.summary.reviewCount + status.summary.cancelledCount > 0) {
    return "Review follow-up"
  }
  if (status.summary.openCount > 0) {
    return "Follow-up scheduled"
  }
  return "Follow-up completed"
}

function calendarFollowUpStatusTone(status: CalendarFollowUpStatus) {
  if (status.summary.reviewCount + status.summary.cancelledCount > 0) {
    return "review"
  }
  if (status.summary.completedCount > 0 && status.summary.openCount === 0) {
    return "completed"
  }
  return "open"
}

function calendarFollowUpFilterLabel(filter: CalendarFollowUpStatusFilter, status: CalendarFollowUpStatus): string {
  switch (filter) {
    case "all":
      return `All ${status.summary.taskCount}`
    case "open":
      return `Open ${status.summary.openCount}`
    case "completed":
      return `Completed ${status.summary.completedCount}`
    case "review":
      return `Review ${status.summary.reviewCount + status.summary.cancelledCount}`
  }
}

function calendarFollowUpTaskLabel(task: CalendarFollowUpStatusTask) {
  if (task.status === "completed") {
    return `Completed ${formatShortDateTime(task.completedAt ?? task.dueAt)}`
  }
  return `Due ${formatShortDateTime(task.dueAt)}`
}

function RfqReadinessCheckIcon({ status }: { status: RfqIntakeReadinessCheckStatus }) {
  const Icon = status === "passed" ? CheckCircle2 : AlertTriangle
  return (
    <span className="rfq-readiness-check-icon" aria-hidden="true">
      <Icon />
    </span>
  )
}

function rfqReadinessStatusLabel(status: RfqIntakeReadinessResult["status"]) {
  switch (status) {
    case "blocked":
      return "Blocked"
    case "needs_review":
      return "Needs review"
    case "ready":
      return "Ready for costing"
  }
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

function ProcessCapabilityPanel({
  activeProcess,
  matrix,
}: {
  activeProcess: QuoteProcessKey
  matrix: ProcessCapabilityMatrix
}) {
  return (
    <section className="process-capability-panel" aria-label="Process capability matrix">
      <div className="process-capability-heading">
        <div>
          <span className="eyebrow">
            <Factory aria-hidden="true" />
            Capability
          </span>
          <strong>
            {matrix.readyProcessCount}/{matrix.supportedProcessCount} ready calculators
          </strong>
        </div>
        <span className="capability-version" aria-label={matrix.matrixVersion} title={matrix.matrixVersion}>
          {shortCapabilityMatrixVersion(matrix.matrixVersion)}
        </span>
      </div>
      <div className="process-capability-summary">
        <Metric label="Processes" value={String(matrix.supportedProcessCount)} />
        <Metric label="Ready" value={String(matrix.readyProcessCount)} />
        <Metric label="Rate cards" value={String(matrix.totalRateCardPresetLinks)} />
      </div>
      <div className="process-capability-list">
        {matrix.capabilities.map((capability) => (
          <article
            className="process-capability-card"
            data-active={capability.process === activeProcess}
            data-status={capability.status}
            key={capability.process}
          >
            <div className="process-capability-card-heading">
              <strong>{capability.label}</strong>
              <span>{humanizeKey(capability.status)}</span>
            </div>
            <div className="process-capability-metrics">
              <span>{capability.samplePartNumber}</span>
              <span>{formatCurrency(capability.sampleTotalCents, capability.sampleCurrency)}</span>
              <span>{capability.sampleLeadTimeDays}d</span>
              <span>{capability.rateCardPresetKeys.length} cards</span>
            </div>
            <small>{capability.warnings[0] ?? "No calculator flags"}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProcessDemoQuotesPanel({ demos }: { demos: ProcessDemoQuote[] }) {
  const [selectedProcess, setSelectedProcess] = useState(demos[0]?.process)
  const [sheetMetalEdits, setSheetMetalEdits] = useState<SheetMetalInputEditState>(
    () => buildNonCncInputEditState({ process: "sheet_metal" }) as SheetMetalInputEditState,
  )
  const [plasticEdits, setPlasticEdits] = useState<PlasticsInputEditState>(
    () => buildNonCncInputEditState({ process: "plastic" }) as PlasticsInputEditState,
  )
  const [wireEdmEdits, setWireEdmEdits] = useState<WireEdmInputEditState>(
    () => buildNonCncInputEditState({ process: "wire_edm" }) as WireEdmInputEditState,
  )
  const [fabricationEdits, setFabricationEdits] = useState<FabricationInputEditState>(
    () => buildNonCncInputEditState({ process: "fabrication" }) as FabricationInputEditState,
  )
  const editedDemoState = useMemo(
    () => buildEditedNonCncDemos(demos, sheetMetalEdits, plasticEdits, wireEdmEdits, fabricationEdits),
    [demos, fabricationEdits, plasticEdits, sheetMetalEdits, wireEdmEdits],
  )
  const preview = useMemo(() => buildProcessQuotePreview(editedDemoState.demos, selectedProcess), [editedDemoState.demos, selectedProcess])
  const [promotionPersistence] = useState(() => createLocalNonCncQuotePromotionPersistence())
  const [promotionSnapshot, setPromotionSnapshot] = useState<NonCncQuotePromotionPersistenceSnapshot>(() => promotionPersistence.snapshot())
  const [promotionExecutionPersistence] = useState(() => createLocalNonCncQuotePromotionExecutionPersistence())
  const [promotionExecutionSnapshot, setPromotionExecutionSnapshot] = useState<NonCncQuotePromotionExecutionPersistenceSnapshot>(() =>
    promotionExecutionPersistence.snapshot(),
  )
  const promotionPlan = useMemo(
    () =>
      buildNonCncQuotePromotionPlan({
        preview,
        requestedAt: "2026-06-27T13:30:00.000Z",
        requestedBy: "FactoryBid Operator",
        targetRfqId: "registry-demo",
      }),
    [preview],
  )
  const inputEditAdapters = useMemo(() => listNonCncInputEditAdapters(), [])
  const selectedInputEditAdapter = inputEditAdapters.find((adapter) => adapter.process === preview.selected.process)

  useEffect(() => {
    let isCurrent = true
    void promotionPersistence.recordPlan(promotionPlan).then((snapshot) => {
      if (isCurrent) {
        setPromotionSnapshot(snapshot)
      }
    })
    return () => {
      isCurrent = false
    }
  }, [promotionPersistence, promotionPlan])
  const recordPromotionExecutionRun = useCallback(
    (run: NonCncQuotePromotionExecutionRun) => {
      let isCurrent = true
      void promotionExecutionPersistence.recordRun(run).then((snapshot) => {
        if (isCurrent) {
          setPromotionExecutionSnapshot(snapshot)
        }
      })
      return () => {
        isCurrent = false
      }
    },
    [promotionExecutionPersistence],
  )

  const updateSheetMetalEdit = (field: keyof SheetMetalInputEditPatch, value: number) => {
    setSheetMetalEdits((current) => ({ ...current, [field]: value }))
  }
  const updatePlasticEdit = <K extends keyof PlasticsInputEditPatch>(field: K, value: PlasticsInputEditPatch[K]) => {
    setPlasticEdits((current) => ({ ...current, [field]: value }))
  }
  const updateWireEdmEdit = <K extends keyof WireEdmInputEditPatch>(field: K, value: WireEdmInputEditPatch[K]) => {
    setWireEdmEdits((current) => ({ ...current, [field]: value }))
  }
  const updateFabricationEdit = <K extends keyof FabricationInputEditPatch>(field: K, value: FabricationInputEditPatch[K]) => {
    setFabricationEdits((current) => ({ ...current, [field]: value }))
  }

  return (
    <section className="process-demo-panel" aria-label="Non-CNC registry demos">
      <div className="process-demo-heading">
        <div>
          <span className="eyebrow">
            <Calculator aria-hidden="true" />
            Registry demos
          </span>
          <strong>Non-CNC quote samples</strong>
        </div>
        <span title={PROCESS_DEMO_QUOTES_VERSION}>{shortProcessDemoVersion(PROCESS_DEMO_QUOTES_VERSION)}</span>
      </div>
      <div className="process-demo-selector" aria-label="Process quote preview selector">
        {preview.options.map((option) => (
          <ProcessQuotePreviewButton key={option.process} onSelect={() => setSelectedProcess(option.process)} option={option} />
        ))}
      </div>
      <ProcessQuotePreviewComparisonPanel preview={preview} />
      <ProcessQuotePreviewCard
        inputEditAdapter={selectedInputEditAdapter}
        preview={preview}
        promotionExecutionSnapshot={promotionExecutionSnapshot}
        promotionPlan={promotionPlan}
        recordPromotionExecutionRun={recordPromotionExecutionRun}
        promotionSnapshot={promotionSnapshot}
        sheetMetalEditor={
          preview.selected.process === "sheet_metal"
            ? {
                error: editedDemoState.sheetMetalError,
                onChange: updateSheetMetalEdit,
                state: sheetMetalEdits,
              }
            : undefined
        }
        plasticEditor={
          preview.selected.process === "plastic"
            ? {
                error: editedDemoState.plasticError,
                onChange: updatePlasticEdit,
                state: plasticEdits,
              }
            : undefined
        }
        wireEdmEditor={
          preview.selected.process === "wire_edm"
            ? {
                error: editedDemoState.wireEdmError,
                onChange: updateWireEdmEdit,
                state: wireEdmEdits,
              }
            : undefined
        }
        fabricationEditor={
          preview.selected.process === "fabrication"
            ? {
                error: editedDemoState.fabricationError,
                onChange: updateFabricationEdit,
                state: fabricationEdits,
              }
            : undefined
        }
      />
    </section>
  )
}

function buildEditedNonCncDemos(
  demos: ProcessDemoQuote[],
  sheetMetalEdits: SheetMetalInputEditState,
  plasticEdits: PlasticsInputEditState,
  wireEdmEdits: WireEdmInputEditState,
  fabricationEdits: FabricationInputEditState,
): { demos: ProcessDemoQuote[]; fabricationError?: string; plasticError?: string; sheetMetalError?: string; wireEdmError?: string } {
  let editedDemos = demos
  let fabricationError: string | undefined
  let sheetMetalError: string | undefined
  let plasticError: string | undefined
  let wireEdmError: string | undefined

  try {
    const edited = calculateEditedNonCncQuote({
      patch: {
        bendCount: sheetMetalEdits.bendCount,
        blankLengthMm: sheetMetalEdits.blankLengthMm,
        blankWidthMm: sheetMetalEdits.blankWidthMm,
        cuttingLengthMm: sheetMetalEdits.cuttingLengthMm,
        materialThicknessMm: sheetMetalEdits.materialThicknessMm,
      },
      process: "sheet_metal",
    })
    editedDemos = editedDemos.map((demo) => (demo.process === "sheet_metal" ? { ...demo, quote: edited.quote } : demo))
  } catch (error) {
    sheetMetalError = error instanceof Error ? error.message : "Sheet metal preview edits are invalid"
  }

  try {
    const edited = calculateEditedNonCncQuote({
      patch: {
        materialFamily: plasticEdits.materialFamily,
        stockHeightMm: plasticEdits.stockHeightMm,
        stockLengthMm: plasticEdits.stockLengthMm,
        stockWidthMm: plasticEdits.stockWidthMm,
        surfaceFinish: plasticEdits.surfaceFinish,
      },
      process: "plastic",
    })
    editedDemos = editedDemos.map((demo) => (demo.process === "plastic" ? { ...demo, quote: edited.quote } : demo))
  } catch (error) {
    plasticError = error instanceof Error ? error.message : "Plastic preview edits are invalid"
  }

  try {
    const edited = calculateEditedNonCncQuote({
      patch: {
        contourLengthMm: wireEdmEdits.contourLengthMm,
        inspectionLevel: wireEdmEdits.inspectionLevel,
        skimPasses: wireEdmEdits.skimPasses,
        stockHeightMm: wireEdmEdits.stockHeightMm,
        stockLengthMm: wireEdmEdits.stockLengthMm,
        stockWidthMm: wireEdmEdits.stockWidthMm,
      },
      process: "wire_edm",
    })
    editedDemos = editedDemos.map((demo) => (demo.process === "wire_edm" ? { ...demo, quote: edited.quote } : demo))
  } catch (error) {
    wireEdmError = error instanceof Error ? error.message : "Wire EDM preview edits are invalid"
  }

  try {
    const edited = calculateEditedNonCncQuote({
      patch: {
        assemblyMinutesPerPart: fabricationEdits.assemblyMinutesPerPart,
        complexityMultiplier: fabricationEdits.complexityMultiplier,
        fabricationMinutesPerPart: fabricationEdits.fabricationMinutesPerPart,
        finishRequirement: fabricationEdits.finishRequirement,
        inspectionMinutesPerPart: fabricationEdits.inspectionMinutesPerPart,
        weldingMinutesPerPart: fabricationEdits.weldingMinutesPerPart,
      },
      process: "fabrication",
    })
    editedDemos = editedDemos.map((demo) => (demo.process === "fabrication" ? { ...demo, quote: edited.quote } : demo))
  } catch (error) {
    fabricationError = error instanceof Error ? error.message : "Fabrication preview edits are invalid"
  }

  return {
    demos: editedDemos,
    fabricationError,
    plasticError,
    sheetMetalError,
    wireEdmError,
  }
}

function ProcessQuotePreviewComparisonPanel({ preview }: { preview: ProcessQuotePreview }) {
  const comparison = preview.comparison
  return (
    <div className="process-demo-comparison" aria-label="Process quote comparison summary">
      <div>
        <span>Best price</span>
        <strong>{comparison.cheapestLabel}</strong>
        <small>{formatCurrency(comparison.cheapestTotalCents, comparison.currency)}</small>
      </div>
      <div>
        <span>Fastest lead</span>
        <strong>{comparison.fastestLabel}</strong>
        <small>{comparison.fastestLeadTimeDays}d</small>
      </div>
      <div>
        <span>Selected delta</span>
        <strong>
          {comparison.selectedPriceDeltaCents === 0
            ? "Best price"
            : `+${formatCurrency(comparison.selectedPriceDeltaCents, comparison.currency)}`}
        </strong>
        <small>{comparison.selectedLeadTimeDeltaDays === 0 ? "Fastest lead" : `+${comparison.selectedLeadTimeDeltaDays}d lead`}</small>
      </div>
    </div>
  )
}

function ProcessQuotePreviewButton({ onSelect, option }: { onSelect: () => void; option: ProcessQuotePreviewOption }) {
  return (
    <button aria-pressed={option.selected} className="process-demo-option" onClick={onSelect} type="button">
      <span>{option.label}</span>
      <strong>{formatCurrency(option.totalCents, option.currency)}</strong>
      <small>{option.leadTimeDays}d</small>
      <small data-status={option.draftStatus}>{option.draftCoverageLabel}</small>
      {option.badges.length > 0 ? (
        <span className="process-demo-option-badges">
          {option.badges.map((badge) => (
            <em key={badge}>{badge}</em>
          ))}
        </span>
      ) : null}
    </button>
  )
}

type PlasticPreviewEditorControl = {
  error?: string
  onChange: <K extends keyof PlasticsInputEditPatch>(field: K, value: PlasticsInputEditPatch[K]) => void
  state: PlasticsInputEditState
}

type WireEdmPreviewEditorControl = {
  error?: string
  onChange: <K extends keyof WireEdmInputEditPatch>(field: K, value: WireEdmInputEditPatch[K]) => void
  state: WireEdmInputEditState
}

type FabricationPreviewEditorControl = {
  error?: string
  onChange: <K extends keyof FabricationInputEditPatch>(field: K, value: FabricationInputEditPatch[K]) => void
  state: FabricationInputEditState
}

export function ProcessQuotePreviewCard({
  fabricationEditor,
  inputEditAdapter,
  plasticEditor,
  preview,
  promotionExecutionSnapshot,
  promotionPlan,
  recordPromotionExecutionRun,
  promotionSnapshot,
  sheetMetalEditor,
  wireEdmEditor,
}: {
  fabricationEditor?: FabricationPreviewEditorControl
  inputEditAdapter?: NonCncInputEditAdapterSummary
  plasticEditor?: PlasticPreviewEditorControl
  preview: ProcessQuotePreview
  promotionExecutionSnapshot: NonCncQuotePromotionExecutionPersistenceSnapshot
  promotionPlan: NonCncQuotePromotionPlan
  recordPromotionExecutionRun: (run: NonCncQuotePromotionExecutionRun) => () => void
  promotionSnapshot: NonCncQuotePromotionPersistenceSnapshot
  sheetMetalEditor?: {
    error?: string
    onChange: (field: keyof SheetMetalInputEditPatch, value: number) => void
    state: SheetMetalInputEditState
  }
  wireEdmEditor?: WireEdmPreviewEditorControl
}) {
  const demo = preview.selected
  const promotionRecord = promotionSnapshot.records.find((record) => record.planId === promotionPlan.planId)
  const promotionActionSummary = useMemo(
    () =>
      buildNonCncQuotePromotionActionSummary({
        selectedPlanId: promotionPlan.planId,
        snapshot: promotionSnapshot,
      }),
    [promotionPlan.planId, promotionSnapshot],
  )
  const promotionDraft = useMemo(() => buildNonCncQuotePromotionDraft(promotionActionSummary), [promotionActionSummary])
  const promotionCommandPackage = useMemo(() => buildNonCncQuotePromotionCommandPackage(promotionDraft), [promotionDraft])
  const promotionOutcomeDraft = useMemo(
    () => buildNonCncQuotePromotionExecutionOutcomeDraft(promotionCommandPackage),
    [promotionCommandPackage],
  )
  const promotionExecutionRun = useMemo(
    () =>
      buildNonCncQuotePromotionExecutionRun({
        actor: "FactoryBid Operator",
        commandPackage: promotionCommandPackage,
        executedAt: promotionPlan.requestedAt,
        mode: "dry_run",
      }),
    [promotionCommandPackage, promotionPlan.requestedAt],
  )
  const promotionExecutionRecord = promotionExecutionSnapshot.records.find(
    (record) => record.executionFingerprint === promotionExecutionRun.executionFingerprint,
  )
  const promotionExecutionStatusSummary = Object.entries(promotionExecutionSnapshot.statusCounts)
    .sort(([leftStatus], [rightStatus]) => leftStatus.localeCompare(rightStatus))
    .map(([status, count]) => `${humanizeKey(status)} ${count}`)
    .join(", ")
  useEffect(() => {
    if (!promotionRecord) {
      return undefined
    }
    return recordPromotionExecutionRun(promotionExecutionRun)
  }, [promotionExecutionRun, promotionRecord, recordPromotionExecutionRun])
  const [summaryFeedback, setSummaryFeedback] = useState<{
    kind: "idle" | "copied" | "error"
    summaryText: string
  }>({ kind: "idle", summaryText: preview.summaryText })
  const copyableSummaryText = inputEditAdapter
    ? buildProcessPreviewCopySummary(
        preview.summaryText,
        inputEditAdapter,
        Boolean(fabricationEditor ?? plasticEditor ?? sheetMetalEditor ?? wireEdmEditor),
      )
    : preview.summaryText
  const activeSummaryFeedback = summaryFeedback.summaryText === copyableSummaryText ? summaryFeedback.kind : "idle"
  const hasPreviewEditor = Boolean(fabricationEditor ?? plasticEditor ?? sheetMetalEditor ?? wireEdmEditor)

  const handleCopySummary = async () => {
    const copied = await copyTextToClipboard(copyableSummaryText)
    setSummaryFeedback({
      kind: copied ? "copied" : "error",
      summaryText: copyableSummaryText,
    })
  }

  return (
    <article className="process-demo-card" aria-label="Selected non-CNC quote preview">
      <div className="process-demo-card-heading">
        <div>
          <strong>{demo.label}</strong>
          <span>{demo.quote.partNumber}</span>
        </div>
        <span>{formatCurrency(demo.quote.totalCents, demo.quote.currency)}</span>
      </div>
      <div className="process-demo-metrics">
        <Metric label="Qty" value={String(demo.quote.quantity)} />
        <Metric label="Lead" value={`${demo.quote.leadTimeDays}d`} />
        <Metric label="Unit" value={formatCurrency(demo.quote.unitPriceCents, demo.quote.currency)} />
      </div>
      <dl className="process-demo-breakdown">
        {preview.topBreakdown.map((line) => (
          <div key={line.key}>
            <dt>{line.label}</dt>
            <dd>{formatCurrency(line.amountCents, demo.quote.currency)}</dd>
          </div>
        ))}
      </dl>
      <div className="process-demo-details">
        <div aria-label="Process quote assumptions">
          <strong>Assumptions</strong>
          {preview.topAssumptions.map((assumption) => (
            <span key={assumption.key}>
              {humanizeKey(assumption.key)}: {assumption.value}
            </span>
          ))}
        </div>
        <div aria-label="Process quote review flags">
          <strong>Review flags</strong>
          {preview.reviewFlags.length > 0 ? preview.reviewFlags.map((flag) => <span key={flag}>{flag}</span>) : <span>No calculator flags</span>}
        </div>
      </div>
      <div className="process-demo-checklist" aria-label="Process quote operator checklist">
        {preview.operatorChecklist.map((item) => (
          <div data-level={item.level} key={item.key}>
            <span>{item.label}</span>
            <small>{item.detail}</small>
          </div>
        ))}
      </div>
      <div className="process-demo-input-readiness" aria-label="Process input readiness">
        <div>
          <strong>Editable inputs blocked</strong>
          <span>{preview.inputReadiness.nextStep}</span>
        </div>
        <div>
          <span>Required groups</span>
          <ul>
            {preview.inputReadiness.requiredGroups.map((group) => (
              <li key={group}>{group}</li>
            ))}
          </ul>
        </div>
        <div className="process-demo-input-fields" aria-label="Planned process input fields">
          <span>Planned fields</span>
          <ul>
            {preview.inputReadiness.fieldPlans.map((field) => (
              <li key={field.key}>
                <span>{field.label}</span>
                <small>({field.valueKind})</small>
              </li>
            ))}
          </ul>
        </div>
        {inputEditAdapter ? (
          <div className="process-demo-input-adapter" aria-label="Non-CNC input edit adapter status">
            <span>Domain adapter ready</span>
            <strong>{inputEditAdapter.editVersion}</strong>
            <ul>
              <li>{formatFieldCount(inputEditAdapter.editableFieldKeys.length, "editable")} mapped</li>
              <li>{formatFieldCount(inputEditAdapter.readOnlyFieldKeys.length, "read-only")} guarded</li>
              <li>
                {fabricationEditor || plasticEditor || sheetMetalEditor || wireEdmEditor
                  ? "Preview controls enabled for supported fields"
                  : "UI controls guarded until process forms are enabled"}
              </li>
            </ul>
          </div>
        ) : null}
        {sheetMetalEditor ? <SheetMetalPreviewEditor editor={sheetMetalEditor} /> : null}
        {plasticEditor ? <PlasticPreviewEditor editor={plasticEditor} /> : null}
        {wireEdmEditor ? <WireEdmPreviewEditor editor={wireEdmEditor} /> : null}
        {fabricationEditor ? <FabricationPreviewEditor editor={fabricationEditor} /> : null}
        <div className="process-demo-input-draft" aria-label="Read-only process input draft">
          <span>
            Fixture draft {preview.inputDraft.populatedRequiredCount}/{preview.inputDraft.requiredCount}
          </span>
          <p className="process-demo-input-gate" aria-label="Non-CNC quote path gate">
            Quote path {preview.inputPromotionGate.status}: {preview.inputPromotionGate.blockerLabels.join(", ")}
          </p>
          <dl>
            {preview.inputDraft.values.map((field) => (
              <div data-status={field.status} key={field.key}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="process-demo-offer-handoff" aria-label="Non-CNC offer handoff readiness" data-status={preview.offerHandoff.status}>
        <div className="process-demo-offer-handoff-heading">
          <div>
            <span>Offer candidate</span>
            <strong>{preview.offerHandoff.statusLabel}</strong>
          </div>
          <small>{preview.offerHandoff.handoffVersion}</small>
        </div>
        <p>{preview.offerHandoff.summary}</p>
        <div className="process-demo-offer-handoff-grid">
          <div>
            <span>Candidate facts</span>
            <ul>
              {preview.offerHandoff.candidateLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <span>Release blockers</span>
            <ul>
              {preview.offerHandoff.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
          <div>
            <span>Next gates</span>
            <ul>
              {preview.offerHandoff.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="process-demo-promotion-plan" aria-label="Non-CNC quote promotion plan" data-status={promotionPlan.status}>
        <div className="process-demo-promotion-plan-heading">
          <div>
            <span>Promotion plan</span>
            <strong>{humanizeKey(promotionPlan.status)}</strong>
          </div>
          <small>{promotionPlan.planVersion}</small>
        </div>
        <p>{promotionPlan.releaseBoundary}</p>
        <div className="process-demo-promotion-plan-summary">
          <span>{promotionPlan.planId}</span>
          <span>
            {promotionPlan.quoteSnapshot.processLabel} · {formatCurrency(promotionPlan.quoteSnapshot.totalCents, promotionPlan.quoteSnapshot.currency)}
          </span>
        </div>
        <div className="process-demo-promotion-plan-grid">
          <div>
            <span>Blockers</span>
            <ul>
              {promotionPlan.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
          <div>
            <span>Commands</span>
            <ul>
              {promotionPlan.commands.map((command) => (
                <li data-status={command.status} key={command.key}>
                  <strong>{command.label}</strong>
                  <small>{command.detail}</small>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span>Next actions</span>
            <ul>
              {promotionPlan.nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {promotionRecord ? (
        <div
          className="process-demo-promotion-record"
          aria-label="Non-CNC promotion persistence snapshot"
          data-disposition={promotionRecord.disposition}
        >
          <div className="process-demo-promotion-record-heading">
            <div>
              <span>Persistence snapshot</span>
              <strong>{humanizeKey(promotionRecord.disposition)}</strong>
            </div>
            <small>{promotionRecord.persistenceVersion}</small>
          </div>
          <p>
            Local promotion history: {formatCount(promotionSnapshot.recordCount, "record")},{" "}
            {formatCount(promotionSnapshot.blockedPlanIds.length, "blocked", "blocked")},{" "}
            {formatCount(promotionSnapshot.candidatePlanIds.length, "candidate", "candidates")}.
          </p>
          <div className="process-demo-promotion-record-grid">
            <div>
              <span>Recorded by</span>
              <strong>{promotionRecord.recordedBy}</strong>
              <small>{promotionRecord.recordedAt}</small>
            </div>
            <div>
              <span>Status</span>
              <strong>{humanizeKey(promotionRecord.status)}</strong>
              <small>{promotionRecord.planId}</small>
            </div>
            <div>
              <span>Snapshot ids</span>
              <small>Blocked: {promotionSnapshot.blockedPlanIds.join(", ") || "None"}</small>
              <small>Candidate: {promotionSnapshot.candidatePlanIds.join(", ") || "None"}</small>
            </div>
          </div>
        </div>
      ) : null}
      <div
        className="process-demo-promotion-actions"
        aria-label="Non-CNC promotion actions"
        data-status={promotionActionSummary.status}
      >
        <div className="process-demo-promotion-actions-heading">
          <div>
            <span>Promotion actions</span>
            <strong>{humanizeKey(promotionActionSummary.status)}</strong>
          </div>
          <small>{promotionActionSummary.actionVersion}</small>
        </div>
        <p>{promotionActionSummary.nextOperatorMessage}</p>
        <div className="process-demo-promotion-actions-summary">
          <span>{promotionActionSummary.canPromoteQuote ? "Quote promotion ready" : "Quote promotion guarded"}</span>
          <span>{promotionActionSummary.selectedPlanId}</span>
        </div>
        <ul className="process-demo-promotion-actions-list">
          {promotionActionSummary.actions.map((action) => (
            <li data-status={action.state} key={action.key}>
              <div>
                <strong>{action.label}</strong>
                <span>{humanizeKey(action.state)}</span>
              </div>
              <small>{action.detail}</small>
              {action.blockerLabels.length > 0 ? (
                <small>Blockers: {action.blockerLabels.join(", ")}</small>
              ) : (
                <small>Blockers: None</small>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="process-demo-promotion-draft" aria-label="Non-CNC promotion draft payload" data-status={promotionDraft.status}>
        <div className="process-demo-promotion-draft-heading">
          <div>
            <span>Promotion draft</span>
            <strong>{humanizeKey(promotionDraft.status)}</strong>
          </div>
          <small>{promotionDraft.draftVersion}</small>
        </div>
        <p>{promotionDraft.status === "ready" ? "Ready-only quote payload preview is available." : "Quote payload stays withheld until promotion is ready."}</p>
        <div className="process-demo-promotion-draft-grid">
          <div>
            <span>Payload</span>
            {promotionDraft.quoteSnapshot ? (
              <>
                <strong>{promotionDraft.quoteSnapshot.partNumber}</strong>
                <small>
                  {promotionDraft.quoteSnapshot.processLabel} ·{" "}
                  {formatCurrency(promotionDraft.quoteSnapshot.totalCents, promotionDraft.quoteSnapshot.currency)}
                </small>
              </>
            ) : (
              <>
                <strong>No quote payload</strong>
                <small>{promotionDraft.blockerLabels.join(", ") || "No blockers"}</small>
              </>
            )}
          </div>
          <div>
            <span>Commands</span>
            <strong>{formatCount(promotionDraft.actionKeys.length, "command")}</strong>
            <small>{promotionDraft.actionKeys.join(", ")}</small>
          </div>
          <div>
            <span>Warnings</span>
            <strong>{formatCount(promotionDraft.reviewWarnings.length, "warning")}</strong>
            <small>{promotionDraft.reviewWarnings.join(", ") || "None"}</small>
          </div>
        </div>
      </div>
      <div
        className="process-demo-promotion-package"
        aria-label="Non-CNC promotion command package"
        data-status={promotionCommandPackage.status}
      >
        <div className="process-demo-promotion-package-heading">
          <div>
            <span>Command package</span>
            <strong>{humanizeKey(promotionCommandPackage.status)}</strong>
          </div>
          <small>{promotionCommandPackage.packageVersion}</small>
        </div>
        <p>{promotionCommandPackage.nextOperatorMessage}</p>
        <div className="process-demo-promotion-package-grid">
          <div>
            <span>Package id</span>
            <strong>{promotionCommandPackage.packageId}</strong>
            <small>{promotionCommandPackage.targetRfqId ?? "No target RFQ payload"}</small>
          </div>
          <div>
            <span>Payloads</span>
            <strong>
              {formatCount(promotionCommandPackage.commands.filter((command) => command.payload).length, "payload")}
            </strong>
            <small>{promotionCommandPackage.blockerLabels.join(", ") || "Package payloads are ready"}</small>
          </div>
          <div>
            <span>Warnings</span>
            <strong>{formatCount(promotionCommandPackage.reviewWarnings.length, "warning")}</strong>
            <small>{promotionCommandPackage.reviewWarnings.join(", ") || "None"}</small>
          </div>
        </div>
        <ul className="process-demo-promotion-package-list">
          {promotionCommandPackage.commands.map((command) => (
            <li data-status={command.status} key={command.key}>
              <div>
                <strong>{command.label}</strong>
                <span>{command.payload ? "Payload ready" : "Payload withheld"}</span>
              </div>
              <small>{command.blockerLabels.join(", ") || "No blockers"}</small>
            </li>
          ))}
        </ul>
      </div>
      <div
        className="process-demo-promotion-outcome-draft"
        aria-label="Non-CNC promotion outcome draft"
        data-status={promotionOutcomeDraft.status}
      >
        <div className="process-demo-promotion-outcome-draft-heading">
          <div>
            <span>Outcome draft</span>
            <strong>{humanizeKey(promotionOutcomeDraft.status)}</strong>
          </div>
          <small>{promotionOutcomeDraft.draftVersion}</small>
        </div>
        <p>{promotionOutcomeDraft.nextOperatorMessage}</p>
        <div className="process-demo-promotion-outcome-draft-grid">
          <div>
            <span>Outcomes</span>
            <strong>{formatCount(promotionOutcomeDraft.readyOutcomeCount, "ready outcome")}</strong>
            <small>{formatCount(promotionOutcomeDraft.blockedOutcomeCount, "blocked outcome")}</small>
          </div>
          <div>
            <span>Target</span>
            <strong>{promotionOutcomeDraft.targetRfqId ?? "No target RFQ"}</strong>
            <small>{promotionOutcomeDraft.selectedPlanId}</small>
          </div>
          <div>
            <span>Warnings</span>
            <strong>{formatCount(promotionOutcomeDraft.reviewWarnings.length, "warning")}</strong>
            <small>{promotionOutcomeDraft.reviewWarnings.join(", ") || "None"}</small>
          </div>
        </div>
        <ul className="process-demo-promotion-outcome-draft-list">
          {promotionOutcomeDraft.commandOutcomes.map((command) => (
            <li data-status={command.status} key={command.key}>
              <div>
                <strong>{command.label}</strong>
                <span>{command.suggestedOutcome ? "Outcome ready" : "Outcome withheld"}</span>
              </div>
              <small>{command.payloadKind ? humanizeKey(command.payloadKind) : command.blockerLabels.join(", ") || "No payload"}</small>
              {command.suggestedOutcome ? <small>{command.suggestedOutcome.externalId}</small> : null}
            </li>
          ))}
        </ul>
      </div>
      <div
        className="process-demo-promotion-execution"
        aria-label="Non-CNC promotion execution audit"
        data-status={promotionExecutionRun.status}
      >
        <div className="process-demo-promotion-execution-heading">
          <div>
            <span>Execution audit</span>
            <strong>{humanizeKey(promotionExecutionRun.status)}</strong>
          </div>
          <small>{promotionExecutionRun.executionVersion}</small>
        </div>
        <p>Dry-run audit only; active RFQ quote, offer, and release state stay unchanged.</p>
        <div className="process-demo-promotion-execution-grid">
          <div>
            <span>Fingerprint</span>
            <strong>{promotionExecutionRun.executionFingerprint}</strong>
            <small>{promotionExecutionRun.mode}</small>
          </div>
          <div>
            <span>Commands</span>
            <strong>{formatCount(promotionExecutionRun.commands.length, "command")}</strong>
            <small>{promotionExecutionRun.commands.map((command) => humanizeKey(command.status)).join(", ")}</small>
          </div>
          <div>
            <span>Warnings</span>
            <strong>{formatCount(promotionExecutionRun.warnings.length, "warning")}</strong>
            <small>{promotionExecutionRun.warnings.join(", ") || "None"}</small>
          </div>
        </div>
        <ul className="process-demo-promotion-execution-list">
          {promotionExecutionRun.commands.map((command) => (
            <li data-status={command.status} key={command.key}>
              <div>
                <strong>{command.label}</strong>
                <span>{humanizeKey(command.status)}</span>
              </div>
              <small>{command.idempotencyKey}</small>
            </li>
          ))}
        </ul>
        <div className="process-demo-promotion-execution-next">
          <span>Next actions</span>
          <ul>
            {promotionExecutionRun.nextActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      </div>
      {promotionExecutionRecord ? (
        <div
          className="process-demo-promotion-execution-history"
          aria-label="Non-CNC promotion execution history"
          data-status={promotionExecutionRecord.status}
        >
          <div className="process-demo-promotion-execution-history-heading">
            <div>
              <span>Execution history</span>
              <strong>{formatCount(promotionExecutionSnapshot.recordCount, "record")}</strong>
            </div>
            <small>{promotionExecutionSnapshot.persistenceVersion}</small>
          </div>
          <p>
            Local execution history: {formatCount(promotionExecutionSnapshot.recordCount, "run")},{" "}
            {formatCount(promotionExecutionSnapshot.pendingActionCount, "pending action")},{" "}
            {formatCount(promotionExecutionSnapshot.warningCount, "warning")}.
          </p>
          <div className="process-demo-promotion-execution-history-grid">
            <div>
              <span>Latest run</span>
              <strong>{humanizeKey(promotionExecutionRecord.status)}</strong>
              <small>{promotionExecutionRecord.executedAt}</small>
            </div>
            <div>
              <span>Command totals</span>
              <strong>{formatCount(promotionExecutionRecord.commandCount, "command")}</strong>
              <small>
                Prepared {promotionExecutionRecord.preparedCommandCount}, blocked {promotionExecutionRecord.blockedCommandCount},
                pending {promotionExecutionRecord.pendingCommandCount}
              </small>
            </div>
            <div>
              <span>Snapshot ids</span>
              <small>Packages: {promotionExecutionSnapshot.packageIds.join(", ") || "None"}</small>
              <small>Plans: {promotionExecutionSnapshot.selectedPlanIds.join(", ") || "None"}</small>
            </div>
          </div>
          <small className="process-demo-promotion-execution-history-status">
            Status counts: {promotionExecutionStatusSummary || "None"}
          </small>
        </div>
      ) : null}
      <div className="process-demo-footer">
        <small>{demo.quote.warnings[0] ?? "No calculator flags"}</small>
        <span>{demo.quote.calculatorVersion}</span>
      </div>
      <div className="process-demo-actions" aria-label="Process quote preview actions">
        <Button onClick={() => void handleCopySummary()} size="sm" type="button" variant="outline">
          <Copy aria-hidden="true" />
          {activeSummaryFeedback === "copied" ? "Copied" : "Copy summary"}
        </Button>
        <p aria-live="polite" className={activeSummaryFeedback === "error" ? "is-error" : ""} role="status">
          {processPreviewSummaryFeedback(activeSummaryFeedback)}
        </p>
      </div>
      <p className="process-demo-guardrail">
        {hasPreviewEditor
          ? "Preview-only registry edits are enabled for this process; active RFQ quote, offer, and release paths stay unchanged."
          : preview.guardrailCopy}
      </p>
    </article>
  )
}

function PlasticPreviewEditor({
  editor,
}: {
  editor: PlasticPreviewEditorControl
}) {
  return (
    <div className="process-demo-input-editor" aria-label="Plastic preview edit controls">
      <div>
        <span>Preview editor</span>
        <strong>Plastic machining only</strong>
        <small>Updates this registry preview only; RFQ quote, offer, and release paths stay unchanged.</small>
      </div>
      <div className="process-demo-input-editor-grid">
        <TextEditInput
          label="Material family"
          onChange={(value) => editor.onChange("materialFamily", value)}
          value={editor.state.materialFamily}
        />
        <NumberEditInput
          label="Stock length"
          min={1}
          onChange={(value) => editor.onChange("stockLengthMm", value)}
          suffix="mm"
          value={editor.state.stockLengthMm}
        />
        <NumberEditInput
          label="Stock width"
          min={1}
          onChange={(value) => editor.onChange("stockWidthMm", value)}
          suffix="mm"
          value={editor.state.stockWidthMm}
        />
        <NumberEditInput
          label="Stock height"
          min={1}
          onChange={(value) => editor.onChange("stockHeightMm", value)}
          suffix="mm"
          value={editor.state.stockHeightMm}
        />
        <TextEditInput
          label="Surface finish"
          onChange={(value) => editor.onChange("surfaceFinish", value)}
          value={editor.state.surfaceFinish}
        />
      </div>
      <div className="process-demo-read-only-field" aria-label="Plastic guarded operation count">
        <span>Operation count</span>
        <strong>{editor.state.operationCount}</strong>
        <small>Derived and read-only until operation-level editing is supported.</small>
      </div>
      <p aria-live="polite" role="status">
        {editor.error ?? "Plastic preview quote recalculated through the non-CNC edit registry."}
      </p>
    </div>
  )
}

function WireEdmPreviewEditor({
  editor,
}: {
  editor: WireEdmPreviewEditorControl
}) {
  return (
    <div className="process-demo-input-editor" aria-label="Wire EDM preview edit controls">
      <div>
        <span>Preview editor</span>
        <strong>Wire EDM only</strong>
        <small>Updates this registry preview only; RFQ quote, offer, and release paths stay unchanged.</small>
      </div>
      <div className="process-demo-input-editor-grid">
        <NumberEditInput
          label="Stock length"
          min={1}
          onChange={(value) => editor.onChange("stockLengthMm", value)}
          suffix="mm"
          value={editor.state.stockLengthMm}
        />
        <NumberEditInput
          label="Stock width"
          min={1}
          onChange={(value) => editor.onChange("stockWidthMm", value)}
          suffix="mm"
          value={editor.state.stockWidthMm}
        />
        <NumberEditInput
          label="Stock height"
          min={1}
          onChange={(value) => editor.onChange("stockHeightMm", value)}
          suffix="mm"
          value={editor.state.stockHeightMm}
        />
        <NumberEditInput
          label="Contour length"
          min={1}
          onChange={(value) => editor.onChange("contourLengthMm", value)}
          suffix="mm"
          value={editor.state.contourLengthMm}
        />
        <NumberEditInput
          label="Skim passes"
          min={0}
          onChange={(value) => editor.onChange("skimPasses", value)}
          step={1}
          value={editor.state.skimPasses}
        />
        <TextEditInput
          label="Inspection level"
          onChange={(value) => editor.onChange("inspectionLevel", value)}
          value={editor.state.inspectionLevel}
        />
      </div>
      <p aria-live="polite" role="status">
        {editor.error ?? "Wire EDM preview quote recalculated through the non-CNC edit registry."}
      </p>
    </div>
  )
}

function FabricationPreviewEditor({
  editor,
}: {
  editor: FabricationPreviewEditorControl
}) {
  return (
    <div className="process-demo-input-editor" aria-label="Fabrication preview edit controls">
      <div>
        <span>Preview editor</span>
        <strong>Fabrication only</strong>
        <small>Updates this registry preview only; RFQ quote, offer, and release paths stay unchanged.</small>
      </div>
      <div className="process-demo-input-editor-grid">
        <NumberEditInput
          label="Fabrication minutes"
          min={1}
          onChange={(value) => editor.onChange("fabricationMinutesPerPart", value)}
          suffix="min"
          value={editor.state.fabricationMinutesPerPart}
        />
        <NumberEditInput
          label="Welding minutes"
          min={0}
          onChange={(value) => editor.onChange("weldingMinutesPerPart", value)}
          suffix="min"
          value={editor.state.weldingMinutesPerPart}
        />
        <NumberEditInput
          label="Assembly minutes"
          min={0}
          onChange={(value) => editor.onChange("assemblyMinutesPerPart", value)}
          suffix="min"
          value={editor.state.assemblyMinutesPerPart}
        />
        <NumberEditInput
          label="Inspection minutes"
          min={0}
          onChange={(value) => editor.onChange("inspectionMinutesPerPart", value)}
          suffix="min"
          value={editor.state.inspectionMinutesPerPart}
        />
        <NumberEditInput
          label="Complexity multiplier"
          min={0.1}
          onChange={(value) => editor.onChange("complexityMultiplier", value)}
          step={0.05}
          value={editor.state.complexityMultiplier}
        />
        <TextEditInput
          label="Finish requirement"
          onChange={(value) => editor.onChange("finishRequirement", value)}
          value={editor.state.finishRequirement}
        />
      </div>
      <p aria-live="polite" role="status">
        {editor.error ?? "Fabrication preview quote recalculated through the non-CNC edit registry."}
      </p>
    </div>
  )
}

function SheetMetalPreviewEditor({
  editor,
}: {
  editor: {
    error?: string
    onChange: (field: keyof SheetMetalInputEditPatch, value: number) => void
    state: SheetMetalInputEditState
  }
}) {
  return (
    <div className="process-demo-input-editor" aria-label="Sheet metal preview edit controls">
      <div>
        <span>Preview editor</span>
        <strong>Sheet metal only</strong>
        <small>Updates this registry preview only; RFQ quote, offer, and release paths stay unchanged.</small>
      </div>
      <div className="process-demo-input-editor-grid">
        <NumberEditInput
          label="Blank length"
          min={1}
          onChange={(value) => editor.onChange("blankLengthMm", value)}
          suffix="mm"
          value={editor.state.blankLengthMm}
        />
        <NumberEditInput
          label="Blank width"
          min={1}
          onChange={(value) => editor.onChange("blankWidthMm", value)}
          suffix="mm"
          value={editor.state.blankWidthMm}
        />
        <NumberEditInput
          label="Thickness"
          min={0.1}
          onChange={(value) => editor.onChange("materialThicknessMm", value)}
          step={0.1}
          suffix="mm"
          value={editor.state.materialThicknessMm}
        />
        <NumberEditInput
          label="Cut length"
          min={1}
          onChange={(value) => editor.onChange("cuttingLengthMm", value)}
          suffix="mm"
          value={editor.state.cuttingLengthMm}
        />
        <NumberEditInput
          label="Bends"
          min={0}
          onChange={(value) => editor.onChange("bendCount", value)}
          step={1}
          value={editor.state.bendCount}
        />
      </div>
      <p aria-live="polite" role="status">
        {editor.error ?? "Sheet metal preview quote recalculated through the non-CNC edit registry."}
      </p>
    </div>
  )
}

function TextEditInput({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label>
      <span>{label}</span>
      <input onChange={(event) => onChange(event.currentTarget.value)} type="text" value={value} />
    </label>
  )
}

function NumberEditInput({
  label,
  min,
  onChange,
  step = 1,
  suffix,
  value,
}: {
  label: string
  min: number
  onChange: (value: number) => void
  step?: number
  suffix?: string
  value: number
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        min={min}
        onChange={(event) => {
          const rawValue = event.currentTarget.value
          onChange(rawValue === "" ? Number.NaN : Number(rawValue))
        }}
        step={step}
        type="number"
        value={Number.isFinite(value) ? value : ""}
      />
      {suffix ? <small>{suffix}</small> : null}
    </label>
  )
}

function formatFieldCount(count: number, label: string): string {
  return `${count} ${label} field${count === 1 ? "" : "s"}`
}

function formatCount(count: number, label: string, pluralLabel = `${label}s`): string {
  return `${count} ${count === 1 ? label : pluralLabel}`
}

function buildProcessPreviewCopySummary(
  summaryText: string,
  adapter: NonCncInputEditAdapterSummary,
  hasPreviewEditor: boolean,
): string {
  return [
    summaryText,
    "",
    "Input edit adapter:",
    `- Version: ${adapter.editVersion}`,
    `- Editable fields mapped: ${adapter.editableFieldKeys.join(", ") || "None"}`,
    `- Read-only fields guarded: ${adapter.readOnlyFieldKeys.join(", ") || "None"}`,
    `- UI controls: ${hasPreviewEditor ? "preview controls enabled for supported fields" : "guarded until process forms are enabled"}`,
  ].join("\n")
}

function processPreviewSummaryFeedback(feedback: "idle" | "copied" | "error"): string {
  switch (feedback) {
    case "copied":
      return "Process preview summary copied."
    case "error":
      return "Copy unavailable; select the preview details manually."
    default:
      return "Copy a read-only summary for estimator review."
  }
}

function CapacityCommitmentPanel({ plan, selectedItem }: { plan: CapacityCommitmentPlan; selectedItem: QuoteWorkItem }) {
  const selectedCommitment = findCommitmentForItem(plan, selectedItem.id)
  const selectedProcessPlan = plan.processPlans.find((processPlan) => processPlan.process === selectedItem.quoteInput.process)

  return (
    <section className="capacity-commitment-panel" aria-label="Capacity commitment plan">
      <div className="capacity-commitment-heading">
        <div>
          <span className="eyebrow">
            <TimerReset aria-hidden="true" />
            Capacity
          </span>
          <strong>
            {plan.planningDays}-day plan · {capacityStatusLabel(plan.status)}
          </strong>
        </div>
        <span className={`capacity-status capacity-status-${plan.status}`}>{humanizeKey(plan.status)}</span>
      </div>
      <div className="capacity-summary">
        <Metric label="Demand" value={formatMinutes(plan.totalDemandMinutes)} />
        <Metric label="Available" value={formatMinutes(plan.totalAvailableMinutes)} />
        <Metric label="Overload" value={formatMinutes(plan.totalOverloadMinutes)} />
      </div>
      <div className="capacity-process-list">
        {plan.processPlans.map((processPlan) => (
          <CapacityProcessRow
            active={processPlan.process === selectedItem.quoteInput.process}
            key={processPlan.process}
            processPlan={processPlan}
          />
        ))}
      </div>
      <div className="capacity-selected-rfq" data-status={selectedCommitment?.status ?? "unplanned"}>
        <div>
          <span>Selected RFQ</span>
          <strong>{selectedItem.quoteInput.partNumber}</strong>
        </div>
        <div>
          <span>Schedule</span>
          <strong>{formatCapacitySchedule(selectedCommitment)}</strong>
        </div>
        <div>
          <span>Required</span>
          <strong>{formatMinutes(selectedCommitment?.requiredMinutes ?? 0)}</strong>
        </div>
        <div>
          <span>Process load</span>
          <strong>{selectedProcessPlan ? formatCapacityPressure(selectedProcessPlan) : "No open load"}</strong>
        </div>
      </div>
    </section>
  )
}

function MaterialAvailabilityPanel({ plan, selectedItem }: { plan: MaterialAvailabilityPlan; selectedItem: QuoteWorkItem }) {
  const selectedCommitment = plan.commitments.find((commitment) => commitment.itemId === selectedItem.id)
  const visibleCommitments = prioritizeMaterialCommitments(plan.commitments, selectedItem.id)

  return (
    <section className="material-availability-panel" aria-label="Material availability plan">
      <div className="material-availability-heading">
        <div>
          <span className="eyebrow">
            <PackageCheck aria-hidden="true" />
            Materials
          </span>
          <strong>
            {plan.materialCount} material families · {materialAvailabilityStatusLabel(plan.status)}
          </strong>
        </div>
        <span className={`material-availability-status material-availability-status-${plan.status}`}>
          {materialAvailabilityStatusLabel(plan.status)}
        </span>
      </div>
      <div className="material-availability-summary">
        <Metric label="Demand" value={formatKilograms(plan.totalRequiredKg)} />
        <Metric label="Allocated" value={formatKilograms(plan.totalAllocatedKg)} />
        <Metric label="Purchase" value={formatKilograms(plan.totalPurchaseKg)} />
        <Metric label="Risk" value={String(plan.atRiskCount + plan.blockedCount)} />
      </div>
      {selectedCommitment ? (
        <div className="material-selected-rfq" data-status={selectedCommitment.status}>
          <div>
            <span>Selected RFQ</span>
            <strong>{selectedItem.quoteInput.partNumber}</strong>
          </div>
          <div>
            <span>Material</span>
            <strong>{selectedCommitment.materialName}</strong>
          </div>
          <div>
            <span>Required</span>
            <strong>{formatKilograms(selectedCommitment.requiredKg)}</strong>
          </div>
          <div>
            <span>Action</span>
            <strong>{formatMaterialAction(selectedCommitment)}</strong>
          </div>
        </div>
      ) : null}
      <div className="material-availability-list">
        {visibleCommitments.map((commitment) => (
          <MaterialAvailabilityRow
            commitment={commitment}
            key={commitment.itemId}
            selected={commitment.itemId === selectedItem.id}
          />
        ))}
      </div>
    </section>
  )
}

function MaterialAvailabilityRow({
  commitment,
  selected,
}: {
  commitment: MaterialAvailabilityCommitment
  selected: boolean
}) {
  return (
    <article className="material-availability-row" data-selected={selected} data-status={commitment.status}>
      <div>
        <strong>{commitment.materialName}</strong>
        <span>{commitment.customerName}</span>
      </div>
      <div>
        <span>Allocated</span>
        <strong>{formatKilograms(commitment.allocatedKg)}</strong>
      </div>
      <div>
        <span>Purchase</span>
        <strong>{formatKilograms(commitment.purchaseKg)}</strong>
      </div>
      <div>
        <span>Supplier</span>
        <strong>{commitment.supplierName ?? "Stock"}</strong>
      </div>
      <div>
        <span>Request by</span>
        <strong>{commitment.requestBy ?? "Ready"}</strong>
      </div>
      <small>{formatMaterialIssueSummary(commitment)}</small>
    </article>
  )
}

function OutsideServicePanel({ plan, selectedItem }: { plan: OutsideServicePlan; selectedItem: QuoteWorkItem }) {
  const selectedCommitments = plan.commitments.filter((commitment) => commitment.itemId === selectedItem.id)
  const visibleCommitments = selectedCommitments.length > 0 ? selectedCommitments : plan.commitments.slice(0, 2)

  return (
    <section className="outside-service-panel" aria-label="Outside service plan">
      <div className="outside-service-heading">
        <div>
          <span className="eyebrow">
            <Truck aria-hidden="true" />
            Outside services
          </span>
          <strong>
            {plan.serviceCount === 0 ? "No outsourced operations" : `${plan.serviceCount} service${plan.serviceCount === 1 ? "" : "s"} planned`}
          </strong>
        </div>
        <span className={`outside-service-status outside-service-status-${plan.status}`}>{outsideServiceStatusLabel(plan.status)}</span>
      </div>
      <div className="outside-service-summary">
        <Metric label="Total cost" value={formatCurrency(plan.totalCostCents, "EUR")} />
        <Metric label="At risk" value={String(plan.atRiskCount)} />
        <Metric label="Blocked" value={String(plan.blockedCount)} />
      </div>
      {visibleCommitments.length > 0 ? (
        <div className="outside-service-list">
          {visibleCommitments.map((commitment) => (
            <OutsideServiceRow commitment={commitment} key={commitment.serviceKey} selected={commitment.itemId === selectedItem.id} />
          ))}
        </div>
      ) : (
        <div className="outside-service-empty">No open RFQs currently need outsourced finishing or subcontracted operations.</div>
      )}
    </section>
  )
}

function OutsideServiceRow({
  commitment,
  selected,
}: {
  commitment: OutsideServiceCommitment
  selected: boolean
}) {
  const issue = commitment.issues[0]

  return (
    <article className="outside-service-row" data-risk={commitment.risk} data-selected={selected}>
      <div>
        <strong>{commitment.label}</strong>
        <span>{commitment.supplierName ?? "Supplier needed"}</span>
      </div>
      <div>
        <span>Request by</span>
        <strong>{commitment.requestBy}</strong>
      </div>
      <div>
        <span>Required by</span>
        <strong>{commitment.requiredBy}</strong>
      </div>
      <div>
        <span>Risk</span>
        <strong>{outsideServiceStatusLabel(commitment.risk)}</strong>
      </div>
      <small>{issue?.message ?? `${humanizeKey(commitment.status)} with ${commitment.leadTimeDays}d supplier lead time.`}</small>
    </article>
  )
}

function CapacityProcessRow({
  active,
  processPlan,
}: {
  active: boolean
  processPlan: CapacityProcessCommitment
}) {
  return (
    <article className="capacity-process-row" data-active={active} data-status={processPlan.status}>
      <div>
        <strong>{formatProcess(processPlan.process)}</strong>
        <span>
          {processPlan.commitments.length} RFQs · {formatMinutes(processPlan.demandMinutes)} demand
        </span>
      </div>
      <div>
        <span>{processPlan.overloadMinutes > 0 ? "Overload" : "Remaining"}</span>
        <strong>{formatMinutes(processPlan.overloadMinutes > 0 ? processPlan.overloadMinutes : processPlan.remainingCapacityMinutes)}</strong>
      </div>
      <span className={`capacity-status capacity-status-${processPlan.status}`}>{humanizeKey(processPlan.status)}</span>
    </article>
  )
}

function CostingView({
  cadCorrectionDraft,
  cadReviewDraft,
  cadReviewOverride,
  cycleMinutes,
  machineHourlyRateCents,
  marginPercent,
  materialCostCentsPerKg,
  partPreview,
  quantity,
  quote,
  rush,
  scenarioComparison,
  selectedItem,
  onAcknowledgeCadFlags,
  onCadCorrectionDraftChange,
  onCadReviewDraftChange,
  onPrimaryAttachmentChange,
  onResetCadReview,
  onSaveCadCorrections,
  setCycleMinutes,
  setMachineHourlyRateCents,
  setMarginPercent,
  setMaterialCostCentsPerKg,
  setQuantity,
  setRush,
  setSetupMinutes,
  setupMinutes,
}: {
  cadCorrectionDraft: CadReviewCorrectionNotes
  cadReviewDraft: string
  cadReviewOverride: CadReviewOverrideState | undefined
  cycleMinutes: number
  machineHourlyRateCents: number
  marginPercent: number
  materialCostCentsPerKg: number
  partPreview: PartPreviewModel
  quantity: number
  quote: CncQuoteResult
  rush: boolean
  scenarioComparison: QuoteComparisonResult
  selectedItem: QuoteWorkItem
  onAcknowledgeCadFlags: () => void
  onCadCorrectionDraftChange: (field: keyof CadReviewCorrectionNotes, value: string) => void
  onCadReviewDraftChange: (value: string) => void
  onPrimaryAttachmentChange: (fileName: string) => void
  onResetCadReview: () => void
  onSaveCadCorrections: () => void
  setCycleMinutes: (value: number) => void
  setMachineHourlyRateCents: (value: number) => void
  setMarginPercent: (value: number) => void
  setMaterialCostCentsPerKg: (value: number) => void
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
      <PartPreviewPanel
        cadCorrectionDraft={cadCorrectionDraft}
        cadReviewDraft={cadReviewDraft}
        onAcknowledgeCadFlags={onAcknowledgeCadFlags}
        onCadCorrectionDraftChange={onCadCorrectionDraftChange}
        onCadReviewDraftChange={onCadReviewDraftChange}
        onPrimaryAttachmentChange={onPrimaryAttachmentChange}
        onResetCadReview={onResetCadReview}
        onSaveCadCorrections={onSaveCadCorrections}
        override={cadReviewOverride}
        preview={partPreview}
      />
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
        <label className="field">
          <span>Material €/kg</span>
          <input
            aria-label="Material cost per kg"
            min={0}
            onChange={(event) => setMaterialCostCentsPerKg(toCents(event.target.value))}
            step={0.01}
            type="number"
            value={formatCentsInput(materialCostCentsPerKg)}
          />
        </label>
        <label className="field">
          <span>Machine €/h</span>
          <input
            aria-label="Machine hourly rate"
            min={0.01}
            onChange={(event) => setMachineHourlyRateCents(toPositiveCents(event.target.value))}
            step={0.01}
            type="number"
            value={formatCentsInput(machineHourlyRateCents)}
          />
        </label>
        <label className="field">
          <span>Margin %</span>
          <input
            aria-label="Margin percent"
            min={0}
            onChange={(event) => setMarginPercent(toNumber(event.target.value))}
            step={0.1}
            type="number"
            value={marginPercent}
          />
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

function PartPreviewPanel({
  cadCorrectionDraft,
  cadReviewDraft,
  onAcknowledgeCadFlags,
  onCadCorrectionDraftChange,
  onCadReviewDraftChange,
  onPrimaryAttachmentChange,
  onResetCadReview,
  onSaveCadCorrections,
  override,
  preview,
}: {
  cadCorrectionDraft: CadReviewCorrectionNotes
  cadReviewDraft: string
  onAcknowledgeCadFlags: () => void
  onCadCorrectionDraftChange: (field: keyof CadReviewCorrectionNotes, value: string) => void
  onCadReviewDraftChange: (value: string) => void
  onPrimaryAttachmentChange: (fileName: string) => void
  onResetCadReview: () => void
  onSaveCadCorrections: () => void
  override: CadReviewOverrideState | undefined
  preview: PartPreviewModel
}) {
  const acknowledgedFlags = new Set(override?.acknowledgedFlags ?? [])
  const visibleManufacturabilityFlags = preview.manufacturabilityFlags.filter((flag) => !acknowledgedFlags.has(flag))
  const normalizedCorrectionDraft = normalizeCadReviewCorrectionNotes(cadCorrectionDraft)
  const canSaveCadCorrections = !cadReviewCorrectionNotesEqual(normalizedCorrectionDraft, override?.correctionNotes)
  return (
    <section className="part-preview" aria-label="Part preview">
      <div className="preview-viewport" data-mode={preview.primaryMode}>
        <div className="preview-icon" aria-hidden="true">
          <Cuboid />
        </div>
        <div>
          <span>{formatPreviewMode(preview.primaryMode)}</span>
          <strong>{preview.primaryAttachmentName ?? preview.partNumber}</strong>
          <small>{preview.primaryPreviewLabel}</small>
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
        {visibleManufacturabilityFlags.length > 0 ? (
          <div className="manufacturability-list" aria-label="Manufacturability flags">
            {visibleManufacturabilityFlags.map((flag) => (
              <span className="manufacturability-chip" key={flag}>
                <AlertTriangle aria-hidden="true" />
                {humanizeKey(flag)}
              </span>
            ))}
          </div>
        ) : null}
        {preview.manufacturabilityFlags.length > 0 ? (
          <div className="cad-review-override" aria-label="CAD review override">
            {override ? (
              <div className="cad-review-summary">
                <CheckCircle2 aria-hidden="true" />
                <span>
                  {override.acknowledgedFlags.length > 0 ? (
                    <>
                      Acknowledged {override.acknowledgedFlags.length} flag{override.acknowledgedFlags.length === 1 ? "" : "s"} by {override.reviewedBy} at{" "}
                      {formatShortDateTime(override.reviewedAt)}.
                    </>
                  ) : override.correctionNotes ? (
                    <>Saved CAD corrections by {override.reviewedBy} at {formatShortDateTime(override.reviewedAt)}.</>
                  ) : (
                    <>Cleared CAD corrections by {override.reviewedBy} at {formatShortDateTime(override.reviewedAt)}.</>
                  )}
                </span>
              </div>
            ) : null}
            {override?.note ? <p>{override.note}</p> : null}
            {override?.correctionNotes ? (
              <dl className="cad-correction-summary" aria-label="CAD correction notes">
                {override.correctionNotes.dimensions ? (
                  <>
                    <dt>Dimensions</dt>
                    <dd>{override.correctionNotes.dimensions}</dd>
                  </>
                ) : null}
                {override.correctionNotes.material ? (
                  <>
                    <dt>Material</dt>
                    <dd>{override.correctionNotes.material}</dd>
                  </>
                ) : null}
                {override.correctionNotes.process ? (
                  <>
                    <dt>Process</dt>
                    <dd>{override.correctionNotes.process}</dd>
                  </>
                ) : null}
              </dl>
            ) : null}
            <div className="cad-correction-grid">
              <label className="field">
                <span>Dimension correction</span>
                <input
                  aria-label="Dimension correction note"
                  onChange={(event) => onCadCorrectionDraftChange("dimensions", event.target.value)}
                  placeholder="e.g. drawing says 118 mm length"
                  value={cadCorrectionDraft.dimensions ?? ""}
                />
              </label>
              <label className="field">
                <span>Material correction</span>
                <input
                  aria-label="Material correction note"
                  onChange={(event) => onCadCorrectionDraftChange("material", event.target.value)}
                  placeholder="e.g. use 316L per drawing"
                  value={cadCorrectionDraft.material ?? ""}
                />
              </label>
              <label className="field">
                <span>Process correction</span>
                <input
                  aria-label="Process correction note"
                  onChange={(event) => onCadCorrectionDraftChange("process", event.target.value)}
                  placeholder="e.g. review turning setup"
                  value={cadCorrectionDraft.process ?? ""}
                />
              </label>
            </div>
            <label className="field">
              <span>CAD review note</span>
              <input
                onChange={(event) => onCadReviewDraftChange(event.target.value)}
                placeholder="Justify cleared manufacturability flags"
                value={cadReviewDraft}
              />
            </label>
            <div className="cad-review-actions">
              <button disabled={!canSaveCadCorrections} onClick={onSaveCadCorrections} type="button">
                Save corrections
              </button>
              <button disabled={visibleManufacturabilityFlags.length === 0} onClick={onAcknowledgeCadFlags} type="button">
                Acknowledge flags
              </button>
              <button disabled={!override} onClick={onResetCadReview} type="button">
                Reopen flags
              </button>
            </div>
          </div>
        ) : null}
        <div className="attachment-list" aria-label="Attachments">
          {preview.attachments.map((attachment) => (
            <div className="attachment-row" data-primary={attachment.primary} data-review-state={attachment.reviewState} key={attachment.fileName}>
              <FileText aria-hidden="true" />
              <span>
                <strong>{attachment.fileName}</strong>
                <small>
                  {attachment.thumbnailLabel} · {humanizeKey(attachment.previewOutput.status)}
                  {attachment.previewOutput.warnings.length > 0 ? ` · ${attachment.previewOutput.warnings.join(" ")}` : ""}
                  {attachment.reviewReasons.length > 0 ? ` · ${attachment.reviewReasons.join(" ")}` : ""}
                </small>
              </span>
              <div className="attachment-actions">
                <strong>{attachment.primary ? `Primary · ${humanizeKey(attachment.reviewState)}` : humanizeKey(attachment.reviewState)}</strong>
                <button
                  disabled={attachment.primary || attachment.modes[0] === "metadata"}
                  onClick={() => onPrimaryAttachmentChange(attachment.fileName)}
                  type="button"
                >
                  Set primary
                </button>
              </div>
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
  approval,
  exportPackage,
  lifecycle,
  offer,
  offerDraftEdit,
  offerExportEvents,
  onAcceptOffer,
  onCompleteFollowUp,
  onDeclineOffer,
  onDraftEditChange,
  onExecuteRelease,
  onMarkReleaseReviewed,
  onMarkSent,
  onRecordExportEvent,
  onScheduleFollowUp,
  onSyncReplies,
  readiness,
  releaseGate,
  releaseExecution,
  releaseHistory,
  releasePlan,
  releaseReview,
  replySnapshot,
  replySync,
}: {
  approval: QuoteApprovalDecision
  exportPackage: OfferExportPackage
  lifecycle: OfferLifecycleTimeline
  offer: OfferDraft
  offerDraftEdit: OfferDraftEditState
  offerExportEvents: OfferExportHistoryEvent[]
  onAcceptOffer: () => void
  onCompleteFollowUp: () => void
  onDeclineOffer: () => void
  onDraftEditChange: (patch: Partial<OfferDraftEditState>) => void
  onExecuteRelease: () => void
  onMarkReleaseReviewed: () => void
  onMarkSent: () => void
  onRecordExportEvent: (event: Omit<OfferExportHistoryEvent, "id" | "occurredAt">) => void
  onScheduleFollowUp: () => void
  onSyncReplies: () => void
  readiness: OfferSendReadinessResult
  releaseGate: QuoteReleaseGateDecision
  releaseExecution: OfferReleaseExecutionRun
  releaseHistory: OfferReleaseExecutionHistorySummary
  releasePlan: OfferReleasePlan
  releaseReview?: ReleaseReviewState
  replySnapshot?: OfferReplySyncPersistenceSnapshot
  replySync?: GmailOfferReplySyncResult
}) {
  const offerText = exportPackage.plainText
  const [exportFeedback, setExportFeedback] = useState<OfferExportFeedback>({ kind: "idle" })

  const handleCopy = async () => {
    const copied = await copyTextToClipboard(offerText)
    onRecordExportEvent({
      kind: "copy_text",
      message: copied ? `Copied ${offer.offerNumber} plain text.` : "Copy failed; operator must select the text manually.",
      status: copied ? "succeeded" : "failed",
    })
    setExportFeedback(copied ? { kind: "copied" } : { kind: "error", message: "Copy unavailable; select the text manually." })
  }

  const handleDownloadText = () => {
    try {
      triggerBlobDownload(
        offerTextFileName(exportPackage),
        new Blob([offerText], { type: "text/plain;charset=utf-8" }),
      )
      onRecordExportEvent({
        fileName: offerTextFileName(exportPackage),
        kind: "download_text",
        message: `Downloaded ${offerTextFileName(exportPackage)}.`,
        status: "succeeded",
      })
      setExportFeedback({ kind: "downloaded", message: `Saved ${offerTextFileName(exportPackage)}` })
    } catch {
      onRecordExportEvent({
        fileName: offerTextFileName(exportPackage),
        kind: "download_text",
        message: `Download failed for ${offerTextFileName(exportPackage)}.`,
        status: "failed",
      })
      setExportFeedback({ kind: "error", message: "Download failed in this browser." })
    }
  }

  const handleDownloadPdf = async () => {
    setExportFeedback({ kind: "rendering" })
    try {
      const { buildOfferPdfBytes } = await import("./domain/offers/offerPdf")
      const pdf = await buildOfferPdfBytes(exportPackage)
      triggerBlobDownload(pdf.fileName, new Blob([new Uint8Array(pdf.bytes)], { type: "application/pdf" }))
      onRecordExportEvent({
        fileName: pdf.fileName,
        kind: "download_pdf",
        message: `Downloaded ${pdf.fileName} (${pdf.pageCount} page${pdf.pageCount === 1 ? "" : "s"}).`,
        status: "succeeded",
      })
      setExportFeedback({ kind: "downloaded", message: `Saved ${pdf.fileName} (${pdf.pageCount} page${pdf.pageCount === 1 ? "" : "s"})` })
    } catch {
      onRecordExportEvent({
        fileName: exportPackage.pdf.targetFileName,
        kind: "download_pdf",
        message: `PDF rendering failed for ${exportPackage.pdf.targetFileName}.`,
        status: "failed",
      })
      setExportFeedback({ kind: "error", message: "PDF rendering failed." })
    }
  }

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
      <section className="offer-draft-editor" aria-label="Editable offer details">
        <div className="offer-draft-grid">
          <label className="field">
            <span>Valid until</span>
            <input
              aria-label="Offer valid until"
              onChange={(event) => onDraftEditChange({ validUntil: event.target.value })}
              type="date"
              value={offerDraftEdit.validUntil}
            />
          </label>
          <label className="field">
            <span>Revision note</span>
            <input
              aria-label="Offer revision note"
              onChange={(event) => onDraftEditChange({ revisionReason: event.target.value })}
              value={offerDraftEdit.revisionReason}
            />
          </label>
          <label className="field offer-draft-span">
            <span>Terms</span>
            <textarea
              aria-label="Offer terms"
              onChange={(event) => onDraftEditChange({ termsText: event.target.value })}
              value={offerDraftEdit.termsText}
            />
          </label>
          <label className="field offer-draft-span">
            <span>Customer notes</span>
            <textarea
              aria-label="Offer notes"
              onChange={(event) => onDraftEditChange({ notesText: event.target.value })}
              value={offerDraftEdit.notesText}
            />
          </label>
        </div>
      </section>
      <OfferExportPackagePanel exportPackage={exportPackage} />
      <QuoteApprovalPanel approval={approval} />
      <OfferSendReadinessPanel readiness={readiness} />
      <QuoteReleaseGatePanel
        onMarkReviewed={onMarkReleaseReviewed}
        releaseGate={releaseGate}
        releaseReview={releaseReview}
      />
      <OfferLifecyclePanel
        lifecycle={lifecycle}
        onAcceptOffer={onAcceptOffer}
        onCompleteFollowUp={onCompleteFollowUp}
        onDeclineOffer={onDeclineOffer}
        onMarkSent={onMarkSent}
        onScheduleFollowUp={onScheduleFollowUp}
      />
      <OfferReleasePlanPanel releasePlan={releasePlan} />
      <OfferReleaseExecutionPanel
        execution={releaseExecution}
        onExecuteRelease={onExecuteRelease}
        releasePlan={releasePlan}
      />
      <OfferReleaseHistoryPanel history={releaseHistory} />
      <OfferReplyPanel replySnapshot={replySnapshot} replySync={replySync} onSyncReplies={onSyncReplies} />
      <section className="offer-export-actions" aria-label="Offer export actions">
        <div className="offer-export-buttons" role="group">
          <Button onClick={handleCopy} type="button" variant="outline" size="sm">
            <Copy aria-hidden="true" />
            {exportFeedback.kind === "copied" ? "Copied" : "Copy text"}
          </Button>
          <Button onClick={handleDownloadText} type="button" variant="outline" size="sm">
            <Download aria-hidden="true" />
            Download .txt
          </Button>
          <Button
            disabled={exportFeedback.kind === "rendering"}
            onClick={() => {
              void handleDownloadPdf()
            }}
            type="button"
            size="sm"
          >
            <FileDown aria-hidden="true" />
            {exportFeedback.kind === "rendering" ? "Rendering…" : "Download PDF"}
          </Button>
        </div>
        <p
          aria-live="polite"
          className={`offer-export-feedback${exportFeedback.kind === "error" ? " is-error" : ""}`}
          role="status"
        >
          {exportFeedbackMessage(exportFeedback, exportPackage)}
        </p>
      </section>
      <OfferExportHistoryPanel events={offerExportEvents} />
      <label className="offer-text-field">
        <span>Plain text offer</span>
        <textarea aria-label="Plain text offer" readOnly value={offerText} />
      </label>
    </div>
  )
}

type OfferExportFeedback =
  | { kind: "idle" }
  | { kind: "copied" }
  | { kind: "rendering" }
  | { kind: "downloaded"; message: string }
  | { kind: "error"; message: string }

function exportFeedbackMessage(feedback: OfferExportFeedback, exportPackage: OfferExportPackage): string {
  switch (feedback.kind) {
    case "copied":
      return "Offer text copied to the clipboard."
    case "rendering":
      return "Rendering PDF…"
    case "downloaded":
      return feedback.message
    case "error":
      return feedback.message
    default:
      return exportPackage.pdf.status === "ready"
        ? "Copy or download the customer-ready offer. PDF mirrors the verified plain-text content."
        : "Resolve export warnings above before sending; plain-text and PDF still available for review."
  }
}

function OfferExportHistoryPanel({ events }: { events: OfferExportHistoryEvent[] }) {
  return (
    <section className="offer-export-history" aria-label="Offer export history">
      <div className="offer-export-history-heading">
        <span className="eyebrow">
          <FileText aria-hidden="true" />
          Export history
        </span>
        <span className="count-badge">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <div className="offer-export-history-empty">No export events recorded.</div>
      ) : (
        <div className="offer-export-history-list">
          {events.map((event) => (
            <div className="offer-export-history-row" data-status={event.status} key={event.id}>
              <div>
                <strong>{humanizeKey(event.kind)}</strong>
                <span>{event.message}</span>
              </div>
              <small>{formatAuditTimestamp(event.occurredAt)}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function formatAuditTimestamp(value: string): string {
  return value.replace("T", " ").slice(0, 16)
}

function offerTextFileName(exportPackage: OfferExportPackage): string {
  return exportPackage.pdf.targetFileName.replace(/\.pdf$/i, ".txt")
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy execCommand path below.
  }
  if (typeof document === "undefined") {
    return false
  }
  const textarea = document.createElement("textarea")
  try {
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.left = "-9999px"
    document.body.appendChild(textarea)
    textarea.select()
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

function triggerBlobDownload(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Defer revocation so the browser has a tick to begin the download.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function OfferReleaseHistoryPanel({ history }: { history: OfferReleaseExecutionHistorySummary }) {
  const repeatedCount = history.repeatedFingerprints.length
  const latestStatus = history.latestRun ? humanizeKey(history.latestRun.status) : "None"

  return (
    <section className="offer-release-history-panel" aria-label="Offer release execution history">
      <div className="offer-release-history-heading">
        <div>
          <span className="eyebrow">
            <TimerReset aria-hidden="true" />
            Execution history
          </span>
          <strong>{history.totalRuns === 1 ? "1 recorded run" : `${history.totalRuns} recorded runs`}</strong>
        </div>
        <span
          className={
            repeatedCount === 0
              ? "offer-release-history-status offer-release-history-status-ready"
              : "offer-release-history-status offer-release-history-status-review"
          }
        >
          {repeatedCount === 0 ? "Stable" : "Review retries"}
        </span>
      </div>
      <div className="offer-release-history-summary">
        <Metric label="Runs" value={String(history.totalRuns)} />
        <Metric label="Latest" value={latestStatus} />
        <Metric label="Retries" value={String(repeatedCount)} />
        <Metric label="Actions" value={String(history.pendingActionCount)} />
      </div>
      {repeatedCount === 0 ? (
        <div className="flag ok">
          <CheckCircle2 aria-hidden="true" />
          <span>No repeated release fingerprints.</span>
        </div>
      ) : (
        <div className="offer-release-history-retries">
          {history.repeatedFingerprints.map((fingerprint) => (
            <div className="flag" key={fingerprint.executionFingerprint}>
              <AlertTriangle aria-hidden="true" />
              <span>
                {shortAuditFingerprint(fingerprint.executionFingerprint)} repeated {fingerprint.count} times.
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function OfferReleaseExecutionPanel({
  execution,
  onExecuteRelease,
  releasePlan,
}: {
  execution: OfferReleaseExecutionRun
  onExecuteRelease: () => void
  releasePlan: OfferReleasePlan
}) {
  const statusLabel = offerReleaseExecutionStatusLabel(execution.status)
  const artifactCount = execution.lifecycleEvents.length + execution.workspaceActions.length + execution.calendarEvents.length
  const canExecuteRelease = releasePlan.status === "ready" && execution.mode === "dry_run" && execution.status === "prepared"

  return (
    <section className="offer-release-execution-panel" aria-label="Offer release execution audit">
      <div className="offer-release-execution-heading">
        <div>
          <span className="eyebrow">
            <TimerReset aria-hidden="true" />
            Execution audit
          </span>
          <strong>{statusLabel}</strong>
        </div>
        <span className={`offer-release-execution-status offer-release-execution-status-${execution.status}`}>
          {humanizeKey(execution.status)}
        </span>
      </div>
      <div className="offer-release-execution-summary">
        <Metric label="Mode" value={humanizeKey(execution.mode)} />
        <Metric label="Commands" value={String(execution.commands.length)} />
        <Metric label="Artifacts" value={String(artifactCount)} />
        <Metric label="Warnings" value={String(execution.warnings.length)} />
        <Metric label="Fingerprint" value={shortAuditFingerprint(execution.executionFingerprint)} />
      </div>
      <div className="offer-release-execution-controls">
        <Button disabled={!canExecuteRelease} onClick={onExecuteRelease} size="sm" type="button">
          <Truck aria-hidden="true" />
          {execution.status === "succeeded" ? "Release executed" : "Execute release"}
        </Button>
        <span>
          {canExecuteRelease
            ? "Applies local release artifacts and records command outcomes."
            : execution.status === "succeeded"
              ? "Release execution has been recorded."
              : "Resolve release blockers before execution."}
        </span>
      </div>
      <div className="offer-release-execution-command-list">
        {execution.commands.map((command) => (
          <div className="offer-release-execution-command" data-status={command.status} key={command.key}>
            <OfferReleaseExecutionCommandIcon status={command.status} />
            <div>
              <strong>{command.label}</strong>
              <span>{command.detail}</span>
              {command.message ? <small>{command.message}</small> : null}
              {command.warnings.map((warning) => (
                <small key={warning}>{warning}</small>
              ))}
            </div>
          </div>
        ))}
      </div>
      {execution.nextActions.length > 0 ? (
        <div className="offer-release-execution-actions">
          {execution.nextActions.map((action) => (
            <div className={execution.status === "prepared" || execution.status === "succeeded" ? "flag ok" : "flag"} key={action}>
              {execution.status === "prepared" || execution.status === "succeeded" ? (
                <CheckCircle2 aria-hidden="true" />
              ) : (
                <AlertTriangle aria-hidden="true" />
              )}
              <span>{action}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function OfferReleaseExecutionCommandIcon({ status }: { status: OfferReleaseCommandExecutionStatus }) {
  const Icon = status === "applied" || status === "prepared" ? CheckCircle2 : status === "pending" ? Clock3 : AlertTriangle

  return (
    <span className="offer-release-execution-command-icon" aria-hidden="true">
      <Icon />
    </span>
  )
}

function offerReleaseExecutionStatusLabel(status: OfferReleaseExecutionRun["status"]) {
  switch (status) {
    case "blocked":
      return "Blocked before execution"
    case "failed":
      return "Execution failed"
    case "needs_review":
      return "Review required"
    case "partial":
      return "Partially executed"
    case "pending":
      return "Awaiting execution outcomes"
    case "prepared":
      return "Dry-run prepared"
    case "succeeded":
      return "Execution completed"
  }
}

function buildLocalReleaseCommandOutcomes(releasePlan: OfferReleasePlan): OfferReleaseCommandOutcomeInput[] {
  return releasePlan.commands.map((command) => ({
    externalId: `local-release:${releasePlan.offerId}:${command.key}`,
    key: command.key,
    message: `${command.label} applied in the local release adapter.`,
    status: "applied",
    warnings:
      command.kind === "email_draft" || command.kind === "calendar_follow_up"
        ? ["Local adapter recorded the command; no external connector call was made."]
        : [],
  }))
}

function shortAuditFingerprint(fingerprint: string) {
  return fingerprint.replace(/^offer-release-execution-/, "")
}

function OfferLifecyclePanel({
  lifecycle,
  onAcceptOffer,
  onCompleteFollowUp,
  onDeclineOffer,
  onMarkSent,
  onScheduleFollowUp,
}: {
  lifecycle: OfferLifecycleTimeline
  onAcceptOffer: () => void
  onCompleteFollowUp: () => void
  onDeclineOffer: () => void
  onMarkSent: () => void
  onScheduleFollowUp: () => void
}) {
  const openTask = lifecycle.followUpTasks.find((task) => task.status === "open")
  const canMarkSent = lifecycle.status === "draft"
  const canUpdateTerminalStatus = lifecycle.status === "sent"
  const canScheduleFollowUp = lifecycle.status === "sent" && lifecycle.followUpTasks.length === 0
  const canCompleteFollowUp = lifecycle.status === "sent" && Boolean(openTask)

  return (
    <section className="offer-lifecycle-panel" aria-label="Offer lifecycle">
      <div className="offer-lifecycle-heading">
        <div>
          <span className="eyebrow">
            <Clock3 aria-hidden="true" />
            Lifecycle
          </span>
          <strong>{offerLifecycleStatusLabel(lifecycle.status)}</strong>
        </div>
        <span className={`offer-lifecycle-status offer-lifecycle-status-${lifecycle.status}`}>
          {humanizeKey(lifecycle.status)}
        </span>
      </div>
      <div className="offer-lifecycle-summary">
        <Metric label="Events" value={String(lifecycle.events.length)} />
        <Metric label="Open follow-ups" value={String(lifecycle.followUpTasks.filter((task) => task.status === "open").length)} />
        <Metric label="Tasks" value={String(lifecycle.followUpTasks.length)} />
      </div>
      <div className="offer-lifecycle-actions" role="group" aria-label="Offer lifecycle actions">
        <Button disabled={!canMarkSent} onClick={onMarkSent} type="button" variant="outline" size="sm">
          <Mail aria-hidden="true" />
          Mark sent
        </Button>
        <Button disabled={!canScheduleFollowUp} onClick={onScheduleFollowUp} type="button" variant="outline" size="sm">
          <CalendarDays aria-hidden="true" />
          Schedule follow-up
        </Button>
        <Button disabled={!canCompleteFollowUp} onClick={onCompleteFollowUp} type="button" variant="outline" size="sm">
          <CheckCircle2 aria-hidden="true" />
          Complete follow-up
        </Button>
        <Button disabled={!canUpdateTerminalStatus} onClick={onAcceptOffer} type="button" size="sm">
          <CheckCircle2 aria-hidden="true" />
          Mark accepted
        </Button>
        <Button disabled={!canUpdateTerminalStatus} onClick={onDeclineOffer} type="button" variant="outline" size="sm">
          <AlertTriangle aria-hidden="true" />
          Mark declined
        </Button>
      </div>
      <div className="offer-lifecycle-grid">
        <div className="offer-lifecycle-list" aria-label="Offer lifecycle events">
          {lifecycle.events.length > 0 ? (
            lifecycle.events.map((event) => (
              <div className="offer-lifecycle-row" key={event.key}>
                <span>{formatShortDateTime(event.occurredAt)}</span>
                <strong>{offerLifecycleEventLabel(event.kind)}</strong>
                <small>
                  {event.actor} · {humanizeKey(event.statusAfter)}
                  {event.note ? ` · ${event.note}` : ""}
                </small>
              </div>
            ))
          ) : (
            <div className="offer-lifecycle-empty">No lifecycle events recorded.</div>
          )}
        </div>
        <div className="offer-lifecycle-list" aria-label="Offer follow-up tasks">
          {lifecycle.followUpTasks.length > 0 ? (
            lifecycle.followUpTasks.map((task) => (
              <div className="offer-lifecycle-row" data-status={task.status} key={task.id}>
                <span>{formatShortDateTime(task.dueAt)}</span>
                <strong>{task.title}</strong>
                <small>
                  {humanizeKey(task.status)}
                  {task.completedAt ? ` · completed ${formatShortDateTime(task.completedAt)}` : ""}
                  {task.cancelledAt ? ` · cancelled ${formatShortDateTime(task.cancelledAt)}` : ""}
                </small>
              </div>
            ))
          ) : (
            <div className="offer-lifecycle-empty">No follow-up tasks yet.</div>
          )}
        </div>
      </div>
    </section>
  )
}

function offerLifecycleStatusLabel(status: OfferLifecycleTimeline["status"]) {
  switch (status) {
    case "accepted":
      return "Offer accepted"
    case "declined":
      return "Offer declined"
    case "draft":
      return "Draft not sent"
    case "sent":
      return "Sent and awaiting decision"
    case "superseded":
      return "Offer superseded"
  }
}

function offerLifecycleEventLabel(kind: OfferLifecycleEventInput["kind"]) {
  switch (kind) {
    case "accepted":
      return "Accepted"
    case "declined":
      return "Declined"
    case "follow_up_completed":
      return "Follow-up completed"
    case "follow_up_scheduled":
      return "Follow-up scheduled"
    case "note_added":
      return "Note added"
    case "sent":
      return "Sent"
  }
}

function OfferReleasePlanPanel({ releasePlan }: { releasePlan: OfferReleasePlan }) {
  const statusLabel = offerReleasePlanStatusLabel(releasePlan.status)

  return (
    <section className="offer-release-plan-panel" aria-label="Offer release command plan">
      <div className="offer-release-plan-heading">
        <div>
          <span className="eyebrow">
            <Truck aria-hidden="true" />
            Release plan
          </span>
          <strong>{statusLabel}</strong>
        </div>
        <span className={`offer-release-plan-status offer-release-plan-status-${releasePlan.status}`}>
          {humanizeKey(releasePlan.status)}
        </span>
      </div>
      <div className="offer-release-plan-summary">
        <Metric label="Mode" value={humanizeKey(releasePlan.mode)} />
        <Metric label="Commands" value={String(releasePlan.commands.length)} />
        <Metric label="Follow-ups" value={String(releasePlan.calendarPlan?.events.length ?? 0)} />
      </div>
      <div className="offer-release-command-list">
        {releasePlan.commands.map((command) => (
          <div className="offer-release-command" data-status={command.status} key={command.key}>
            <OfferReleaseCommandIcon status={command.status} />
            <div>
              <strong>{command.label}</strong>
              <span>{command.detail}</span>
            </div>
          </div>
        ))}
      </div>
      <OfferReleaseCalendarDrafts events={releasePlan.calendarPlan?.events ?? []} />
      {releasePlan.nextActions.length > 0 ? (
        <div className="offer-release-next-actions">
          {releasePlan.nextActions.map((action) => (
            <div className={releasePlan.status === "ready" ? "flag ok" : "flag"} key={action}>
              {releasePlan.status === "ready" ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
              <span>{action}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function OfferReleaseCalendarDrafts({ events }: { events: CalendarRfqEventDraft[] }) {
  if (events.length === 0) {
    return null
  }

  return (
    <div className="offer-release-calendar-drafts" aria-label="Offer release calendar drafts">
      {events.map((event) => (
        <article className="offer-release-calendar-draft" key={`${event.kind}:${event.startAt}:${event.title}`}>
          <span className="offer-release-calendar-icon" aria-hidden="true">
            <CalendarDays />
          </span>
          <div>
            <strong>{event.title}</strong>
            <span>
              {formatCalendarEventRange(event)} · {event.timezone}
            </span>
            {event.description ? <small>{event.description}</small> : null}
            <div className="offer-release-calendar-metadata" aria-label={`${event.title} metadata`}>
              {Object.entries(event.metadata).map(([key, value]) => (
                <span key={key}>
                  {humanizeKey(key)}: {value}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function OfferReleaseCommandIcon({ status }: { status: OfferReleaseCommandStatus }) {
  const Icon = status === "ready" ? CheckCircle2 : AlertTriangle

  return (
    <span className="offer-release-command-icon" aria-hidden="true">
      <Icon />
    </span>
  )
}

function offerReleasePlanStatusLabel(status: OfferReleasePlan["status"]) {
  switch (status) {
    case "blocked":
      return "Blocked before release"
    case "needs_review":
      return "Manager review required"
    case "ready":
      return "Release commands ready"
  }
}

function QuoteReleaseGatePanel({
  onMarkReviewed,
  releaseGate,
  releaseReview,
}: {
  onMarkReviewed: () => void
  releaseGate: QuoteReleaseGateDecision
  releaseReview?: ReleaseReviewState
}) {
  const statusLabel = quoteReleaseGateStatusLabel(releaseGate.status)
  const canReview = releaseGate.status === "needs_review" && !releaseReview

  return (
    <section className="quote-release-panel" aria-label="Quote release gate">
      <div className="quote-release-heading">
        <div>
          <span className="eyebrow">
            <ShieldCheck aria-hidden="true" />
            Release gate
          </span>
          <strong>{statusLabel}</strong>
        </div>
        <span className={`quote-release-status quote-release-status-${releaseGate.status}`}>{humanizeKey(releaseGate.status)}</span>
      </div>
      <div className="quote-release-summary">
        <Metric label="Blockers" value={String(releaseGate.blockerCount)} />
        <Metric label="Warnings" value={String(releaseGate.warningCount)} />
        <Metric label="Checked" value={formatShortDateTime(releaseGate.checkedAt)} />
      </div>
      <div className="quote-release-review-actions">
        {releaseReview ? (
          <div className="flag ok">
            <CheckCircle2 aria-hidden="true" />
            <span>
              Reviewed by {releaseReview.reviewedBy} at {formatShortDateTime(releaseReview.reviewedAt)}.
            </span>
          </div>
        ) : null}
        <Button disabled={!canReview} onClick={onMarkReviewed} size="sm" type="button" variant="outline">
          <ShieldCheck aria-hidden="true" />
          {releaseReview ? "Review recorded" : "Mark reviewed"}
        </Button>
      </div>
      <div className="quote-release-checks">
        {releaseGate.checks.map((check) => (
          <div className="quote-release-check" data-status={check.status} key={check.key}>
            <QuoteReleaseGateCheckIcon status={check.status} />
            <div>
              <strong>{check.label}</strong>
              <span>
                {check.key === "checked_at" && check.status === "passed"
                  ? `Checked ${formatShortDateTime(releaseGate.checkedAt)}.`
                  : check.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
      {releaseGate.nextActions.length > 0 ? (
        <div className="quote-release-actions">
          {releaseGate.nextActions.map((action) => (
            <div className="flag" key={action}>
              <AlertTriangle aria-hidden="true" />
              <span>{action}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flag ok">
          <CheckCircle2 aria-hidden="true" />
          <span>Ready to release to customer.</span>
        </div>
      )}
    </section>
  )
}

function QuoteReleaseGateCheckIcon({ status }: { status: QuoteReleaseGateCheckStatus }) {
  const Icon = status === "passed" ? CheckCircle2 : AlertTriangle
  return (
    <span className="quote-release-check-icon" aria-hidden="true">
      <Icon />
    </span>
  )
}

function quoteReleaseGateStatusLabel(status: QuoteReleaseGateDecision["status"]) {
  switch (status) {
    case "blocked":
      return "Blocked before send"
    case "needs_review":
      return "Needs release review"
    case "ready":
      return "Ready to release"
  }
}

function QuoteApprovalPanel({ approval }: { approval: QuoteApprovalDecision }) {
  const blockerCount = approval.issues.filter((issue) => issue.severity === "blocker").length
  const warningCount = approval.issues.filter((issue) => issue.severity === "warning").length
  const statusLabel = quoteApprovalStatusLabel(approval.status)

  return (
    <section className="quote-approval-panel" aria-label="Quote approval policy">
      <div className="quote-approval-heading">
        <div>
          <span className="eyebrow">
            <ShieldCheck aria-hidden="true" />
            Approval policy
          </span>
          <strong>{statusLabel}</strong>
        </div>
        <span className={`quote-approval-status quote-approval-status-${approval.status}`}>{humanizeKey(approval.status)}</span>
      </div>
      <div className="quote-approval-summary">
        <Metric label="Margin" value={`${approval.marginPercent.toFixed(1)}%`} />
        <Metric label="Blockers" value={String(blockerCount)} />
        <Metric label="Warnings" value={String(warningCount)} />
      </div>
      <div className="quote-approval-checks">
        {approval.checks.map((check) => (
          <div className="quote-approval-check" data-status={check.status} key={check.key}>
            <QuoteApprovalCheckIcon status={check.status} />
            <div>
              <strong>{check.label}</strong>
              <span>{check.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function QuoteApprovalCheckIcon({ status }: { status: QuoteApprovalCheckStatus }) {
  const Icon = status === "passed" ? CheckCircle2 : AlertTriangle
  return (
    <span className="quote-approval-check-icon" aria-hidden="true">
      <Icon />
    </span>
  )
}

function quoteApprovalStatusLabel(status: QuoteApprovalDecision["status"]) {
  switch (status) {
    case "approved":
      return "Approved"
    case "blocked":
      return "Blocked"
    case "needs_review":
      return "Needs manager review"
  }
}

function OfferSendReadinessPanel({ readiness }: { readiness: OfferSendReadinessResult }) {
  const blockerCount = readiness.issues.filter((issue) => issue.severity === "blocker").length
  const warningCount = readiness.issues.filter((issue) => issue.severity === "warning").length
  const statusLabel = offerReadinessStatusLabel(readiness.status)

  return (
    <section className="offer-readiness-panel" aria-label="Offer send readiness">
      <div className="offer-readiness-heading">
        <div>
          <span className="eyebrow">
            <ShieldCheck aria-hidden="true" />
            Send readiness
          </span>
          <strong>{statusLabel}</strong>
        </div>
        <span className={`offer-readiness-status offer-readiness-status-${readiness.status}`}>{humanizeKey(readiness.status)}</span>
      </div>
      <div className="offer-readiness-summary">
        <Metric label="Blockers" value={String(blockerCount)} />
        <Metric label="Warnings" value={String(warningCount)} />
        <Metric label="Checked" value={readiness.checkedAt} />
      </div>
      <div className="offer-readiness-checks">
        {readiness.checks.map((check) => (
          <div className="offer-readiness-check" data-status={check.status} key={check.key}>
            <ReadinessCheckIcon status={check.status} />
            <div>
              <strong>{check.label}</strong>
              <span>{check.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReadinessCheckIcon({ status }: { status: OfferSendReadinessCheckStatus }) {
  const Icon = status === "passed" ? CheckCircle2 : AlertTriangle
  return (
    <span className="offer-readiness-check-icon" aria-hidden="true">
      <Icon />
    </span>
  )
}

function offerReadinessStatusLabel(status: OfferSendReadinessResult["status"]) {
  switch (status) {
    case "blocked":
      return "Blocked"
    case "needs_review":
      return "Needs review"
    case "ready":
      return "Ready to send"
  }
}

function integrationHealthStatusLabel(status: WorkspaceIntegrationStatus["status"]) {
  switch (status) {
    case "attention":
      return "Review needed"
    case "blocked":
      return "Blocked"
    case "fallback":
      return "Fallback active"
    case "live":
      return "Live sync"
  }
}

function OfferExportPackagePanel({ exportPackage }: { exportPackage: OfferExportPackage }) {
  const pdfReady = exportPackage.pdf.status === "ready"

  return (
    <section className="offer-export-panel" aria-label="Offer export package">
      <div className="offer-export-heading">
        <div>
          <span className="eyebrow">
            <FileText aria-hidden="true" />
            Export package
          </span>
          <strong>{pdfReady ? "PDF ready" : "Review required"}</strong>
        </div>
        <span className={`export-status export-status-${exportPackage.pdf.status}`}>{exportPackage.pdf.status.replace("_", " ")}</span>
      </div>
      <div className="offer-export-summary">
        <Metric label="PDF file" value={exportPackage.pdf.targetFileName} />
        <Metric label="Revision" value={`Rev ${exportPackage.revisionSummary.latestRevision}`} />
        <Metric label="Fingerprint" value={exportPackage.pdf.contentFingerprint} />
      </div>
      <div className="alternate-list" aria-label="Offer alternates">
        {exportPackage.alternates.map((alternate) => (
          <article className="alternate-row" key={alternate.id}>
            <div>
              <strong>{alternate.label}</strong>
              <span>{alternate.recommendation}</span>
            </div>
            <div>
              <span>Total</span>
              <strong>{alternate.totalLabel}</strong>
              <small>{alternate.priceDeltaLabel}</small>
            </div>
            <div>
              <span>Lead</span>
              <strong>{alternate.leadTimeLabel}</strong>
              <small>{alternate.leadTimeDeltaLabel}</small>
            </div>
          </article>
        ))}
      </div>
      {exportPackage.pdf.warnings.length > 0 ? (
        <div className="provider-warning-list">
          {exportPackage.pdf.warnings.map((warning, index) => (
            <div className="flag" key={index}>
              <AlertTriangle aria-hidden="true" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function OfferReplyPanel({
  onSyncReplies,
  replySnapshot,
  replySync,
}: {
  onSyncReplies: () => void
  replySnapshot?: OfferReplySyncPersistenceSnapshot
  replySync?: GmailOfferReplySyncResult
}) {
  const [stateFilter, setStateFilter] = useState<OfferReplyStateFilter>("all")
  const matchedRecords = replySync?.records.filter((record) => record.parsed.matched) ?? []
  const replyStateSummary = useMemo(
    () => (replySnapshot ? buildOfferReplyStateSummary(replySnapshot, { filter: stateFilter }) : undefined),
    [replySnapshot, stateFilter],
  )

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
          {replyStateSummary ? (
            <OfferReplyStatePanel
              filter={stateFilter}
              onFilterChange={setStateFilter}
              summary={replyStateSummary}
            />
          ) : null}
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

const offerReplyFilters: Array<{ label: string; value: OfferReplyStateFilter }> = [
  { label: "All", value: "all" },
  { label: "Applied", value: "applied" },
  { label: "Ignored", value: "ignored" },
  { label: "Transitions", value: "transitions" },
  { label: "Warnings", value: "warnings" },
  { label: "Duplicates", value: "duplicates" },
]

function OfferReplyStatePanel({
  filter,
  onFilterChange,
  summary,
}: {
  filter: OfferReplyStateFilter
  onFilterChange: (filter: OfferReplyStateFilter) => void
  summary: OfferReplyStateSummary
}) {
  return (
    <div className="offer-reply-state-panel" aria-label="Offer reply state">
      <div className="offer-reply-state-summary">
        <Metric label="Recorded" value={String(summary.recordedMessageCount)} />
        <Metric label="Applied" value={String(summary.appliedMessageCount)} />
        <Metric label="Warnings" value={String(summary.warningCount)} />
        <Metric label="Duplicates" value={String(summary.duplicateSyncCount)} />
      </div>
      <div className="offer-reply-filter-row" role="group" aria-label="Offer reply state filters">
        {offerReplyFilters.map((option) => (
          <button
            aria-pressed={filter === option.value}
            className="offer-reply-filter"
            data-active={filter === option.value}
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      {summary.events.length > 0 ? (
        <div className="offer-reply-state-list">
          {summary.events.map((event) => (
            <article className="offer-reply-state-event" data-kind={event.kind} key={event.key}>
              <span>{event.label}</span>
              <strong>{event.message}</strong>
            </article>
          ))}
        </div>
      ) : (
        <div className="offer-reply-state-empty">No reply state events for this filter.</div>
      )}
    </div>
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

function shortCapabilityMatrixVersion(version: ProcessCapabilityMatrix["matrixVersion"]) {
  return version.replace("process-capability-matrix.", "")
}

function shortProcessDemoVersion(version: typeof PROCESS_DEMO_QUOTES_VERSION) {
  return version.replace("process-demo-quotes.", "")
}

function capacityStatusLabel(status: CapacityCommitmentPlan["status"]) {
  switch (status) {
    case "at_risk":
      return "At risk"
    case "on_track":
      return "On track"
    case "overbooked":
      return "Overbooked"
  }
}

function outsideServiceStatusLabel(status: OutsideServicePlan["status"]) {
  switch (status) {
    case "at_risk":
      return "At risk"
    case "blocked":
      return "Blocked"
    case "covered":
      return "Covered"
    case "needs_action":
      return "Needs action"
  }
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

function toCents(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : 0
}

function toPositiveCents(value: string) {
  const cents = toCents(value)
  return cents > 0 ? cents : 1
}

function formatCentsInput(cents: number) {
  return (cents / 100).toFixed(2)
}

function defaultEditState(item: QuoteWorkItem): QuoteEditState {
  return {
    cycleMinutes: item.quoteInput.operation.cycleMinutesPerPart,
    machineHourlyRateCents: item.quoteInput.machine.hourlyRateCents,
    marginPercent: item.quoteInput.rateCard.marginPercent,
    materialCostCentsPerKg: item.quoteInput.material.costCentsPerKg,
    quantity: item.quoteInput.quantity,
    rush: item.quoteInput.priority === "rush",
    setupMinutes: item.quoteInput.operation.setupMinutes,
  }
}

function editStateForItem(item: QuoteWorkItem, edit: Partial<QuoteEditState> | undefined): QuoteEditState {
  return {
    ...defaultEditState(item),
    ...edit,
  }
}

function applyQuoteEdit(item: QuoteWorkItem, edit: QuoteEditState): CncQuoteInput {
  return {
    ...item.quoteInput,
    machine: {
      ...item.quoteInput.machine,
      hourlyRateCents: edit.machineHourlyRateCents,
    },
    material: {
      ...item.quoteInput.material,
      costCentsPerKg: edit.materialCostCentsPerKg,
    },
    quantity: edit.quantity,
    priority: edit.rush ? "rush" : "normal",
    rateCard: {
      ...item.quoteInput.rateCard,
      marginPercent: edit.marginPercent,
    },
    operation: {
      ...item.quoteInput.operation,
      setupMinutes: edit.setupMinutes,
      cycleMinutesPerPart: edit.cycleMinutes,
    },
  }
}

function buildDailyCapacityMinutesByProcess(items: QuoteWorkItem[]) {
  const capacity = { ...defaultDailyCapacityMinutesByProcess }
  for (const item of items) {
    capacity[item.quoteInput.process] = Math.max(
      capacity[item.quoteInput.process],
      item.quoteInput.machine.capacityMinutesPerDay ?? capacity[item.quoteInput.process],
    )
  }
  return capacity
}

function estimateCapacityWorkMinutes(input: CncQuoteInput) {
  const setupMinutes = input.operation.setupMinutes + (input.operation.programmingMinutes ?? 0) + (input.operation.fixtureMinutes ?? 0)
  const runMinutes = input.operation.cycleMinutesPerPart * (input.operation.complexityMultiplier ?? 1) * input.quantity
  const inspectionMinutes = (input.operation.inspectionMinutesPerPart ?? 0) * input.quantity
  return Math.ceil(setupMinutes + runMinutes + inspectionMinutes)
}

function estimateMaterialRequirementKg(input: CncQuoteInput) {
  const materialYieldFactor = input.material.yieldFactor ?? 1
  const kg = calculateStockVolumeMm3(input) * 1e-9 * input.material.densityKgM3 * materialYieldFactor * input.quantity
  return Math.max(0.001, roundKilograms(kg))
}

function calculateStockVolumeMm3(input: CncQuoteInput) {
  const dimensions = input.stockDimensions
  if (input.process === "cnc_turning") {
    const diameterMm = dimensions.diameterMm ?? 0
    const lengthMm = dimensions.lengthMm ?? 0
    return Math.PI * (diameterMm / 2) ** 2 * lengthMm
  }

  return (dimensions.lengthMm ?? 0) * (dimensions.widthMm ?? 0) * (dimensions.heightMm ?? 0)
}

function roundKilograms(value: number) {
  return Math.round(value * 1000) / 1000
}

function findCommitmentForItem(plan: CapacityCommitmentPlan, itemId: string): CapacityItemCommitment | undefined {
  for (const processPlan of plan.processPlans) {
    const commitment = processPlan.commitments.find((candidate) => candidate.itemId === itemId)
    if (commitment) {
      return commitment
    }
  }
}

function prioritizeMaterialCommitments(commitments: MaterialAvailabilityCommitment[], selectedItemId: string) {
  const selectedCommitment = commitments.find((commitment) => commitment.itemId === selectedItemId)
  const nextCommitments = commitments.filter((commitment) => commitment.itemId !== selectedItemId).slice(0, 2)
  return selectedCommitment ? [selectedCommitment, ...nextCommitments] : commitments.slice(0, 3)
}

function materialAvailabilityStatusLabel(status: MaterialAvailabilityPlan["status"]) {
  switch (status) {
    case "at_risk":
      return "At risk"
    case "blocked":
      return "Blocked"
    case "covered":
      return "Covered"
    case "needs_purchase":
      return "Needs purchase"
  }
}

function formatMaterialAction(commitment: MaterialAvailabilityCommitment) {
  if (commitment.purchaseKg > 0) {
    return `Buy ${formatKilograms(commitment.purchaseKg)}${commitment.requestBy ? ` by ${commitment.requestBy}` : ""}`
  }
  if (commitment.issues.some((issue) => issue.code === "certificate_expired" || issue.code === "certificate_missing")) {
    return "Review certificates"
  }
  return "Stock covered"
}

function formatMaterialCoverage(commitment: MaterialAvailabilityCommitment) {
  if (commitment.allocations.length === 0) {
    return "No stock allocation is available for this material."
  }
  return `Covered by ${commitment.allocations.length} lot${commitment.allocations.length === 1 ? "" : "s"}.`
}

function formatMaterialIssueSummary(commitment: MaterialAvailabilityCommitment) {
  if (commitment.issues.length === 0) {
    return formatMaterialCoverage(commitment)
  }
  return commitment.issues.map((issue) => issue.message).join(" ")
}

function outsideServiceStatusFor(item: QuoteWorkItem, serviceLabel: string) {
  if (customerKeyFor(item) === "Baltic Hydraulics" && serviceLabel.toLowerCase().includes("passivation")) {
    return "not_requested" as const
  }
  return "quoted" as const
}

function approvalCustomerPolicyFor(item: QuoteWorkItem): QuoteApprovalCustomerPolicy {
  switch (customerKeyFor(item)) {
    case "Arctic Instruments":
      return {
        creditLimitCents: 220_000,
        customerName: customerLabelFor(item),
        openBalanceCents: 35_000,
        paymentTerm: "standard",
      }
    case "Baltic Hydraulics":
      return {
        creditLimitCents: 60_000,
        customerName: customerLabelFor(item),
        openBalanceCents: 20_000,
        paymentTerm: "prepay_required",
      }
    default:
      return {
        creditLimitCents: 500_000,
        customerName: customerLabelFor(item),
        openBalanceCents: 100_000,
        paymentTerm: "standard",
      }
  }
}

function formatCapacitySchedule(commitment: CapacityItemCommitment | undefined) {
  if (!commitment || commitment.allocations.length === 0) {
    return "Unplanned"
  }
  if (commitment.startDate === commitment.completionDate) {
    return commitment.startDate ?? "Unplanned"
  }
  return `${commitment.startDate} -> ${commitment.completionDate}`
}

function formatCapacityPressure(processPlan: CapacityProcessCommitment) {
  if (processPlan.overloadMinutes > 0) {
    return `${formatMinutes(processPlan.overloadMinutes)} over`
  }
  return `${formatMinutes(processPlan.remainingCapacityMinutes)} left`
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
    { id: "baseline", label: "RFQ baseline", quote: calculateWorkspaceCncQuote(normalizedBaseInput) },
    { id: "standard", label: "Standard lead time", quote: calculateWorkspaceCncQuote(standardInput) },
    { id: "rush", label: "Rush expedite", quote: calculateWorkspaceCncQuote(rushInput) },
  ]
}

function buildOfferAlternateInputs(input: CncQuoteInput): OfferAlternateQuoteInput[] {
  const alternatePriority = input.priority === "rush" ? "normal" : "rush"
  const label = alternatePriority === "rush" ? "Rush expedite option" : "Standard lead time option"
  const note =
    alternatePriority === "rush"
      ? "Expedite lead time uses the configured rush multiplier."
      : "Standard lead time removes rush scheduling pressure."

  return [
    {
      id: alternatePriority,
      label,
      note,
      quote: calculateWorkspaceCncQuote({
        ...input,
        priority: alternatePriority,
      }),
    },
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

function parsedRfqForWorkItem(item: QuoteWorkItem): ParsedRfqIntake {
  const source: RfqIntakeSource = {
    externalId: item.id,
    label: item.source.toUpperCase(),
    provider: item.source,
  }
  const part = partDraftForQuoteInput(item.quoteInput, item.attachments)
  const dimensions = part.dimensions
  const dueAt = parseWorkspaceTimestamp(item.dueAt, "dueAt")
  const receivedAt = parseWorkspaceTimestamp(item.receivedAt, "receivedAt")
  const extractedFields: RfqExtractedField[] = [
    rfqField("contact_email", contactEmailFor(item), 0.98, source),
    rfqField("contact_name", item.contact, 0.92, source),
    rfqField("customer_name", item.customer, 0.96, source),
    rfqField("due_at", new Date(dueAt).toISOString(), 0.9, source),
    rfqField("currency", item.quoteInput.rateCard.currency, 0.96, source),
    rfqField("priority", item.priority, 0.95, source),
    rfqField("part_number", item.quoteInput.partNumber, 0.98, source),
    rfqField("process", item.quoteInput.process, 0.96, source),
    rfqField("subject", item.subject, 0.89, source),
    rfqField("material", item.quoteInput.material.name, 0.93, source),
    rfqField("quantity", String(item.quoteInput.quantity), 0.95, source),
  ]

  if (dimensions?.lengthMm || dimensions?.widthMm || dimensions?.heightMm) {
    extractedFields.push(rfqField("dimensions_mm", formatRfqDimensions(dimensions), 0.86, source))
  }

  if (item.quoteInput.toleranceClass) {
    extractedFields.push(rfqField("tolerance", item.quoteInput.toleranceClass, 0.86, source))
  }

  if (item.quoteInput.finish) {
    extractedFields.push(rfqField("finish", item.quoteInput.finish, 0.84, source))
  }

  return {
    attachments: item.attachments,
    contactEmail: contactEmailFor(item),
    currency: item.quoteInput.rateCard.currency,
    customerName: item.customer,
    dueAt,
    extractedFields,
    parts: [part],
    priority: item.priority,
    receivedAt,
    subject: item.subject,
    summary: item.notes.join(" "),
  }
}

function rfqField(key: string, value: string, confidence: number, source: RfqIntakeSource): RfqExtractedField {
  return {
    confidence,
    key,
    reviewed: false,
    source,
    value,
  }
}

function formatRfqDimensions(dimensions: NonNullable<RfqPartDraft["dimensions"]>) {
  return `${[dimensions.lengthMm, dimensions.widthMm, dimensions.heightMm].filter((value) => value !== undefined).join(" x ")} mm`
}

function parseWorkspaceTimestamp(value: string, fieldName: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) {
    throw new Error(`${fieldName} must be a valid date string`)
  }

  return timestamp
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

function offerLifecycleFollowUpTaskId(rfqId: string) {
  return `offer-lifecycle-follow-up-${rfqId}`
}

function contactEmailFor(item: QuoteWorkItem) {
  const local = item.contact.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "")
  return `${local || "buyer"}@example.test`
}

function latestOfferFollowUpScheduledAt(actions: WorkspaceActionRecord[], offer: OfferDraft) {
  const offerId = offer.offerNumber.toLowerCase()
  const latest = actions
    .filter((action) => action.kind === "follow_up_created" && action.offerId === offerId)
    .reduce<WorkspaceActionRecord | undefined>(
      (currentLatest, action) => (!currentLatest || action.occurredAt > currentLatest.occurredAt ? action : currentLatest),
      undefined,
    )

  return latest?.followUpDueAt
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

interface BrowserConvexWorkspaceBridge {
  mutationRefs: WorkspacePersistenceBridge["mutationRefs"]
  offerReplyMutationRef?: unknown
  offerIdsByLocalId?: Record<string, string>
  quoteIdsByLocalId?: Record<string, string>
  rfqIdsByLocalId?: Record<string, string>
  runMutation: WorkspacePersistenceBridge["runMutation"]
}

interface BrowserConvexOfferReplyBridge {
  mutationRef: unknown
  resolveOfferId: (offerId: string) => string | undefined
  resolveQuoteId: (quoteId: string) => string | undefined
  resolveRfqId: (rfqId: string) => string | undefined
  runMutation: WorkspacePersistenceBridge["runMutation"]
}

declare global {
  interface Window {
    __FACTORYBID_WORKSPACE_CONVEX__?: BrowserConvexWorkspaceBridge
  }
}

function createBrowserConvexWorkspaceBridge(): WorkspacePersistenceBridge | undefined {
  const bridge = typeof window === "undefined" ? undefined : window.__FACTORYBID_WORKSPACE_CONVEX__
  if (!bridge) {
    return undefined
  }

  return {
    mutationRefs: bridge.mutationRefs,
    resolveOfferId: (offerId) => bridge.offerIdsByLocalId?.[offerId],
    resolveQuoteId: (quoteId) => bridge.quoteIdsByLocalId?.[quoteId],
    resolveRfqId: (rfqId) => bridge.rfqIdsByLocalId?.[rfqId],
    runMutation: bridge.runMutation,
  }
}

function createBrowserConvexOfferReplyBridge(): BrowserConvexOfferReplyBridge | undefined {
  const bridge = typeof window === "undefined" ? undefined : window.__FACTORYBID_WORKSPACE_CONVEX__
  if (!bridge?.offerReplyMutationRef) {
    return undefined
  }

  return {
    mutationRef: bridge.offerReplyMutationRef,
    resolveOfferId: (offerId) => bridge.offerIdsByLocalId?.[offerId],
    resolveQuoteId: (quoteId) => bridge.quoteIdsByLocalId?.[quoteId],
    resolveRfqId: (rfqId) => bridge.rfqIdsByLocalId?.[rfqId],
    runMutation: bridge.runMutation,
  }
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

function buildConnectorRfqMessages(item: QuoteWorkItem): GmailRfqMessage[] {
  return [
    {
      attachments: item.attachments.map((attachment, index) => ({
        fileName: attachment.fileName,
        id: `${item.id}-attachment-${index + 1}`,
        mimeType: attachment.contentType,
        sizeBytes: attachment.sizeBytes,
      })),
      fromHeader: `${item.contact} <${contactEmailFor(item)}>`,
      id: `${item.id}-gmail-message`,
      labelIds: ["INBOX", "RFQ"],
      plainText: [
        `Please quote part ${item.quoteInput.partNumber}.`,
        `Process ${formatProcess(item.quoteInput.process)}.`,
        `Material ${item.quoteInput.material.name}.`,
        `Quantity ${item.quoteInput.quantity} pieces.`,
        `Deadline ${item.dueAt.slice(0, 10)}.`,
      ].join(" "),
      receivedAt: item.receivedAt,
      senderEmail: contactEmailFor(item),
      senderName: item.contact,
      snippet: `RFQ ${item.quoteInput.partNumber} from ${item.customer}`,
      subject: `RFQ: ${item.subject}`,
      threadId: `${item.id}-thread`,
    },
    {
      attachments: [
        {
          fileName: "TR-301.step",
          id: "tr-301-attachment-1",
          mimeType: "model/step",
          sizeBytes: 184320,
        },
      ],
      fromHeader: '"Tampere Robotics" <rfq@tampererobotics.example>',
      id: "tr-301-gmail-message",
      labelIds: ["INBOX", "RFQ"],
      plainText:
        "Please quote part: TR-301. CNC milling, aluminum 7075, qty 12 pcs. Dimensions 90 x 60 x 12 mm. Deadline 2026-07-04. Budget in EUR.",
      receivedAt: "2026-06-20T10:05:00+03:00",
      senderEmail: "rfq@tampererobotics.example",
      senderName: "Tampere Robotics",
      snippet: "RFQ TR-301 from Tampere Robotics",
      subject: "RFQ: CNC fixture PN TR-301",
      threadId: "tr-301-thread",
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

function formatMinutes(minutes: number) {
  if (minutes === 0) {
    return "0m"
  }
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = minutes / 60
  return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)}h`
}

function formatKilograms(value: number) {
  const rounded = roundKilograms(value)
  const label = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
  return `${label} kg`
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

function formatCalendarEventRange(event: CalendarRfqEventDraft) {
  const formatter = new Intl.DateTimeFormat("en-FI", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: event.timezone,
  })
  return `${formatter.format(new Date(event.startAt))} - ${formatter.format(new Date(event.endAt))}`
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
