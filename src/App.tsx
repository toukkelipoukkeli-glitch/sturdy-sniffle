import { useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CloudOff,
  Cuboid,
  Database,
  Factory,
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
  TimerReset,
  TrendingUp,
  Truck,
} from "lucide-react"

import { Button } from "./components/ui/button"
import type { CadMetadataResult } from "./domain/integrations/cadMetadata"
import {
  createGmailOfferReplyAdapter,
  type GmailOfferReplySyncResult,
} from "./domain/integrations/gmailOfferReply"
import { createMockGmailRfqProvider, type GmailRfqMessage } from "./domain/integrations/gmailRfq"
import { buildCncOfferDraft, type OfferDraft } from "./domain/offers/offer"
import {
  buildOfferExportPackage,
  type OfferAlternateQuoteInput,
  type OfferExportPackage,
} from "./domain/offers/offerExportPackage"
import {
  evaluateOfferSendReadiness,
  type OfferSendReadinessCheckStatus,
  type OfferSendReadinessResult,
} from "./domain/offers/offerSendReadiness"
import { hashProviderInput, type ProviderRunRequest, type ProviderRunResult } from "./domain/providers/ai"
import { buildProviderRunAudit, type ProviderRunAudit } from "./domain/providers/providerRunAudit"
import { calculateCncQuote, type CncQuoteInput, type CncQuoteResult } from "./domain/quoting/cnc"
import { buildProcessCapabilityMatrix, type ProcessCapabilityMatrix } from "./domain/quoting/processCapability"
import type { QuoteProcessKey } from "./domain/quoting/registry"
import type { ParsedRfqIntake, RfqAttachmentDraft, RfqExtractedField, RfqIntakeSource, RfqPartDraft } from "./domain/rfq/intake"
import {
  evaluateRfqIntakeReadiness,
  type RfqIntakeReadinessCheckStatus,
  type RfqIntakeReadinessResult,
} from "./domain/rfq/intakeReadiness"
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
import { buildWorkspaceAction, type WorkspaceActionRecord } from "./domain/workspace/workspaceActions"
import type { WorkspacePersistenceSnapshot } from "./domain/workspace/workspacePersistence"
import {
  createWorkspacePersistenceRuntime,
  type WorkspacePersistenceBridge,
  type WorkspacePersistenceMode,
} from "./domain/workspace/workspacePersistenceRuntime"
import "./App.css"

type WorkspaceView = "triage" | "costing" | "offer"

