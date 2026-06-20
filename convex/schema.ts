import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const timestamp = v.number();
const tenantId = v.optional(v.string());

const processKey = v.union(
  v.literal("cnc_milling"),
  v.literal("cnc_turning"),
  v.literal("sheet_metal"),
  v.literal("plastic"),
  v.literal("wire_edm"),
  v.literal("fabrication"),
);

const currencyCode = v.union(v.literal("EUR"), v.literal("USD"), v.literal("GBP"));

const sourceRef = v.object({
  provider: v.union(
    v.literal("manual"),
    v.literal("gmail"),
    v.literal("calendar"),
    v.literal("import"),
    v.literal("mock"),
  ),
  externalId: v.optional(v.string()),
  label: v.optional(v.string()),
});

const extractedField = v.object({
  key: v.string(),
  value: v.string(),
  confidence: v.optional(v.number()),
  source: sourceRef,
  reviewed: v.boolean(),
});

const keyValue = v.object({
  key: v.string(),
  value: v.string(),
});

const offerReleaseExecutionMode = v.union(v.literal("commit"), v.literal("dry_run"));

const offerReleaseExecutionStatus = v.union(
  v.literal("blocked"),
  v.literal("failed"),
  v.literal("needs_review"),
  v.literal("partial"),
  v.literal("pending"),
  v.literal("prepared"),
  v.literal("succeeded"),
);

const offerReleaseCommandKind = v.union(
  v.literal("calendar_follow_up"),
  v.literal("email_draft"),
  v.literal("lifecycle_follow_up"),
  v.literal("lifecycle_sent"),
  v.literal("manager_review"),
  v.literal("workspace_follow_up"),
  v.literal("workspace_status"),
);

const offerReleaseCommandExecutionStatus = v.union(
  v.literal("applied"),
  v.literal("blocked"),
  v.literal("failed"),
  v.literal("pending"),
  v.literal("prepared"),
  v.literal("requires_review"),
);

const offerReleaseExecutionCommand = v.object({
  key: v.string(),
  kind: offerReleaseCommandKind,
  label: v.string(),
  detail: v.string(),
  status: offerReleaseCommandExecutionStatus,
  idempotencyKey: v.string(),
  externalId: v.optional(v.string()),
  message: v.optional(v.string()),
  warnings: v.array(v.string()),
});

const moneyBreakdown = v.object({
  label: v.string(),
  amountCents: v.int64(),
  formula: v.optional(v.string()),
  source: v.union(v.literal("calculator"), v.literal("operator"), v.literal("import")),
});

const dimensions = v.object({
  lengthMm: v.optional(v.number()),
  widthMm: v.optional(v.number()),
  heightMm: v.optional(v.number()),
  diameterMm: v.optional(v.number()),
  thicknessMm: v.optional(v.number()),
  weightKg: v.optional(v.number()),
});

