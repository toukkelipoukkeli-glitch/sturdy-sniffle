import { useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  Mail,
  PackageCheck,
  PanelRight,
} from "lucide-react"

import { Button } from "./components/ui/button"
import { buildCncOfferDraft, renderOfferText, type OfferDraft } from "./domain/offers/offer"
import { calculateCncQuote, type CncQuoteInput, type CncQuoteResult } from "./domain/quoting/cnc"
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
  due: string
  priority: "normal" | "rush"
  status: "new" | "triage" | "estimating" | "ready"
  source: "gmail" | "manual" | "import"
  tags: string[]
  quoteInput: CncQuoteInput
  notes: string[]
}

const workItems: QuoteWorkItem[] = [
  {
    id: "rfq-204",
    customer: "North Forge",
    contact: "Sari Virtanen",
    subject: "CNC bracket FB-204-A",
    received: "Today 08:30",
    due: "Jun 30",
    priority: "normal",
    status: "estimating",
    source: "gmail",
    tags: ["CNC milling", "Al 6082", "ISO 2768-M"],
    notes: ["STEP and drawing attached", "Customer asked for 25 pcs", "Deburr included"],
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
    due: "Jun 24",
    priority: "rush",
    status: "triage",
    source: "gmail",
    tags: ["CNC turning", "316L", "+/- 0.05 mm"],
    notes: ["Rush lead time requested", "Passivation needed", "Small quantity triggers minimum"],
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
    due: "Jul 02",
    priority: "normal",
    status: "new",
    source: "import",
    tags: ["CNC milling", "Al 7075", "Prototype"],
    notes: ["Imported from shared folder", "Material substitution allowed", "Revision B drawing"],
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
  const [editsById, setEditsById] = useState<Record<string, QuoteEditState>>({})
  const selectedItem = workItems.find((item) => item.id === selectedId) ?? workItems[0]
  const selectedEdit = editsById[selectedId] ?? defaultEditState(selectedItem)
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

  const quoteInput = useMemo<CncQuoteInput>(
    () => ({
      ...selectedItem.quoteInput,
      quantity,
      priority: rush ? "rush" : "normal",
      operation: {
        ...selectedItem.quoteInput.operation,
        setupMinutes,
        cycleMinutesPerPart: cycleMinutes,
      },
    }),
    [cycleMinutes, quantity, rush, selectedItem, setupMinutes],
  )
  const quote = useMemo(() => calculateCncQuote(quoteInput), [quoteInput])
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
          <Button type="button" variant="outline" size="sm">
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
            {workItems.map((item) => (
              <button
                className="queue-item"
                data-active={item.id === selectedId}
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                type="button"
              >
                <span className="queue-item-main">
                  <span className="customer">{item.customer}</span>
                  <span className="subject">{item.subject}</span>
                </span>
                <span className="queue-item-meta">
                  <StatusBadge status={item.status} />
                  <span>{item.due}</span>
                </span>
              </button>
            ))}
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

          {activeView === "triage" ? <TriageView item={selectedItem} /> : null}
          {activeView === "costing" ? (
            <CostingView
              cycleMinutes={cycleMinutes}
              quantity={quantity}
              quote={quote}
              rush={rush}
              selectedItem={selectedItem}
              setCycleMinutes={(value) => updateSelectedEdit({ cycleMinutes: value })}
              setQuantity={(value) => updateSelectedEdit({ quantity: value })}
              setRush={(value) => updateSelectedEdit({ rush: value })}
              setSetupMinutes={(value) => updateSelectedEdit({ setupMinutes: value })}
              setupMinutes={setupMinutes}
            />
          ) : null}
          {activeView === "offer" ? <OfferView offer={offer} /> : null}
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
        </aside>
      </section>
    </main>
  )
}

function TriageView({ item }: { item: QuoteWorkItem }) {
  return (
    <div className="workspace-section">
      <div className="section-title">
        <h3>RFQ intake</h3>
        <StatusBadge status={item.status} />
      </div>
      <div className="intake-grid">
        <Metric label="Due" value={item.due} />
        <Metric label="Source" value={item.source.toUpperCase()} />
        <Metric label="Contact" value={item.contact} />
      </div>
      <div className="note-list">
        {item.notes.map((note) => (
          <div className="note-row" key={note}>
            <CheckCircle2 aria-hidden="true" />
            <span>{note}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CostingView({
  cycleMinutes,
  quantity,
  quote,
  rush,
  selectedItem,
  setCycleMinutes,
  setQuantity,
  setRush,
  setSetupMinutes,
  setupMinutes,
}: {
  cycleMinutes: number
  quantity: number
  quote: CncQuoteResult
  rush: boolean
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

function OfferView({ offer }: { offer: OfferDraft }) {
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
      <label className="offer-text-field">
        <span>Plain text offer</span>
        <textarea aria-label="Plain text offer" readOnly value={offerText} />
      </label>
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

function StatusBadge({ status }: { status: QuoteWorkItem["status"] }) {
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

function offerNumberFor(item: QuoteWorkItem) {
  return `OFFER-${item.id.slice(-3).toUpperCase()}`
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

function formatProcess(process: CncQuoteInput["process"]) {
  return process === "cnc_milling" ? "CNC milling" : "CNC turning"
}

function humanizeKey(key: string) {
  return key.replaceAll("_", " ")
}

export default App
