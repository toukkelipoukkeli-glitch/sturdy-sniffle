import { v, type GenericId, type Infer } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { documentBelongsToFactoryBidTenant, requireFactoryBidActor, type FactoryBidActor } from "./authz";
import {
  assertMatchingActivityReferences,
  buildOfferReplySyncWritePlan,
  buildOfferStatusTransitionPatch,
} from "./workflowRules";

const processKey = v.union(
  v.literal("cnc_milling"),
  v.literal("cnc_turning"),
  v.literal("sheet_metal"),
  v.literal("plastic"),
  v.literal("wire_edm"),
  v.literal("fabrication"),
);

const currencyCode = v.union(v.literal("EUR"), v.literal("USD"), v.literal("GBP"));
type CurrencyCode = Infer<typeof currencyCode>;

const importRfqSource = v.union(v.literal("gmail"), v.literal("manual"), v.literal("import"));

const rfqStatus = v.union(
  v.literal("new"),
  v.literal("triage"),
  v.literal("estimating"),
  v.literal("quoted"),
  v.literal("won"),
  v.literal("lost"),
  v.literal("archived"),
);

const quoteStatus = v.union(
  v.literal("draft"),
  v.literal("ready"),
  v.literal("sent"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("expired"),
);

const offerWorkflowStatus = v.union(
  v.literal("draft"),
  v.literal("sent"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("superseded"),
);

const aiProvider = v.union(
  v.literal("local_codex"),
  v.literal("gemini"),
  v.literal("tavily"),
  v.literal("elevenlabs"),
  v.literal("mock"),
);

const providerPurpose = v.union(
  v.literal("extract"),
  v.literal("summarize"),
  v.literal("draft"),
  v.literal("scout"),
  v.literal("voice"),
);

const providerRunStatus = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("succeeded"),
  v.literal("failed"),
  v.literal("skipped"),
);

const integrationProvider = v.union(v.literal("gmail"), v.literal("calendar"));

const integrationSyncStatus = v.union(v.literal("linked"), v.literal("stale"), v.literal("blocked"));

const connectorActivityKind = v.union(v.literal("email_received"), v.literal("calendar_event"), v.literal("note"));

const offerReplyActivityKind = v.union(v.literal("email_received"), v.literal("note"));

const offerReplyStatusTransition = v.object({
  status: v.union(v.literal("accepted"), v.literal("declined")),
  message: v.optional(v.string()),
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

const offerProviderOutcomeReadinessStatus = v.union(v.literal("blocked"), v.literal("ready"));

const offerFollowUpActivityReadinessStatus = v.union(
  v.literal("partial"),
  v.literal("pending"),
  v.literal("recorded"),
  v.literal("review"),
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

type OfferProviderOutcomeReadinessStatus = Infer<typeof offerProviderOutcomeReadinessStatus>;
type OfferFollowUpActivityReadinessStatus = Infer<typeof offerFollowUpActivityReadinessStatus>;

const defaultLimit = 50;

const demoWorkspaceImportOperation = v.union(
  v.object({
    key: v.string(),
    kind: v.literal("upsert_customer"),
    tenantId: v.string(),
    customerId: v.string(),
    name: v.string(),
    defaultCurrency: currencyCode,
  }),
  v.object({
    key: v.string(),
    kind: v.literal("upsert_rfq"),
    tenantId: v.string(),
    rfqId: v.string(),
    customerId: v.string(),
    dueAt: v.optional(v.string()),
    priority: v.union(v.literal("normal"), v.literal("rush")),
    source: importRfqSource,
    status: v.union(v.literal("new"), v.literal("triage"), v.literal("estimating"), v.literal("quoted")),
    subject: v.string(),
  }),
  v.object({
    key: v.string(),
    kind: v.literal("upsert_quote"),
    tenantId: v.string(),
    quoteId: v.string(),
    rfqId: v.string(),
    currency: currencyCode,
    leadTimeDays: v.number(),
    partNumber: v.string(),
    totalCents: v.number(),
  }),
  v.object({
    key: v.string(),
    kind: v.literal("upsert_offer"),
    tenantId: v.string(),
    offerId: v.string(),
    currency: currencyCode,
    customerId: v.string(),
    offerNumber: v.string(),
    quoteId: v.string(),
    rfqId: v.string(),
    status: v.union(v.literal("draft"), v.literal("sent")),
    totalCents: v.number(),
    validUntil: v.string(),
  }),
  v.object({
    key: v.string(),
    kind: v.literal("append_activity"),
    tenantId: v.string(),
    activityId: v.string(),
    activityKind: v.union(v.literal("note"), v.literal("status_change"), v.literal("calendar_event"), v.literal("calculation")),
    message: v.string(),
    occurredAt: v.string(),
    offerId: v.optional(v.string()),
    quoteId: v.optional(v.string()),
    rfqId: v.optional(v.string()),
  }),
);

type DemoWorkspaceImportOperation = Infer<typeof demoWorkspaceImportOperation>;
type OfferReleaseExecutionCommandInput = Infer<typeof offerReleaseExecutionCommand>;
type ConnectorSyncLinkInput = {
  externalId: string;
  externalUrl?: string;
  provider: "gmail" | "calendar";
  rfqId?: GenericId<"rfqs">;
  syncStatus: "linked" | "stale" | "blocked";
};
type DemoImportStatus = "created" | "updated" | "skipped";

interface DemoImportState {
  customers: Map<string, GenericId<"customers">>;
  customerCurrency: Map<string, CurrencyCode>;
  rfqs: Map<string, GenericId<"rfqs">>;
  quotes: Map<string, GenericId<"quoteScenarios">>;
  offers: Map<string, GenericId<"offers">>;
  activities: Map<string, GenericId<"activities">>;
}

interface DemoImportOperationResult {
  key: string;
  kind: DemoWorkspaceImportOperation["kind"];
  status: DemoImportStatus;
  convexId: string;
}

export const listRfqQueue = query({
  args: {
    status: v.optional(rfqStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const limit = boundedLimit(args.limit);
    const status = args.status;
    const rows = status
      ? await ctx.db
          .query("rfqs")
          .withIndex("by_status_due_at", (q) => q.eq("status", status))
          .order("asc")
          .take(limit)
      : await ctx.db.query("rfqs").withIndex("by_due_at").order("asc").take(limit);

    return rows.filter((rfq) => belongsToActorTenant(rfq, actor)).map((rfq) => ({
      _id: rfq._id,
      status: rfq.status,
      priority: rfq.priority,
      subject: rfq.subject,
      summary: rfq.summary,
      receivedAt: rfq.receivedAt,
      dueAt: rfq.dueAt,
      currency: rfq.currency,
      customerId: rfq.customerId,
      updatedAt: rfq.updatedAt,
    }));
  },
});

export const importDemoWorkspace = mutation({
  args: {
    importPlanVersion: v.string(),
    seedVersion: v.string(),
    generatedAt: v.string(),
    tenantId: v.string(),
    operations: v.array(demoWorkspaceImportOperation),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "admin:write");
    if (args.tenantId !== actor.tenantId) {
      throw new Error("import tenant must match authenticated FactoryBid tenant");
    }

    const importedAt = isoTimestamp(args.generatedAt, "generatedAt");
    const state: DemoImportState = {
      activities: new Map(),
      customers: new Map(),
      customerCurrency: new Map(),
      offers: new Map(),
      quotes: new Map(),
      rfqs: new Map(),
    };
    const results: DemoImportOperationResult[] = [];

    for (const operation of args.operations) {
      requireImportTenant(operation, actor);
      switch (operation.kind) {
        case "upsert_customer":
          results.push(await upsertImportedCustomer(ctx, operation, importedAt, state));
          break;
        case "upsert_rfq":
          results.push(await upsertImportedRfq(ctx, operation, importedAt, state));
          break;
        case "upsert_quote":
          results.push(await upsertImportedQuote(ctx, operation, importedAt, state));
          break;
        case "upsert_offer":
          results.push(await upsertImportedOffer(ctx, operation, importedAt, state));
          break;
        case "append_activity":
          results.push(await appendImportedActivity(ctx, operation, state));
          break;
      }
    }

    return {
      importPlanVersion: args.importPlanVersion,
      seedVersion: args.seedVersion,
      tenantId: args.tenantId,
      operationCount: results.length,
      created: countImportStatus(results, "created"),
      updated: countImportStatus(results, "updated"),
      skipped: countImportStatus(results, "skipped"),
      ids: {
        activities: mapToRecord(state.activities),
        customers: mapToRecord(state.customers),
        offers: mapToRecord(state.offers),
        quotes: mapToRecord(state.quotes),
        rfqs: mapToRecord(state.rfqs),
      },
      operations: results,
    };
  },
});

export const updateRfqStatus = mutation({
  args: {
    rfqId: v.id("rfqs"),
    status: rfqStatus,
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    await requireTenantDocument(ctx, args.rfqId, "rfqId", actor);
    await ctx.db.patch(args.rfqId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.rfqId;
  },
});

export const transitionRfqStatus = mutation({
  args: {
    rfqId: v.id("rfqs"),
    status: rfqStatus,
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    const rfq = await requireTenantDocument<RfqDocument>(ctx, args.rfqId, "rfqId", actor);
    assertRfqStatusTransition(rfq.status, args.status);
    const now = Date.now();
    await ctx.db.patch(args.rfqId, {
      status: args.status,
      updatedAt: now,
    });
    const transitionMessage = `Moved RFQ from ${rfq.status} to ${args.status}.`;
    const note = optionalNonBlank(args.message);
    const message = note ? `${transitionMessage} ${note}` : transitionMessage;
    const activityId = await ctx.db.insert("activities", {
      rfqId: args.rfqId,
      tenantId: actor.tenantId,
      actorType: "human",
      actorName: actor.displayName,
      kind: "status_change",
      message,
      createdAt: now,
    });

    return {
      activityId,
      rfqId: args.rfqId,
      status: args.status,
    };
  },
});

export const listRfqActivities = query({
  args: {
    rfqId: v.id("rfqs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const rfq = await requireTenantDocument<RfqDocument>(ctx, args.rfqId, "rfqId", actor);
    const limit = boundedLimit(args.limit);
    const activities = rfq.tenantId
      ? await ctx.db
          .query("activities")
          .withIndex("by_tenant_rfq_time", (q) => q.eq("tenantId", actor.tenantId).eq("rfqId", args.rfqId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("activities")
          .withIndex("by_rfq_time", (q) => q.eq("rfqId", args.rfqId))
          .order("desc")
          .take(limit);
    return activities.filter((activity) => childBelongsToActorTenant(activity, rfq, actor));
  },
});

export const listQuoteScenariosByRfq = query({
  args: {
    rfqId: v.id("rfqs"),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const rfq = await requireTenantDocument<RfqDocument>(ctx, args.rfqId, "rfqId", actor);
    const scenarios = rfq.tenantId
      ? await ctx.db
          .query("quoteScenarios")
          .withIndex("by_tenant_rfq", (q) => q.eq("tenantId", actor.tenantId).eq("rfqId", args.rfqId))
          .order("desc")
          .collect()
      : await ctx.db
          .query("quoteScenarios")
          .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
          .order("desc")
          .collect();
    return scenarios.filter((scenario) => childBelongsToActorTenant(scenario, rfq, actor));
  },
});

export const createQuoteScenario = mutation({
  args: {
    rfqId: v.id("rfqs"),
    title: v.string(),
    status: quoteStatus,
    revision: v.number(),
    currency: currencyCode,
    leadTimeDays: v.number(),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    await requireTenantDocument(ctx, args.rfqId, "rfqId", actor);
    const title = nonBlank(args.title, "title");
    const now = Date.now();
    return await ctx.db.insert("quoteScenarios", {
      rfqId: args.rfqId,
      tenantId: actor.tenantId,
      title,
      status: args.status,
      revision: positiveInteger(args.revision, "revision"),
      currency: args.currency,
      leadTimeDays: positiveInteger(args.leadTimeDays, "leadTimeDays"),
      validUntil: args.validUntil,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const processWorkloadBuckets = query({
  args: {
    process: v.optional(processKey),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const limit = boundedLimit(args.limit, 500);
    const process = args.process;
    const parts = process
      ? await ctx.db
          .query("parts")
          .withIndex("by_process", (q) => q.eq("process", process))
          .take(limit)
      : await ctx.db.query("parts").take(limit);
    const buckets = new Map<string, { partCount: number; totalQuantity: number; rfqIds: Set<string> }>();

    for (const part of parts.filter((part) => belongsToActorTenant(part, actor))) {
      const bucket = buckets.get(part.process) ?? {
        partCount: 0,
        totalQuantity: 0,
        rfqIds: new Set<string>(),
      };
      bucket.partCount += 1;
      bucket.totalQuantity += part.quantity;
      bucket.rfqIds.add(part.rfqId);
      buckets.set(part.process, bucket);
    }

    return [...buckets.entries()]
      .map(([process, bucket]) => ({
        process,
        partCount: bucket.partCount,
        totalQuantity: bucket.totalQuantity,
        rfqCount: bucket.rfqIds.size,
      }))
      .sort((left, right) => right.partCount - left.partCount || left.process.localeCompare(right.process));
  },
});

export const listOfferFollowUpActivities = query({
  args: {
    offerId: v.id("offers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const limit = boundedLimit(args.limit);
    const activities = offer.tenantId
      ? await ctx.db
          .query("activities")
          .withIndex("by_tenant_offer_time", (q) => q.eq("tenantId", actor.tenantId).eq("offerId", args.offerId))
          .order("desc")
          .filter((q) => q.eq(q.field("kind"), "calendar_event"))
          .take(limit)
      : await ctx.db
          .query("activities")
          .withIndex("by_offer_time", (q) => q.eq("offerId", args.offerId))
          .order("desc")
          .filter((q) => q.eq(q.field("kind"), "calendar_event"))
          .take(limit);
    return activities.filter((activity) => childBelongsToActorTenant(activity, offer, actor));
  },
});

export const listOfferActivities = query({
  args: {
    offerId: v.id("offers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const limit = boundedLimit(args.limit);
    const activities = offer.tenantId
      ? await ctx.db
          .query("activities")
          .withIndex("by_tenant_offer_time", (q) => q.eq("tenantId", actor.tenantId).eq("offerId", args.offerId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("activities")
          .withIndex("by_offer_time", (q) => q.eq("offerId", args.offerId))
          .order("desc")
          .take(limit);
    return activities.filter((activity) => childBelongsToActorTenant(activity, offer, actor));
  },
});

export const listOfferReleaseExecutions = query({
  args: {
    offerId: v.id("offers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const limit = boundedLimit(args.limit);
    const executions = offer.tenantId
      ? await ctx.db
          .query("offerReleaseExecutions")
          .withIndex("by_tenant_offer_time", (q) => q.eq("tenantId", actor.tenantId).eq("offerId", args.offerId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("offerReleaseExecutions")
          .withIndex("by_offer_time", (q) => q.eq("offerId", args.offerId))
          .order("desc")
          .take(limit);

    return executions.filter((execution) => childBelongsToActorTenant(execution, offer, actor));
  },
});

export const listOfferProviderOutcomeReadiness = query({
  args: {
    offerId: v.id("offers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const limit = boundedLimit(args.limit);
    const records = offer.tenantId
      ? await ctx.db
          .query("offerProviderOutcomeReadiness")
          .withIndex("by_tenant_offer_time", (q) => q.eq("tenantId", actor.tenantId).eq("offerId", args.offerId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("offerProviderOutcomeReadiness")
          .withIndex("by_offer_time", (q) => q.eq("offerId", args.offerId))
          .order("desc")
          .take(limit);

    return records.filter((record) => childBelongsToActorTenant(record, offer, actor));
  },
});

export const listOfferFollowUpActivityReadiness = query({
  args: {
    offerId: v.id("offers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const limit = boundedLimit(args.limit);
    const records = offer.tenantId
      ? await ctx.db
          .query("offerFollowUpActivityReadiness")
          .withIndex("by_tenant_offer_time", (q) => q.eq("tenantId", actor.tenantId).eq("offerId", args.offerId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("offerFollowUpActivityReadiness")
          .withIndex("by_offer_time", (q) => q.eq("offerId", args.offerId))
          .order("desc")
          .take(limit);

    return records.filter((record) => childBelongsToActorTenant(record, offer, actor));
  },
});

export const listProviderRuns = query({
  args: {
    status: v.optional(providerRunStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const limit = boundedLimit(args.limit);
    const status = args.status;
    const tenantRuns = status
      ? await ctx.db
          .query("providerRuns")
          .withIndex("by_tenant_status_created_at", (q) => q.eq("tenantId", actor.tenantId).eq("status", status))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("providerRuns")
          .withIndex("by_tenant_created_at", (q) => q.eq("tenantId", actor.tenantId))
          .order("desc")
          .take(limit);
    const legacyRuns = status
      ? await ctx.db
          .query("providerRuns")
          .withIndex("by_tenant_status_created_at", (q) => q.eq("tenantId", undefined).eq("status", status))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("providerRuns")
          .withIndex("by_tenant_created_at", (q) => q.eq("tenantId", undefined))
          .order("desc")
          .take(limit);
    const runs = mergeProviderRunsByCreatedAt(tenantRuns, legacyRuns).slice(0, limit);

    return runs.filter((run) => belongsToActorTenant(run, actor)).map(compactProviderRun);
  },
});

export const listProviderRunsByRfq = query({
  args: {
    rfqId: v.id("rfqs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const rfq = await requireTenantDocument<RfqDocument>(ctx, args.rfqId, "rfqId", actor);
    const limit = boundedLimit(args.limit);
    const runs = rfq.tenantId
      ? await ctx.db
          .query("providerRuns")
          .withIndex("by_tenant_rfq_created_at", (q) => q.eq("tenantId", actor.tenantId).eq("rfqId", args.rfqId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("providerRuns")
          .withIndex("by_rfq_created_at", (q) => q.eq("rfqId", args.rfqId))
          .order("desc")
          .take(limit);

    return runs.filter((run) => childBelongsToActorTenant(run, rfq, actor)).map(compactProviderRun);
  },
});

export const listProviderRunsByQuote = query({
  args: {
    quoteId: v.id("quoteScenarios"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const quote = await requireTenantDocument<QuoteScenarioDocument>(ctx, args.quoteId, "quoteId", actor);
    const limit = boundedLimit(args.limit);
    const runs = quote.tenantId
      ? await ctx.db
          .query("providerRuns")
          .withIndex("by_tenant_quote_created_at", (q) => q.eq("tenantId", actor.tenantId).eq("quoteId", args.quoteId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("providerRuns")
          .withIndex("by_quote_created_at", (q) => q.eq("quoteId", args.quoteId))
          .order("desc")
          .take(limit);

    return runs.filter((run) => childBelongsToActorTenant(run, quote, actor)).map(compactProviderRun);
  },
});

export const listProviderRunsByOffer = query({
  args: {
    offerId: v.id("offers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const limit = boundedLimit(args.limit);
    const runs = offer.tenantId
      ? await ctx.db
          .query("providerRuns")
          .withIndex("by_tenant_offer_created_at", (q) => q.eq("tenantId", actor.tenantId).eq("offerId", args.offerId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("providerRuns")
          .withIndex("by_offer_created_at", (q) => q.eq("offerId", args.offerId))
          .order("desc")
          .take(limit);

    return runs.filter((run) => childBelongsToActorTenant(run, offer, actor)).map(compactProviderRun);
  },
});

export const listIntegrationLinksByRfq = query({
  args: {
    rfqId: v.id("rfqs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const rfq = await requireTenantDocument<RfqDocument>(ctx, args.rfqId, "rfqId", actor);
    const limit = boundedLimit(args.limit);
    const tenantLinks = actor.tenantId === undefined
      ? []
      : await ctx.db
          .query("integrationLinks")
          .withIndex("by_tenant_rfq_updated_at", (q) => q.eq("tenantId", actor.tenantId).eq("rfqId", args.rfqId))
          .order("desc")
          .take(limit);
    const legacyLinks = rfq.tenantId
      ? []
      : await ctx.db
          .query("integrationLinks")
          .withIndex("by_tenant_rfq_updated_at", (q) => q.eq("tenantId", undefined).eq("rfqId", args.rfqId))
          .order("desc")
          .take(limit);
    const links = mergeIntegrationLinksByUpdatedAt(tenantLinks, legacyLinks).slice(0, limit);

    return links.filter((link) => childBelongsToActorTenant(link, rfq, actor)).map(compactIntegrationLink);
  },
});

export const listIntegrationLinksByOffer = query({
  args: {
    offerId: v.id("offers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const limit = boundedLimit(args.limit);
    const tenantLinks = actor.tenantId === undefined
      ? []
      : await ctx.db
          .query("integrationLinks")
          .withIndex("by_tenant_offer_updated_at", (q) => q.eq("tenantId", actor.tenantId).eq("offerId", args.offerId))
          .order("desc")
          .take(limit);
    const legacyLinks = offer.tenantId
      ? []
      : await ctx.db
          .query("integrationLinks")
          .withIndex("by_tenant_offer_updated_at", (q) => q.eq("tenantId", undefined).eq("offerId", args.offerId))
          .order("desc")
          .take(limit);
    const links = mergeIntegrationLinksByUpdatedAt(tenantLinks, legacyLinks).slice(0, limit);

    return links.filter((link) => childBelongsToActorTenant(link, offer, actor)).map(compactIntegrationLink);
  },
});

export const getIntegrationLinkByExternalId = query({
  args: {
    provider: integrationProvider,
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:read");
    const externalId = nonBlank(args.externalId, "externalId");
    const tenantLinks = actor.tenantId === undefined
      ? []
      : await ctx.db
          .query("integrationLinks")
          .withIndex("by_tenant_provider_external_id", (q) =>
            q.eq("tenantId", actor.tenantId).eq("provider", args.provider).eq("externalId", externalId),
          )
          .collect();
    const tenantLink = mergeIntegrationLinksByUpdatedAt(tenantLinks)[0];
    if (tenantLink && belongsToActorTenant(tenantLink, actor)) {
      return compactIntegrationLink(tenantLink);
    }

    const legacyLinks = await ctx.db
      .query("integrationLinks")
      .withIndex("by_tenant_provider_external_id", (q) =>
        q.eq("tenantId", undefined).eq("provider", args.provider).eq("externalId", externalId),
      )
      .collect();
    const legacyLink = mergeIntegrationLinksByUpdatedAt(legacyLinks)[0];

    return legacyLink && await legacyIntegrationLinkBelongsToActor(ctx, legacyLink, actor)
      ? compactIntegrationLink(legacyLink)
      : null;
  },
});

export const recordOfferReleaseExecution = mutation({
  args: {
    offerId: v.id("offers"),
    executionKey: v.string(),
    executionFingerprint: v.optional(v.string()),
    executionVersion: v.string(),
    planVersion: v.string(),
    mode: offerReleaseExecutionMode,
    status: offerReleaseExecutionStatus,
    releaseAt: v.string(),
    executedAt: v.string(),
    commands: v.array(offerReleaseExecutionCommand),
    lifecycleEventCount: v.number(),
    workspaceActionCount: v.number(),
    calendarEventCount: v.number(),
    nextActions: v.array(v.string()),
    warnings: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const now = Date.now();
    const commands = normalizeOfferReleaseExecutionCommands(args.commands);
    const executionKey = nonBlank(args.executionKey, "executionKey");
    const existingExecution = await ctx.db
      .query("offerReleaseExecutions")
      .withIndex("by_tenant_offer_execution_key", (q) =>
        q.eq("tenantId", actor.tenantId).eq("offerId", args.offerId).eq("executionKey", executionKey),
      )
      .unique();
    if (existingExecution) {
      return {
        executionId: existingExecution._id,
        offerId: args.offerId,
        reused: true,
        status: existingExecution.status,
      };
    }

    const lifecycleEventCount = nonNegativeInteger(args.lifecycleEventCount, "lifecycleEventCount");
    const workspaceActionCount = nonNegativeInteger(args.workspaceActionCount, "workspaceActionCount");
    const calendarEventCount = nonNegativeInteger(args.calendarEventCount, "calendarEventCount");
    const warnings = normalizeTextList(args.warnings);
    const nextActions = normalizeTextList(args.nextActions);
    const actorName = nonBlank(actor.displayName, "actor.displayName");
    const releaseAt = isoTimestamp(args.releaseAt, "releaseAt");
    const executedAt = isoTimestamp(args.executedAt, "executedAt");
    const emailDraftArtifactCount = commands.filter(
      (command) => command.kind === "email_draft" && command.status === "applied",
    ).length;
    const artifactCount = lifecycleEventCount + workspaceActionCount + calendarEventCount + emailDraftArtifactCount;
    const warningCount = warnings.length + commands.reduce((total, command) => total + command.warnings.length, 0);
    const executionId = await ctx.db.insert("offerReleaseExecutions", {
      actorName,
      artifactCount,
      calendarEventCount,
      commandCount: commands.length,
      commands,
      createdAt: now,
      executedAt,
      ...(args.executionFingerprint !== undefined
        ? { executionFingerprint: nonBlank(args.executionFingerprint, "executionFingerprint") }
        : {}),
      executionKey,
      executionVersion: nonBlank(args.executionVersion, "executionVersion"),
      lifecycleEventCount,
      mode: args.mode,
      nextActions,
      offerId: args.offerId,
      planVersion: nonBlank(args.planVersion, "planVersion"),
      quoteId: offer.quoteId,
      releaseAt,
      rfqId: offer.rfqId,
      status: args.status,
      tenantId: actor.tenantId,
      warningCount,
      warnings,
      workspaceActionCount,
    });
    const activityId = await ctx.db.insert("activities", {
      actorName,
      actorType: "system",
      createdAt: now,
      kind: "calculation",
      message: offerReleaseExecutionActivityMessage({
        commandCount: commands.length,
        mode: args.mode,
        offerNumber: offer.offerNumber,
        status: args.status,
      }),
      offerId: args.offerId,
      quoteId: offer.quoteId,
      rfqId: offer.rfqId,
      tenantId: actor.tenantId,
    });

    return {
      activityId,
      executionId,
      offerId: args.offerId,
      reused: false,
      status: args.status,
    };
  },
});

export const recordOfferProviderOutcomeReadiness = mutation({
  args: {
    offerId: v.id("offers"),
    readinessKey: v.string(),
    readinessVersion: v.string(),
    status: offerProviderOutcomeReadinessStatus,
    offerNumber: v.string(),
    expectedCommandCount: v.number(),
    latestCommandCount: v.number(),
    appliedCommandCount: v.number(),
    failedCommandCount: v.number(),
    missingCommandCount: v.number(),
    blockerLabels: v.array(v.string()),
    nextActions: v.array(v.string()),
    latestOutcomeFingerprint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const now = Date.now();
    const readinessKey = nonBlank(args.readinessKey, "readinessKey");
    const existingReadiness = await ctx.db
      .query("offerProviderOutcomeReadiness")
      .withIndex("by_tenant_offer_readiness_key", (q) =>
        q.eq("tenantId", actor.tenantId).eq("offerId", args.offerId).eq("readinessKey", readinessKey),
      )
      .unique();

    const offerNumber = nonBlank(args.offerNumber, "offerNumber");
    if (offerNumber !== offer.offerNumber) {
      throw new Error("offerNumber must match offer");
    }

    const payload = {
      appliedCommandCount: nonNegativeInteger(args.appliedCommandCount, "appliedCommandCount"),
      blockerLabels: normalizeTextList(args.blockerLabels),
      expectedCommandCount: nonNegativeInteger(args.expectedCommandCount, "expectedCommandCount"),
      failedCommandCount: nonNegativeInteger(args.failedCommandCount, "failedCommandCount"),
      latestCommandCount: nonNegativeInteger(args.latestCommandCount, "latestCommandCount"),
      latestOutcomeFingerprint: optionalNonBlank(args.latestOutcomeFingerprint),
      missingCommandCount: nonNegativeInteger(args.missingCommandCount, "missingCommandCount"),
      nextActions: normalizeTextList(args.nextActions),
      offerNumber,
      readinessVersion: nonBlank(args.readinessVersion, "readinessVersion"),
      status: normalizeProviderOutcomeReadinessStatus(args.status),
    };
    validateProviderOutcomeReadinessCounts(payload);

    if (existingReadiness) {
      if (existingReadiness.readinessVersion !== payload.readinessVersion) {
        throw new Error("readinessVersion must match existing provider outcome readiness record");
      }
      await ctx.db.patch(existingReadiness._id, {
        ...payload,
        updatedAt: now,
      });
      const activityId = await recordOfferProviderOutcomeReadinessActivity(ctx, {
        actor,
        appliedCommandCount: payload.appliedCommandCount,
        failedCommandCount: payload.failedCommandCount,
        now,
        offer,
        offerId: args.offerId,
        offerNumber: payload.offerNumber,
        status: payload.status,
      });
      return {
        activityId,
        offerId: args.offerId,
        readinessId: existingReadiness._id,
        reused: true,
        status: payload.status,
      };
    }

    const readinessId = await ctx.db.insert("offerProviderOutcomeReadiness", {
      ...payload,
      createdAt: now,
      offerId: args.offerId,
      quoteId: offer.quoteId,
      readinessKey,
      rfqId: offer.rfqId,
      tenantId: actor.tenantId,
      updatedAt: now,
    });
    const activityId = await recordOfferProviderOutcomeReadinessActivity(ctx, {
      actor,
      appliedCommandCount: payload.appliedCommandCount,
      failedCommandCount: payload.failedCommandCount,
      now,
      offer,
      offerId: args.offerId,
      offerNumber: payload.offerNumber,
      status: payload.status,
    });

    return {
      activityId,
      offerId: args.offerId,
      readinessId,
      reused: false,
      status: payload.status,
    };
  },
});

export const recordOfferFollowUpActivityReadiness = mutation({
  args: {
    offerId: v.id("offers"),
    readinessKey: v.string(),
    readinessVersion: v.string(),
    readinessHistoryVersion: v.string(),
    status: offerFollowUpActivityReadinessStatus,
    recordedAt: v.number(),
    expectedTaskCount: v.number(),
    recordedTaskCount: v.number(),
    missingTaskCount: v.number(),
    unexpectedTaskCount: v.number(),
    unmatchedActivityCount: v.number(),
    totalActivities: v.number(),
    expectedFollowUpTaskIds: v.array(v.string()),
    recordedFollowUpTaskIds: v.array(v.string()),
    missingFollowUpTaskIds: v.array(v.string()),
    unexpectedFollowUpTaskIds: v.array(v.string()),
    nextActions: v.array(v.string()),
    latestActivityMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const now = Date.now();
    const readinessKey = nonBlank(args.readinessKey, "readinessKey");
    const existingReadiness = await ctx.db
      .query("offerFollowUpActivityReadiness")
      .withIndex("by_tenant_offer_readiness_key", (q) =>
        q.eq("tenantId", actor.tenantId).eq("offerId", args.offerId).eq("readinessKey", readinessKey),
      )
      .unique();

    const payload = {
      expectedFollowUpTaskIds: normalizeTextList(args.expectedFollowUpTaskIds),
      expectedTaskCount: nonNegativeInteger(args.expectedTaskCount, "expectedTaskCount"),
      latestActivityMessage: optionalNonBlank(args.latestActivityMessage),
      missingFollowUpTaskIds: normalizeTextList(args.missingFollowUpTaskIds),
      missingTaskCount: nonNegativeInteger(args.missingTaskCount, "missingTaskCount"),
      nextActions: normalizeTextList(args.nextActions),
      readinessHistoryVersion: nonBlank(args.readinessHistoryVersion, "readinessHistoryVersion"),
      readinessVersion: nonBlank(args.readinessVersion, "readinessVersion"),
      recordedAt: nonNegativeInteger(args.recordedAt, "recordedAt"),
      recordedFollowUpTaskIds: normalizeTextList(args.recordedFollowUpTaskIds),
      recordedTaskCount: nonNegativeInteger(args.recordedTaskCount, "recordedTaskCount"),
      status: normalizeFollowUpActivityReadinessStatus(args.status),
      totalActivities: nonNegativeInteger(args.totalActivities, "totalActivities"),
      unexpectedFollowUpTaskIds: normalizeTextList(args.unexpectedFollowUpTaskIds),
      unexpectedTaskCount: nonNegativeInteger(args.unexpectedTaskCount, "unexpectedTaskCount"),
      unmatchedActivityCount: nonNegativeInteger(args.unmatchedActivityCount, "unmatchedActivityCount"),
    };
    validateFollowUpActivityReadinessCounts(payload);

    if (existingReadiness) {
      if (existingReadiness.readinessVersion !== payload.readinessVersion) {
        throw new Error("readinessVersion must match existing follow-up activity readiness record");
      }
      if (existingReadiness.readinessHistoryVersion !== payload.readinessHistoryVersion) {
        throw new Error("readinessHistoryVersion must match existing follow-up activity readiness record");
      }
      await ctx.db.patch(existingReadiness._id, {
        ...payload,
        updatedAt: now,
      });
      const activityId = await recordOfferFollowUpActivityReadinessActivity(ctx, {
        actor,
        missingTaskCount: payload.missingTaskCount,
        now,
        offer,
        offerId: args.offerId,
        recordedTaskCount: payload.recordedTaskCount,
        status: payload.status,
      });
      return {
        activityId,
        offerId: args.offerId,
        readinessId: existingReadiness._id,
        reused: true,
        status: payload.status,
      };
    }

    const readinessId = await ctx.db.insert("offerFollowUpActivityReadiness", {
      ...payload,
      createdAt: now,
      offerId: args.offerId,
      quoteId: offer.quoteId,
      readinessKey,
      rfqId: offer.rfqId,
      tenantId: actor.tenantId,
      updatedAt: now,
    });
    const activityId = await recordOfferFollowUpActivityReadinessActivity(ctx, {
      actor,
      missingTaskCount: payload.missingTaskCount,
      now,
      offer,
      offerId: args.offerId,
      recordedTaskCount: payload.recordedTaskCount,
      status: payload.status,
    });

    return {
      activityId,
      offerId: args.offerId,
      readinessId,
      reused: false,
      status: payload.status,
    };
  },
});

export const transitionOfferStatus = mutation({
  args: {
    offerId: v.id("offers"),
    status: offerWorkflowStatus,
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    const now = Date.now();
    const patch = buildOfferStatusTransitionPatch({
      currentStatus: offer.status,
      nextStatus: args.status,
      now,
      sentAt: offer.sentAt,
    });
    await ctx.db.patch(args.offerId, patch);
    const transitionMessage = `Moved offer ${offer.offerNumber} from ${offer.status} to ${args.status}.`;
    const note = optionalNonBlank(args.message);
    const message = note ? `${transitionMessage} ${note}` : transitionMessage;
    const activityId = await ctx.db.insert("activities", {
      offerId: args.offerId,
      tenantId: actor.tenantId,
      quoteId: offer.quoteId,
      rfqId: offer.rfqId,
      actorType: "human",
      actorName: actor.displayName,
      kind: "status_change",
      message,
      createdAt: now,
    });

    return {
      activityId,
      offerId: args.offerId,
      status: args.status,
    };
  },
});

export const createOfferFollowUpActivity = mutation({
  args: {
    offerId: v.id("offers"),
    quoteId: v.optional(v.id("quoteScenarios")),
    rfqId: v.optional(v.id("rfqs")),
    actorName: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    await resolveActivityReferences(ctx, args, actor);

    return await ctx.db.insert("activities", {
      offerId: args.offerId,
      tenantId: actor.tenantId,
      quoteId: args.quoteId,
      rfqId: args.rfqId,
      actorType: "system",
      actorName: args.actorName,
      kind: "calendar_event",
      message: nonBlank(args.message, "message"),
      createdAt: Date.now(),
    });
  },
});

export const recordOfferReplySync = mutation({
  args: {
    offerId: v.id("offers"),
    quoteId: v.optional(v.id("quoteScenarios")),
    rfqId: v.optional(v.id("rfqs")),
    activities: v.array(v.object({
      actorName: v.optional(v.string()),
      kind: offerReplyActivityKind,
      message: v.string(),
    })),
    statusTransitions: v.array(offerReplyStatusTransition),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    const offer = await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor);
    await resolveActivityReferences(ctx, args, actor);

    const now = Date.now();
    const quoteId = args.quoteId ?? offer.quoteId;
    const rfqId = args.rfqId ?? offer.rfqId;
    const activityIds = [];

    const plan = buildOfferReplySyncWritePlan({
      activities: args.activities,
      currentStatus: offer.status,
      offerId: args.offerId,
      offerNumber: offer.offerNumber,
      quoteId,
      rfqId,
      sentAt: offer.sentAt,
      statusTransitions: args.statusTransitions,
      tenantId: actor.tenantId,
      now,
    });

    for (const offerPatch of plan.offerPatches) {
      await ctx.db.patch(args.offerId, offerPatch.patch);
    }

    for (const activity of plan.activities) {
      activityIds.push(await ctx.db.insert("activities", {
        offerId: args.offerId,
        tenantId: actor.tenantId,
        quoteId,
        rfqId,
        actorType: activity.actorType,
        actorName: activity.actorName,
        kind: activity.kind,
        message: activity.message,
        createdAt: activity.createdAt,
      }));
    }

    return {
      activityCount: activityIds.length,
      activityIds,
      appliedTransitionCount: plan.appliedTransitionCount,
      offerId: args.offerId,
      skippedTransitionCount: plan.skippedTransitionCount,
      status: plan.status,
    };
  },
});

export const recordWorkspaceActivity = mutation({
  args: {
    rfqId: v.optional(v.id("rfqs")),
    quoteId: v.optional(v.id("quoteScenarios")),
    offerId: v.optional(v.id("offers")),
    actorName: v.optional(v.string()),
    kind: v.union(v.literal("note"), v.literal("status_change"), v.literal("calendar_event"), v.literal("calculation")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    await resolveActivityReferences(ctx, args, actor);

    return await ctx.db.insert("activities", {
      rfqId: args.rfqId,
      tenantId: actor.tenantId,
      quoteId: args.quoteId,
      offerId: args.offerId,
      actorType: "human",
      actorName: optionalNonBlank(args.actorName) ?? actor.displayName,
      kind: args.kind,
      message: nonBlank(args.message, "message"),
      createdAt: Date.now(),
    });
  },
});

export const recordProviderRun = mutation({
  args: {
    provider: aiProvider,
    adapterVersion: v.string(),
    purpose: providerPurpose,
    status: providerRunStatus,
    inputHash: v.string(),
    outputSummary: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    rfqId: v.optional(v.id("rfqs")),
    quoteId: v.optional(v.id("quoteScenarios")),
    offerId: v.optional(v.id("offers")),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    await resolveActivityReferences(ctx, args, actor);
    const startedAt = optionalFiniteTimestamp(args.startedAt, "startedAt");
    const completedAt = optionalFiniteTimestamp(args.completedAt, "completedAt");
    if (startedAt !== undefined && completedAt !== undefined && completedAt < startedAt) {
      throw new Error("completedAt must be on or after startedAt");
    }

    const now = Date.now();
    const providerRunId = await ctx.db.insert("providerRuns", {
      tenantId: actor.tenantId,
      provider: args.provider,
      adapterVersion: nonBlank(args.adapterVersion, "adapterVersion"),
      purpose: args.purpose,
      status: args.status,
      inputHash: nonBlank(args.inputHash, "inputHash"),
      outputSummary: optionalNonBlank(args.outputSummary),
      errorMessage: optionalNonBlank(args.errorMessage),
      rfqId: args.rfqId,
      quoteId: args.quoteId,
      offerId: args.offerId,
      startedAt,
      completedAt,
      createdAt: now,
    });
    const activityId = await ctx.db.insert("activities", {
      tenantId: actor.tenantId,
      rfqId: args.rfqId,
      quoteId: args.quoteId,
      offerId: args.offerId,
      providerRunId,
      actorType: "provider",
      actorName: args.provider,
      kind: "provider_run",
      message: providerRunActivityMessage(args),
      createdAt: now,
    });

    return {
      activityId,
      providerRunId,
      status: args.status,
    };
  },
});

export const recordConnectorRfqSync = mutation({
  args: {
    activities: v.array(v.object({
      actorName: v.optional(v.string()),
      kind: connectorActivityKind,
      message: v.string(),
      rfqId: v.optional(v.id("rfqs")),
    })),
    links: v.array(v.object({
      externalId: v.string(),
      externalUrl: v.optional(v.string()),
      provider: integrationProvider,
      rfqId: v.optional(v.id("rfqs")),
      syncStatus: integrationSyncStatus,
    })),
  },
  handler: async (ctx, args) => {
    const actor = await requireFactoryBidActor(ctx, "workspace:write");
    const links = boundedConnectorBatch(args.links, "links", 200);
    const activities = boundedConnectorBatch(args.activities, "activities", 300);
    if (links.length === 0 && activities.length === 0) {
      throw new Error("connector sync payload must include links or activities");
    }

    const now = Date.now();
    const linkResults = [];
    for (const link of links) {
      linkResults.push(await upsertConnectorIntegrationLink(ctx, actor, link, now));
    }

    const activityIds = [];
    for (const activity of activities) {
      if (activity.rfqId) {
        await requireTenantDocument<RfqDocument>(ctx, activity.rfqId, "activity.rfqId", actor);
      }
      activityIds.push(await ctx.db.insert("activities", {
        actorName: optionalNonBlank(activity.actorName) ?? "Connector sync",
        actorType: "system",
        createdAt: now,
        kind: activity.kind,
        message: nonBlank(activity.message, "activity.message"),
        rfqId: activity.rfqId,
        tenantId: actor.tenantId,
      }));
    }

    return {
      activities: activityIds,
      activityCount: activityIds.length,
      createdLinks: countConnectorLinkStatus(linkResults, "created"),
      links: linkResults.map((result) => result.integrationLinkId),
      skippedLinks: countConnectorLinkStatus(linkResults, "skipped"),
      updatedLinks: countConnectorLinkStatus(linkResults, "updated"),
    };
  },
});

async function upsertImportedCustomer(
  ctx: MutationCtx,
  operation: Extract<DemoWorkspaceImportOperation, { kind: "upsert_customer" }>,
  importedAt: number,
  state: DemoImportState,
): Promise<DemoImportOperationResult> {
  const name = nonBlank(operation.name, "name");
  const normalizedName = normalizeName(name);
  const existing = await ctx.db
    .query("customers")
    .withIndex("by_tenant_normalized_name", (q) => q.eq("tenantId", operation.tenantId).eq("normalizedName", normalizedName))
    .unique();
  const patch = {
    defaultCurrency: operation.defaultCurrency,
    name,
    normalizedName,
    updatedAt: importedAt,
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    state.customers.set(operation.customerId, existing._id);
    state.customerCurrency.set(operation.customerId, operation.defaultCurrency);
    return importResult(operation, "updated", existing._id);
  }

  const customerId = await ctx.db.insert("customers", {
    ...patch,
    createdAt: importedAt,
    tenantId: operation.tenantId,
  });
  state.customers.set(operation.customerId, customerId);
  state.customerCurrency.set(operation.customerId, operation.defaultCurrency);
  return importResult(operation, "created", customerId);
}

async function upsertImportedRfq(
  ctx: MutationCtx,
  operation: Extract<DemoWorkspaceImportOperation, { kind: "upsert_rfq" }>,
  importedAt: number,
  state: DemoImportState,
): Promise<DemoImportOperationResult> {
  const customerId = requireMappedId(state.customers, operation.customerId, "customerId");
  const existing = (await ctx.db.query("rfqs").withIndex("by_tenant", (q) => q.eq("tenantId", operation.tenantId)).collect()).find(
    (rfq) => rfq.source.externalId === operation.rfqId,
  );
  const patch = {
    currency: state.customerCurrency.get(operation.customerId) ?? "EUR",
    customerId,
    dueAt: optionalIsoTimestamp(operation.dueAt, "dueAt"),
    extractedFields: [],
    priority: operation.priority,
    receivedAt: importedAt,
    source: {
      externalId: operation.rfqId,
      label: "Demo workspace seed",
      provider: operation.source,
    },
    status: operation.status,
    subject: nonBlank(operation.subject, "subject"),
    summary: `Imported demo RFQ ${operation.rfqId}.`,
    updatedAt: importedAt,
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    state.rfqs.set(operation.rfqId, existing._id);
    return importResult(operation, "updated", existing._id);
  }

  const rfqId = await ctx.db.insert("rfqs", {
    ...patch,
    createdAt: importedAt,
    tenantId: operation.tenantId,
  });
  state.rfqs.set(operation.rfqId, rfqId);
  return importResult(operation, "created", rfqId);
}

async function upsertImportedQuote(
  ctx: MutationCtx,
  operation: Extract<DemoWorkspaceImportOperation, { kind: "upsert_quote" }>,
  importedAt: number,
  state: DemoImportState,
): Promise<DemoImportOperationResult> {
  const rfqId = requireMappedId(state.rfqs, operation.rfqId, "rfqId");
  const title = quoteImportTitle(operation);
  const existing = (
    await ctx.db
      .query("quoteScenarios")
      .withIndex("by_tenant_rfq", (q) => q.eq("tenantId", operation.tenantId).eq("rfqId", rfqId))
      .collect()
  ).find((quote) => quote.title === title);
  const patch = {
    currency: operation.currency,
    leadTimeDays: positiveInteger(operation.leadTimeDays, "leadTimeDays"),
    revision: 1,
    status: "ready" as const,
    title,
    updatedAt: importedAt,
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    state.quotes.set(operation.quoteId, existing._id);
    return importResult(operation, "updated", existing._id);
  }

  const quoteId = await ctx.db.insert("quoteScenarios", {
    ...patch,
    createdAt: importedAt,
    rfqId,
    tenantId: operation.tenantId,
  });
  state.quotes.set(operation.quoteId, quoteId);
  return importResult(operation, "created", quoteId);
}

async function upsertImportedOffer(
  ctx: MutationCtx,
  operation: Extract<DemoWorkspaceImportOperation, { kind: "upsert_offer" }>,
  importedAt: number,
  state: DemoImportState,
): Promise<DemoImportOperationResult> {
  const customerId = requireMappedId(state.customers, operation.customerId, "customerId");
  const quoteId = requireMappedId(state.quotes, operation.quoteId, "quoteId");
  const rfqId = requireMappedId(state.rfqs, operation.rfqId, "rfqId");
  const existing = await ctx.db
    .query("offers")
    .withIndex("by_tenant_offer_number", (q) => q.eq("tenantId", operation.tenantId).eq("offerNumber", operation.offerNumber))
    .unique();
  const patch = {
    customerId,
    quoteId,
    rfqId,
    status: operation.status,
    terms: [
      { key: "valid_until", value: operation.validUntil },
      { key: "import_total_cents", value: String(nonNegativeInteger(operation.totalCents, "totalCents")) },
      { key: "currency", value: operation.currency },
    ],
    updatedAt: importedAt,
    ...(operation.status === "sent" ? { sentAt: existing?.sentAt ?? importedAt } : {}),
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    state.offers.set(operation.offerId, existing._id);
    return importResult(operation, "updated", existing._id);
  }

  const offerId = await ctx.db.insert("offers", {
    ...patch,
    createdAt: importedAt,
    offerNumber: nonBlank(operation.offerNumber, "offerNumber"),
    sentAt: operation.status === "sent" ? importedAt : undefined,
    tenantId: operation.tenantId,
  });
  state.offers.set(operation.offerId, offerId);
  return importResult(operation, "created", offerId);
}

async function appendImportedActivity(
  ctx: MutationCtx,
  operation: Extract<DemoWorkspaceImportOperation, { kind: "append_activity" }>,
  state: DemoImportState,
): Promise<DemoImportOperationResult> {
  const createdAt = isoTimestamp(operation.occurredAt, "occurredAt");
  const rfqId = resolveOptionalMappedId(state.rfqs, operation.rfqId, "rfqId");
  const quoteId = resolveOptionalMappedId(state.quotes, operation.quoteId, "quoteId");
  const offerId = resolveOptionalMappedId(state.offers, operation.offerId, "offerId");
  const existing = (await ctx.db.query("activities").withIndex("by_tenant", (q) => q.eq("tenantId", operation.tenantId)).collect()).find(
    (activity) =>
      activity.kind === operation.activityKind &&
      activity.message === operation.message &&
      activity.createdAt === createdAt &&
      activity.rfqId === rfqId &&
      activity.quoteId === quoteId &&
      activity.offerId === offerId,
  );

  if (existing) {
    state.activities.set(operation.activityId, existing._id);
    return importResult(operation, "skipped", existing._id);
  }

  const activityId = await ctx.db.insert("activities", {
    actorName: "FactoryBid demo import",
    actorType: "system",
    createdAt,
    kind: operation.activityKind,
    message: nonBlank(operation.message, "message"),
    offerId,
    quoteId,
    rfqId,
    tenantId: operation.tenantId,
  });
  state.activities.set(operation.activityId, activityId);
  return importResult(operation, "created", activityId);
}

type RfqDocument = Pick<Doc<"rfqs">, "status" | "tenantId">;
type RfqStatus = RfqDocument["status"];
type OfferDocument = Pick<Doc<"offers">, "offerNumber" | "quoteId" | "rfqId" | "sentAt" | "status" | "tenantId">;
type QuoteScenarioDocument = Pick<Doc<"quoteScenarios">, "rfqId" | "tenantId">;
type ProviderRunDocument = Doc<"providerRuns">;
type IntegrationLinkDocument = Doc<"integrationLinks">;
type DbReaderLike = { db: { get: <T = unknown>(id: GenericId<string>) => Promise<T | null> } };

async function requireDocument<T = unknown>(ctx: DbReaderLike, id: GenericId<string>, key: string) {
  const document = await ctx.db.get<T>(id);
  if (!document) {
    throw new Error(`${key} does not exist`);
  }
  return document;
}

async function requireTenantDocument<T extends { tenantId?: string } = { tenantId?: string }>(
  ctx: DbReaderLike,
  id: GenericId<string>,
  key: string,
  actor: FactoryBidActor,
) {
  const document = await requireDocument<T>(ctx, id, key);
  if (!belongsToActorTenant(document, actor)) {
    throw new Error(`${key} does not exist`);
  }
  return document;
}

function belongsToActorTenant(document: { tenantId?: string }, actor: FactoryBidActor): boolean {
  return documentBelongsToFactoryBidTenant(document, actor);
}

function childBelongsToActorTenant(
  child: { tenantId?: string },
  parent: { tenantId?: string },
  actor: FactoryBidActor,
): boolean {
  return parent.tenantId === undefined ? belongsToActorTenant(child, actor) : child.tenantId === actor.tenantId;
}

async function legacyIntegrationLinkBelongsToActor(
  ctx: DbReaderLike,
  link: Pick<IntegrationLinkDocument, "offerId" | "rfqId" | "tenantId">,
  actor: FactoryBidActor,
): Promise<boolean> {
  if (link.tenantId !== undefined) {
    return belongsToActorTenant(link, actor);
  }
  if (link.rfqId) {
    const rfq = await ctx.db.get<RfqDocument>(link.rfqId);
    return Boolean(rfq && belongsToActorTenant(rfq, actor));
  }
  if (link.offerId) {
    const offer = await ctx.db.get<OfferDocument>(link.offerId);
    return Boolean(offer && belongsToActorTenant(offer, actor));
  }
  return false;
}

async function resolveActivityReferences(
  ctx: DbReaderLike,
  args: { offerId?: GenericId<"offers">; quoteId?: GenericId<"quoteScenarios">; rfqId?: GenericId<"rfqs"> },
  actor: FactoryBidActor,
) {
  const offer = args.offerId ? await requireTenantDocument<OfferDocument>(ctx, args.offerId, "offerId", actor) : undefined;
  const quote = args.quoteId ? await requireTenantDocument<QuoteScenarioDocument>(ctx, args.quoteId, "quoteId", actor) : undefined;
  const rfq = args.rfqId ? await requireTenantDocument<RfqDocument>(ctx, args.rfqId, "rfqId", actor) : undefined;

  assertMatchingActivityReferences({ offer, quote, quoteId: args.quoteId, rfqId: args.rfqId });

  return { offer, quote, rfq };
}

const allowedRfqStatusTransitions: Record<RfqStatus, RfqStatus[]> = {
  new: ["triage", "estimating", "lost", "archived"],
  triage: ["new", "estimating", "lost", "archived"],
  estimating: ["triage", "quoted", "lost", "archived"],
  quoted: ["estimating", "won", "lost", "archived"],
  won: [],
  lost: [],
  archived: [],
};

function assertRfqStatusTransition(fromStatus: RfqStatus, toStatus: RfqStatus) {
  if (fromStatus === toStatus) {
    throw new Error("status must change");
  }
  if (!allowedRfqStatusTransitions[fromStatus].includes(toStatus)) {
    throw new Error(`cannot transition RFQ from ${fromStatus} to ${toStatus}`);
  }
}

function requireImportTenant(operation: DemoWorkspaceImportOperation, actor: FactoryBidActor) {
  if (operation.tenantId !== actor.tenantId) {
    throw new Error(`operation ${operation.key} tenant must match authenticated FactoryBid tenant`);
  }
}

function importResult(
  operation: DemoWorkspaceImportOperation,
  status: DemoImportStatus,
  convexId: GenericId<string>,
): DemoImportOperationResult {
  return {
    convexId,
    key: operation.key,
    kind: operation.kind,
    status,
  };
}

function countImportStatus(results: DemoImportOperationResult[], status: DemoImportStatus): number {
  return results.filter((result) => result.status === status).length;
}

async function upsertConnectorIntegrationLink(
  ctx: MutationCtx,
  actor: FactoryBidActor,
  link: ConnectorSyncLinkInput,
  now: number,
): Promise<{ integrationLinkId: GenericId<"integrationLinks">; status: DemoImportStatus }> {
  if (link.rfqId) {
    await requireTenantDocument<RfqDocument>(ctx, link.rfqId, "link.rfqId", actor);
  }

  const externalId = nonBlank(link.externalId, "link.externalId");
  const externalUrl = optionalNonBlank(link.externalUrl);
  const existingLinks = await ctx.db
    .query("integrationLinks")
    .withIndex("by_tenant_provider_external_id", (q) =>
      q.eq("tenantId", actor.tenantId).eq("provider", link.provider).eq("externalId", externalId),
    )
    .collect();
  const [existing, ...duplicateLinks] = mergeIntegrationLinksByUpdatedAt(existingLinks);

  if (!existing) {
    return {
      integrationLinkId: await ctx.db.insert("integrationLinks", {
        createdAt: now,
        externalId,
        externalUrl,
        provider: link.provider,
        rfqId: link.rfqId,
        syncStatus: link.syncStatus,
        tenantId: actor.tenantId,
        updatedAt: now,
      }),
      status: "created",
    };
  }

  for (const duplicate of duplicateLinks) {
    await ctx.db.delete(duplicate._id);
  }

  if (
    duplicateLinks.length === 0 &&
    existing.externalUrl === externalUrl &&
    existing.rfqId === link.rfqId &&
    existing.syncStatus === link.syncStatus
  ) {
    return {
      integrationLinkId: existing._id,
      status: "skipped",
    };
  }

  await ctx.db.patch(existing._id, {
    externalUrl,
    rfqId: link.rfqId,
    syncStatus: link.syncStatus,
    updatedAt: now,
  });
  return {
    integrationLinkId: existing._id,
    status: "updated",
  };
}

function boundedConnectorBatch<T>(values: T[], key: string, maximum: number): T[] {
  if (values.length > maximum) {
    throw new Error(`${key} cannot contain more than ${maximum} records`);
  }
  return values;
}

function countConnectorLinkStatus(
  results: { status: DemoImportStatus }[],
  status: DemoImportStatus,
): number {
  return results.filter((result) => result.status === status).length;
}

function normalizeOfferReleaseExecutionCommands(
  commands: OfferReleaseExecutionCommandInput[],
): OfferReleaseExecutionCommandInput[] {
  if (commands.length === 0) {
    throw new Error("commands must include at least one release command");
  }

  const seenKeys = new Set<string>();
  return commands.map((command, index) => {
    const key = nonBlank(command.key, `commands[${index}].key`);
    if (seenKeys.has(key)) {
      throw new Error(`duplicate release command ${key}`);
    }
    seenKeys.add(key);

    const externalId = optionalNonBlank(command.externalId);
    const message = optionalNonBlank(command.message);
    const normalized: OfferReleaseExecutionCommandInput = {
      detail: nonBlank(command.detail, `commands[${index}].detail`),
      idempotencyKey: nonBlank(command.idempotencyKey, `commands[${index}].idempotencyKey`),
      key,
      kind: command.kind,
      label: nonBlank(command.label, `commands[${index}].label`),
      status: command.status,
      warnings: normalizeTextList(command.warnings),
    };
    if (externalId) {
      normalized.externalId = externalId;
    }
    if (message) {
      normalized.message = message;
    }
    return normalized;
  });
}

function normalizeTextList(values: string[]): string[] {
  return values.map((value) => optionalNonBlank(value)).filter((value): value is string => Boolean(value));
}

function normalizeProviderOutcomeReadinessStatus(
  status: OfferProviderOutcomeReadinessStatus,
): OfferProviderOutcomeReadinessStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("provider outcome readiness status must be blocked or ready");
  }
  return status;
}

function normalizeFollowUpActivityReadinessStatus(
  status: OfferFollowUpActivityReadinessStatus,
): OfferFollowUpActivityReadinessStatus {
  if (status !== "partial" && status !== "pending" && status !== "recorded" && status !== "review") {
    throw new Error("follow-up activity readiness status must be partial pending recorded or review");
  }
  return status;
}

function validateProviderOutcomeReadinessCounts(input: {
  appliedCommandCount: number;
  expectedCommandCount: number;
  failedCommandCount: number;
  latestCommandCount: number;
  missingCommandCount: number;
  status: OfferProviderOutcomeReadinessStatus;
}) {
  if (input.appliedCommandCount + input.failedCommandCount !== input.latestCommandCount) {
    throw new Error("applied and failed provider outcome counts must equal latestCommandCount");
  }
  if (input.latestCommandCount + input.missingCommandCount !== input.expectedCommandCount) {
    throw new Error("latest and missing provider outcome counts must equal expectedCommandCount");
  }
  if (input.status === "ready" && (input.failedCommandCount > 0 || input.missingCommandCount > 0)) {
    throw new Error("provider outcome readiness cannot be ready while failed or missing commands remain");
  }
}

function validateFollowUpActivityReadinessCounts(input: {
  expectedFollowUpTaskIds: string[];
  expectedTaskCount: number;
  missingFollowUpTaskIds: string[];
  missingTaskCount: number;
  recordedFollowUpTaskIds: string[];
  recordedTaskCount: number;
  status: OfferFollowUpActivityReadinessStatus;
  totalActivities: number;
  unexpectedFollowUpTaskIds: string[];
  unexpectedTaskCount: number;
  unmatchedActivityCount: number;
}) {
  if (input.expectedFollowUpTaskIds.length !== input.expectedTaskCount) {
    throw new Error("expectedFollowUpTaskIds length must match expectedTaskCount");
  }
  if (input.recordedFollowUpTaskIds.length !== input.recordedTaskCount) {
    throw new Error("recordedFollowUpTaskIds length must match recordedTaskCount");
  }
  if (input.missingFollowUpTaskIds.length !== input.missingTaskCount) {
    throw new Error("missingFollowUpTaskIds length must match missingTaskCount");
  }
  if (input.unexpectedFollowUpTaskIds.length !== input.unexpectedTaskCount) {
    throw new Error("unexpectedFollowUpTaskIds length must match unexpectedTaskCount");
  }
  if (input.totalActivities < input.recordedTaskCount) {
    throw new Error("totalActivities cannot be less than recordedTaskCount");
  }
  if (input.status === "recorded" && (input.missingTaskCount > 0 || input.unexpectedTaskCount > 0 || input.unmatchedActivityCount > 0)) {
    throw new Error("follow-up activity readiness cannot be recorded while review work remains");
  }
}

async function recordOfferProviderOutcomeReadinessActivity(
  ctx: MutationCtx,
  input: {
    actor: FactoryBidActor;
    appliedCommandCount: number;
    failedCommandCount: number;
    now: number;
    offer: OfferDocument;
    offerId: GenericId<"offers">;
    offerNumber: string;
    status: OfferProviderOutcomeReadinessStatus;
  },
) {
  return await ctx.db.insert("activities", {
    actorName: nonBlank(input.actor.displayName, "actor.displayName"),
    actorType: "system",
    createdAt: input.now,
    kind: "calculation",
    message: offerProviderOutcomeReadinessActivityMessage({
      appliedCommandCount: input.appliedCommandCount,
      failedCommandCount: input.failedCommandCount,
      offerNumber: input.offerNumber,
      status: input.status,
    }),
    offerId: input.offerId,
    quoteId: input.offer.quoteId,
    rfqId: input.offer.rfqId,
    tenantId: input.actor.tenantId,
  });
}

async function recordOfferFollowUpActivityReadinessActivity(
  ctx: MutationCtx,
  input: {
    actor: FactoryBidActor;
    missingTaskCount: number;
    now: number;
    offer: OfferDocument;
    offerId: GenericId<"offers">;
    recordedTaskCount: number;
    status: OfferFollowUpActivityReadinessStatus;
  },
) {
  return await ctx.db.insert("activities", {
    actorName: nonBlank(input.actor.displayName, "actor.displayName"),
    actorType: "system",
    createdAt: input.now,
    kind: "calculation",
    message: offerFollowUpActivityReadinessActivityMessage({
      missingTaskCount: input.missingTaskCount,
      offerNumber: input.offer.offerNumber,
      recordedTaskCount: input.recordedTaskCount,
      status: input.status,
    }),
    offerId: input.offerId,
    quoteId: input.offer.quoteId,
    rfqId: input.offer.rfqId,
    tenantId: input.actor.tenantId,
  });
}

function offerReleaseExecutionActivityMessage(input: {
  commandCount: number;
  mode: "commit" | "dry_run";
  offerNumber: string;
  status: string;
}): string {
  const modeLabel = input.mode === "dry_run" ? "dry-run" : "commit";
  return `Recorded ${modeLabel} release execution audit for ${input.offerNumber}: ${input.status} (${input.commandCount} commands).`;
}

function offerProviderOutcomeReadinessActivityMessage(input: {
  appliedCommandCount: number;
  failedCommandCount: number;
  offerNumber: string;
  status: OfferProviderOutcomeReadinessStatus;
}): string {
  return `Recorded provider outcome readiness for ${input.offerNumber}: ${input.status} (${input.appliedCommandCount} applied, ${input.failedCommandCount} failed).`;
}

function offerFollowUpActivityReadinessActivityMessage(input: {
  missingTaskCount: number;
  offerNumber: string;
  recordedTaskCount: number;
  status: OfferFollowUpActivityReadinessStatus;
}): string {
  return `Recorded follow-up activity readiness for ${input.offerNumber}: ${input.status} (${input.recordedTaskCount} recorded, ${input.missingTaskCount} missing).`;
}

function providerRunActivityMessage(input: { provider: string; purpose: string; status: string }): string {
  return `Recorded ${input.provider} ${input.purpose} provider run: ${input.status}.`;
}

function compactProviderRun(run: ProviderRunDocument) {
  return {
    _id: run._id,
    provider: run.provider,
    adapterVersion: run.adapterVersion,
    purpose: run.purpose,
    status: run.status,
    inputHash: run.inputHash,
    outputSummary: run.outputSummary,
    errorMessage: run.errorMessage,
    rfqId: run.rfqId,
    quoteId: run.quoteId,
    offerId: run.offerId,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    createdAt: run.createdAt,
  };
}

function mergeProviderRunsByCreatedAt(...groups: ProviderRunDocument[][]): ProviderRunDocument[] {
  const byId = new Map<string, ProviderRunDocument>();
  for (const run of groups.flat()) {
    byId.set(String(run._id), run);
  }
  return [...byId.values()].sort(
    (left, right) => right.createdAt - left.createdAt || String(right._id).localeCompare(String(left._id)),
  );
}

function compactIntegrationLink(link: IntegrationLinkDocument) {
  return {
    _id: link._id,
    provider: link.provider,
    externalId: link.externalId,
    externalUrl: link.externalUrl,
    rfqId: link.rfqId,
    offerId: link.offerId,
    customerId: link.customerId,
    contactId: link.contactId,
    syncStatus: link.syncStatus,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

function mergeIntegrationLinksByUpdatedAt(...groups: IntegrationLinkDocument[][]): IntegrationLinkDocument[] {
  const byId = new Map<string, IntegrationLinkDocument>();
  for (const link of groups.flat()) {
    byId.set(String(link._id), link);
  }
  return [...byId.values()].sort(
    (left, right) => right.updatedAt - left.updatedAt || String(right._id).localeCompare(String(left._id)),
  );
}

function mapToRecord<T extends string>(map: Map<string, GenericId<T>>): Record<string, string> {
  return Object.fromEntries([...map.entries()].map(([key, value]) => [key, value]));
}

function requireMappedId<T extends string>(map: Map<string, GenericId<T>>, localId: string, key: string): GenericId<T> {
  const mapped = map.get(localId);
  if (!mapped) {
    throw new Error(`${key} ${localId} has not been imported`);
  }
  return mapped;
}

function resolveOptionalMappedId<T extends string>(
  map: Map<string, GenericId<T>>,
  localId: string | undefined,
  key: string,
): GenericId<T> | undefined {
  return localId ? requireMappedId(map, localId, key) : undefined;
}

function quoteImportTitle(operation: Extract<DemoWorkspaceImportOperation, { kind: "upsert_quote" }>): string {
  return `${operation.quoteId}: ${nonBlank(operation.partNumber, "partNumber")}`;
}

function normalizeName(value: string): string {
  return nonBlank(value, "name").toLowerCase().replace(/\s+/g, " ");
}

function isoTimestamp(value: string, key: string): number {
  const parsed = Date.parse(nonBlank(value, key));
  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a valid ISO timestamp`);
  }
  return parsed;
}

function optionalIsoTimestamp(value: string | undefined, key: string): number | undefined {
  return value === undefined ? undefined : isoTimestamp(value, key);
}

function optionalFiniteTimestamp(value: number | undefined, key: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isFinite(value)) {
    throw new Error(`${key} must be a finite timestamp`);
  }
  return value;
}

function boundedLimit(value: number | undefined, maximum = 100): number {
  if (value === undefined) {
    return Math.min(defaultLimit, maximum);
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("limit must be a positive integer");
  }
  return Math.min(value, maximum);
}

function positiveInteger(value: number, key: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return value;
}

function nonNegativeInteger(value: number, key: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer`);
  }
  return value;
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${key} is required`);
  }
  return trimmed;
}

function optionalNonBlank(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