export default defineSchema({
  customers: defineTable({
    tenantId,
    name: v.string(),
    normalizedName: v.string(),
    businessId: v.optional(v.string()),
    notes: v.optional(v.string()),
    defaultCurrency: currencyCode,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_normalized_name", ["normalizedName"])
    .index("by_tenant_normalized_name", ["tenantId", "normalizedName"]),

  contacts: defineTable({
    tenantId,
    customerId: v.id("customers"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_customer", ["customerId"])
    .index("by_email", ["email"]),

  rfqs: defineTable({
    tenantId,
    customerId: v.optional(v.id("customers")),
    primaryContactId: v.optional(v.id("contacts")),
    status: v.union(
      v.literal("new"),
      v.literal("triage"),
      v.literal("estimating"),
      v.literal("quoted"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("archived"),
    ),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("rush")),
    source: sourceRef,
    subject: v.string(),
    summary: v.optional(v.string()),
    receivedAt: timestamp,
    dueAt: v.optional(timestamp),
    currency: currencyCode,
    extractedFields: v.array(extractedField),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_due_at", ["dueAt"])
    .index("by_customer", ["customerId"])
    .index("by_status_due_at", ["status", "dueAt"])
    .index("by_tenant_status_due_at", ["tenantId", "status", "dueAt"])
    .index("by_tenant_due_at", ["tenantId", "dueAt"]),

  rfqAttachments: defineTable({
    tenantId,
    rfqId: v.id("rfqs"),
    storageId: v.optional(v.id("_storage")),
    fileName: v.string(),
    contentType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    kind: v.union(
      v.literal("email_body"),
      v.literal("drawing"),
      v.literal("cad"),
      v.literal("spreadsheet"),
      v.literal("photo"),
      v.literal("other"),
    ),
    checksum: v.optional(v.string()),
    extractedText: v.optional(v.string()),
    createdAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_rfq", ["rfqId"]),

  processDefinitions: defineTable({
    process: processKey,
    label: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    sortOrder: v.number(),
    updatedAt: timestamp,
  })
    .index("by_process", ["process"])
    .index("by_active", ["active"]),

  materials: defineTable({
    name: v.string(),
    family: v.union(
      v.literal("aluminum"),
      v.literal("steel"),
      v.literal("stainless_steel"),
      v.literal("copper_alloy"),
      v.literal("plastic"),
      v.literal("composite"),
      v.literal("other"),
    ),
    grade: v.optional(v.string()),
    form: v.union(
      v.literal("bar"),
      v.literal("sheet"),
      v.literal("plate"),
      v.literal("tube"),
      v.literal("wire"),
      v.literal("block"),
      v.literal("other"),
    ),
    densityKgM3: v.optional(v.number()),
    costCents: v.int64(),
    costUnit: v.union(v.literal("kg"), v.literal("m"), v.literal("m2"), v.literal("piece")),
    supplier: v.optional(v.string()),
    active: v.boolean(),
    updatedAt: timestamp,
  })
    .index("by_family", ["family"])
    .index("by_grade", ["grade"])
    .index("by_active", ["active"]),

  machines: defineTable({
    name: v.string(),
    process: processKey,
    hourlyRateCents: v.int64(),
    setupRateCents: v.int64(),
    capabilities: v.array(keyValue),
    active: v.boolean(),
    updatedAt: timestamp,
  })
    .index("by_process", ["process"])
    .index("by_active", ["active"]),

  rateCards: defineTable({
    name: v.string(),
    process: processKey,
    currency: currencyCode,
    setupMinimumCents: v.int64(),
    minimumOrderCents: v.int64(),
    marginPercent: v.number(),
    rushMultiplier: v.number(),
    active: v.boolean(),
    validFrom: timestamp,
    validTo: v.optional(timestamp),
    updatedAt: timestamp,
  })
    .index("by_process", ["process"])
    .index("by_active", ["active"])
    .index("by_process_active", ["process", "active"]),

  parts: defineTable({
    tenantId,
    rfqId: v.id("rfqs"),
    partNumber: v.string(),
    revision: v.optional(v.string()),
    description: v.optional(v.string()),
    process: processKey,
    materialId: v.optional(v.id("materials")),
    materialText: v.optional(v.string()),
    quantity: v.number(),
    dimensions: v.optional(dimensions),
    toleranceClass: v.optional(v.string()),
    finish: v.optional(v.string()),
    attachmentIds: v.array(v.id("rfqAttachments")),
    manufacturabilityFlags: v.array(v.string()),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_rfq", ["rfqId"])
    .index("by_process", ["process"])
    .index("by_material", ["materialId"]),

  partViews: defineTable({
    tenantId,
    partId: v.id("parts"),
    sourceAttachmentId: v.optional(v.id("rfqAttachments")),
    thumbnailStorageId: v.optional(v.id("_storage")),
    previewStorageId: v.optional(v.id("_storage")),
    unit: v.union(v.literal("mm"), v.literal("inch")),
    dimensions: v.optional(dimensions),
    annotations: v.array(keyValue),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_part", ["partId"]),

  quoteScenarios: defineTable({
    tenantId,
    rfqId: v.id("rfqs"),
    title: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("ready"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired"),
    ),
    revision: v.number(),
    currency: currencyCode,
    leadTimeDays: v.number(),
    validUntil: v.optional(timestamp),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_rfq", ["rfqId"])
    .index("by_status", ["status"])
    .index("by_rfq_status", ["rfqId", "status"])
    .index("by_tenant_rfq", ["tenantId", "rfqId"]),

  quoteLineItems: defineTable({
    tenantId,
    quoteId: v.id("quoteScenarios"),
    partId: v.optional(v.id("parts")),
    process: processKey,
    description: v.string(),
    quantity: v.number(),
    amountCents: v.int64(),
    calculatorVersion: v.string(),
    breakdown: v.array(moneyBreakdown),
    assumptions: v.array(keyValue),
    sortOrder: v.number(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_quote", ["quoteId"])
    .index("by_part", ["partId"])
    .index("by_quote_sort_order", ["quoteId", "sortOrder"]),

  offers: defineTable({
    tenantId,
    quoteId: v.id("quoteScenarios"),
    rfqId: v.id("rfqs"),
    customerId: v.optional(v.id("customers")),
    offerNumber: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("superseded"),
    ),
    terms: v.array(keyValue),
    emailThreadId: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
    sentAt: v.optional(timestamp),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_quote", ["quoteId"])
    .index("by_rfq", ["rfqId"])
    .index("by_status", ["status"])
    .index("by_offer_number", ["offerNumber"])
    .index("by_tenant_offer_number", ["tenantId", "offerNumber"]),

  offerReleaseExecutions: defineTable({
    tenantId,
    executionKey: v.string(),
    executionFingerprint: v.optional(v.string()),
    offerId: v.id("offers"),
    quoteId: v.id("quoteScenarios"),
    rfqId: v.id("rfqs"),
    executionVersion: v.string(),
    planVersion: v.string(),
    mode: offerReleaseExecutionMode,
    status: offerReleaseExecutionStatus,
    actorName: v.string(),
    releaseAt: timestamp,
    executedAt: timestamp,
    commandCount: v.number(),
    lifecycleEventCount: v.number(),
    workspaceActionCount: v.number(),
    calendarEventCount: v.number(),
    artifactCount: v.number(),
    warningCount: v.number(),
    commands: v.array(offerReleaseExecutionCommand),
    nextActions: v.array(v.string()),
    warnings: v.array(v.string()),
    createdAt: timestamp,
  })
    .index("by_tenant_offer_execution_key", ["tenantId", "offerId", "executionKey"])
    .index("by_offer_time", ["offerId", "createdAt"])
    .index("by_tenant_offer_time", ["tenantId", "offerId", "createdAt"])
    .index("by_status_time", ["status", "createdAt"])
    .index("by_tenant_status_time", ["tenantId", "status", "createdAt"]),

  integrationLinks: defineTable({
    provider: v.union(v.literal("gmail"), v.literal("calendar")),
    externalId: v.string(),
    externalUrl: v.optional(v.string()),
    rfqId: v.optional(v.id("rfqs")),
    offerId: v.optional(v.id("offers")),
    customerId: v.optional(v.id("customers")),
    contactId: v.optional(v.id("contacts")),
    syncStatus: v.union(v.literal("linked"), v.literal("stale"), v.literal("blocked")),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
    .index("by_provider_external_id", ["provider", "externalId"])
    .index("by_rfq", ["rfqId"])
    .index("by_offer", ["offerId"]),

  providerRuns: defineTable({
    tenantId,
    provider: v.union(
      v.literal("local_codex"),
      v.literal("gemini"),
      v.literal("tavily"),
      v.literal("elevenlabs"),
      v.literal("mock"),
    ),
    adapterVersion: v.string(),
    purpose: v.union(
      v.literal("extract"),
      v.literal("summarize"),
      v.literal("draft"),
      v.literal("scout"),
      v.literal("voice"),
    ),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    inputHash: v.string(),
    outputSummary: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    rfqId: v.optional(v.id("rfqs")),
    quoteId: v.optional(v.id("quoteScenarios")),
    startedAt: v.optional(timestamp),
    completedAt: v.optional(timestamp),
    createdAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["status"])
    .index("by_provider", ["provider"])
    .index("by_input_hash", ["inputHash"])
    .index("by_provider_input_hash", ["provider", "inputHash"])
    .index("by_rfq", ["rfqId"])
    .index("by_tenant_rfq", ["tenantId", "rfqId"]),

  activities: defineTable({
    tenantId,
    rfqId: v.optional(v.id("rfqs")),
    quoteId: v.optional(v.id("quoteScenarios")),
    offerId: v.optional(v.id("offers")),
    providerRunId: v.optional(v.id("providerRuns")),
    actorType: v.union(v.literal("human"), v.literal("system"), v.literal("provider")),
    actorName: v.optional(v.string()),
    kind: v.union(
      v.literal("note"),
      v.literal("status_change"),
      v.literal("email_received"),
      v.literal("email_sent"),
      v.literal("calendar_event"),
      v.literal("provider_run"),
      v.literal("calculation"),
    ),
    message: v.string(),
    createdAt: timestamp,
  })
    .index("by_tenant", ["tenantId"])
    .index("by_rfq_time", ["rfqId", "createdAt"])
    .index("by_quote_time", ["quoteId", "createdAt"])
    .index("by_offer_time", ["offerId", "createdAt"])
    .index("by_tenant_rfq_time", ["tenantId", "rfqId", "createdAt"])
    .index("by_tenant_offer_time", ["tenantId", "offerId", "createdAt"]),

  featureBacklogItems: defineTable({
    title: v.string(),
    description: v.string(),
    source: v.union(
      v.literal("operator"),
      v.literal("reviewer"),
      v.literal("customer"),
      v.literal("research"),
      v.literal("system"),
    ),
    status: v.union(
      v.literal("new"),
      v.literal("scored"),
      v.literal("planned"),
      v.literal("shipped"),
      v.literal("rejected"),
    ),
    quoteAccuracyImpact: v.number(),
    timeSavedImpact: v.number(),
    integrationRisk: v.number(),
    reviewability: v.number(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
    .index("by_status", ["status"])
    .index("by_source", ["source"]),
});