const demoToday = "2026-06-20"
const demoNow = "2026-06-20T09:00:00+03:00"
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
  const [persistenceSyncErrorCount, setPersistenceSyncErrorCount] = useState(0)
  const [statusById, setStatusById] = useState<Record<string, QuoteQueueStatus>>({})
  const [workspacePersistenceRuntime] = useState(() =>
    createWorkspacePersistenceRuntime({
      convex: createBrowserConvexWorkspaceBridge(),
      onSyncError: () => setPersistenceSyncErrorCount((count) => count + 1),
    }),
  )
  const workspacePersistence = workspacePersistenceRuntime.adapter
  const queueNow = demoNow
  const selectedItem = workItems.find((item) => item.id === selectedId) ?? workItems[0]
  const selectedActions = useMemo(() => actionsById[selectedId] ?? [], [actionsById, selectedId])
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
  const capacityCommitmentPlan = useMemo(
    () =>
      buildCapacityCommitmentPlan({
        dailyCapacityMinutesByProcess: buildDailyCapacityMinutesByProcess(workItems),
        items: workItems.map((item) => {
          const itemQuoteInput = applyQuoteEdit(item, editsById[item.id] ?? defaultEditState(item))
          const itemQuote = calculateCncQuote(itemQuoteInput)
          return {
            customerName: item.customer,
            dueAt: item.dueAt,
            estimatedValueCents: itemQuote.totalCents,
            estimatedWorkMinutes: estimateCapacityWorkMinutes(itemQuoteInput),
            id: item.id,
            priority: itemQuoteInput.priority,
            process: itemQuoteInput.process,
            receivedAt: item.receivedAt,
            status: statusById[item.id] ?? item.status,
            subject: item.subject,
          }
        }),
        now: queueNow,
        planningDays: capacityPlanningDays,
      }),
    [editsById, queueNow, statusById],
  )
  const selectedCapacityCommitment = useMemo(
    () => findCommitmentForItem(capacityCommitmentPlan, selectedId),
    [capacityCommitmentPlan, selectedId],
  )
  const outsideServicePlan = useMemo(
    () =>
      buildOutsideServicePlan({
        items: workItems.map((item) => {
          const itemQuoteInput = applyQuoteEdit(item, editsById[item.id] ?? defaultEditState(item))
          const itemQuote = calculateCncQuote(itemQuoteInput)
          return {
            customerName: item.customer,
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
            subject: item.subject,
          }
        }),
        now: queueNow,
        supplierRules: outsideServiceSupplierRules,
      }),
    [editsById, queueNow, statusById],
  )
  const materialAvailabilityPlan = useMemo(
    () =>
      buildMaterialAvailabilityPlan({
        inventoryLots: materialInventoryLots,
        items: workItems.map((item) => {
          const itemQuoteInput = applyQuoteEdit(item, editsById[item.id] ?? defaultEditState(item))
          return {
            customerName: item.customer,
            dueAt: item.dueAt,
            id: item.id,
            materialName: itemQuoteInput.material.name,
            priority: itemQuoteInput.priority,
            process: itemQuoteInput.process,
            receivedAt: item.receivedAt,
            requiredKg: estimateMaterialRequirementKg(itemQuoteInput),
            status: statusById[item.id] ?? item.status,
            subject: item.subject,
          }
        }),
        now: queueNow,
        purchaseBufferDays: 1,
        supplierOptions: materialSupplierOptions,
      }),
    [editsById, queueNow, statusById],
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
  const rfqIntakeReadiness = useMemo(
    () => evaluateRfqIntakeReadiness(parsedRfqForWorkItem(selectedItem), { nowDate: demoToday }),
    [selectedItem],
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
        subject: selectedItem.subject,
      }),
    [quoteInput, selectedItem],
  )
  const offer = useMemo(
    () =>
      buildCncOfferDraft({
        offerNumber: offerNumberFor(selectedItem),
        customer: {
          email: contactEmailFor(selectedItem),
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
  const offerExportPackage = useMemo(
    () =>
      buildOfferExportPackage({
        offer,
        alternates: buildOfferAlternateInputs(quoteInput),
      }),
    [offer, quoteInput],
  )
  const offerFollowUpScheduledAt = useMemo(() => latestOfferFollowUpScheduledAt(selectedActions, offer), [offer, selectedActions])
  const offerSendReadiness = useMemo(
    () =>
      evaluateOfferSendReadiness({
        exportPackage: offerExportPackage,
        followUpScheduledAt: offerFollowUpScheduledAt,
        nowDate: demoToday,
        offer,
      }),
    [offer, offerExportPackage, offerFollowUpScheduledAt],
  )
  const quoteApproval = useMemo(
    () =>
      evaluateQuoteApproval({
        capacityCommitment: selectedCapacityCommitment,
        customer: approvalCustomerPolicyFor(selectedItem),
        quote,
        reviewedAt: demoToday,
      }),
    [quote, selectedCapacityCommitment, selectedItem],
  )
  const quoteReleaseGate = useMemo(
    () =>
      evaluateQuoteReleaseGate({
        approval: quoteApproval,
        capacityCommitment: selectedCapacityCommitment,
        checkedAt: demoNow,
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
    ],
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
          <PersistenceStatus
            label={workspacePersistenceRuntime.label}
            mode={workspacePersistenceRuntime.mode}
            syncErrorCount={persistenceSyncErrorCount}
          />
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
          <ProcessCapabilityPanel activeProcess={selectedItem.quoteInput.process} matrix={processCapabilityMatrix} />
          <CapacityCommitmentPanel plan={capacityCommitmentPlan} selectedItem={selectedItem} />
          <MaterialAvailabilityPanel plan={materialAvailabilityPlan} selectedItem={selectedItem} />
          <OutsideServicePanel plan={outsideServicePlan} selectedItem={selectedItem} />

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
              readiness={rfqIntakeReadiness}
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
          {activeView === "offer" ? (
            <OfferView
              approval={quoteApproval}
              exportPackage={offerExportPackage}
              offer={offer}
              readiness={offerSendReadiness}
              releaseGate={quoteReleaseGate}
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
          <ProviderRunReviewPanel audits={selectedItem.providerRuns} />
        </aside>
      </section>
    </main>
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
  readiness,
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
  readiness: RfqIntakeReadinessResult
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
        {preview.manufacturabilityFlags.length > 0 ? (
          <div className="manufacturability-list" aria-label="Manufacturability flags">
            {preview.manufacturabilityFlags.map((flag) => (
              <span className="manufacturability-chip" key={flag}>
                <AlertTriangle aria-hidden="true" />
                {humanizeKey(flag)}
              </span>
            ))}
          </div>
        ) : null}
        <div className="attachment-list" aria-label="Attachments">
          {preview.attachments.map((attachment) => (
            <div className="attachment-row" data-primary={attachment.primary} data-review-state={attachment.reviewState} key={attachment.fileName}>
              <FileText aria-hidden="true" />
              <span>
                <strong>{attachment.fileName}</strong>
                {attachment.reviewReasons.length > 0 ? <small>{attachment.reviewReasons.join(" ")}</small> : null}
              </span>
              <strong>{humanizeKey(attachment.reviewState)}</strong>
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
  offer,
  onSyncReplies,
  readiness,
  releaseGate,
  replySync,
}: {
  approval: QuoteApprovalDecision
  exportPackage: OfferExportPackage
  offer: OfferDraft
  onSyncReplies: () => void
  readiness: OfferSendReadinessResult
  releaseGate: QuoteReleaseGateDecision
  replySync?: GmailOfferReplySyncResult
}) {
  const offerText = exportPackage.plainText

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
      <OfferExportPackagePanel exportPackage={exportPackage} />
      <QuoteApprovalPanel approval={approval} />
      <OfferSendReadinessPanel readiness={readiness} />
      <QuoteReleaseGatePanel releaseGate={releaseGate} />
      <OfferReplyPanel replySync={replySync} onSyncReplies={onSyncReplies} />
      <label className="offer-text-field">
        <span>Plain text offer</span>
        <textarea aria-label="Plain text offer" readOnly value={offerText} />
      </label>
    </div>
  )
}

function QuoteReleaseGatePanel({ releaseGate }: { releaseGate: QuoteReleaseGateDecision }) {
  const statusLabel = quoteReleaseGateStatusLabel(releaseGate.status)

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

function shortCapabilityMatrixVersion(version: ProcessCapabilityMatrix["matrixVersion"]) {
  return version.replace("process-capability-matrix.", "")
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
  if (item.customer === "Baltic Hydraulics" && serviceLabel.toLowerCase().includes("passivation")) {
    return "not_requested" as const
  }
  return "quoted" as const
}

function approvalCustomerPolicyFor(item: QuoteWorkItem): QuoteApprovalCustomerPolicy {
  switch (item.customer) {
    case "Arctic Instruments":
      return {
        creditLimitCents: 220_000,
        customerName: item.customer,
        openBalanceCents: 35_000,
        paymentTerm: "standard",
      }
    case "Baltic Hydraulics":
      return {
        creditLimitCents: 60_000,
        customerName: item.customer,
        openBalanceCents: 20_000,
        paymentTerm: "prepay_required",
      }
    default:
      return {
        creditLimitCents: 500_000,
        customerName: item.customer,
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
    { id: "baseline", label: "RFQ baseline", quote: calculateCncQuote(normalizedBaseInput) },
    { id: "standard", label: "Standard lead time", quote: calculateCncQuote(standardInput) },
    { id: "rush", label: "Rush expedite", quote: calculateCncQuote(rushInput) },
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
      quote: calculateCncQuote({
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
    rfqField("customer_name", item.customer, 0.96, source),
    rfqField("due_at", new Date(dueAt).toISOString(), 0.9, source),
    rfqField("currency", item.quoteInput.rateCard.currency, 0.96, source),
    rfqField("priority", item.priority, 0.95, source),
    rfqField("part_number", item.quoteInput.partNumber, 0.98, source),
    rfqField("process", item.quoteInput.process, 0.96, source),
    rfqField("material", item.quoteInput.material.name, 0.93, source),
    rfqField("quantity", String(item.quoteInput.quantity), 0.95, source),
  ]

  if (dimensions?.lengthMm || dimensions?.widthMm || dimensions?.heightMm) {
    extractedFields.push(rfqField("dimensions_mm", formatRfqDimensions(dimensions), 0.86, source))
  }

  if (item.quoteInput.toleranceClass) {
    extractedFields.push(rfqField("tolerance", item.quoteInput.toleranceClass, 0.86, source))
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
  offerIdsByLocalId?: Record<string, string>
  quoteIdsByLocalId?: Record<string, string>
  rfqIdsByLocalId?: Record<string, string>
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
