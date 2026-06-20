import { v, type GenericId } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireFactoryBidActor } from "./authz";
import { buildOfferStatusTransitionPatch } from "./workflowRules";

const processKey = v.union(
  v.literal("cnc_milling"),
  v.literal("cnc_turning"),
  v.literal("sheet_metal"),
  v.literal("plastic"),
  v.literal("wire_edm"),
  v.literal("fabrication"),
);

const currencyCode = v.union(v.literal("EUR"), v.literal("USD"), v.literal("GBP"));

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

const defaultLimit = 50;

export const listRfqQueue = query({
  args: {
    status: v.optional(rfqStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireFactoryBidActor(ctx, "workspace:read");
    const limit = boundedLimit(args.limit);
    const status = args.status;
    const rows = status
      ? await ctx.db
          .query("rfqs")
          .withIndex("by_status_due_at", (q) => q.eq("status", status))
          .order("asc")
          .take(limit)
      : await ctx.db.query("rfqs").withIndex("by_due_at").order("asc").take(limit);

    return rows.map((rfq) => ({
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

export const updateRfqStatus = mutation({
  args: {
    rfqId: v.id("rfqs"),
    status: rfqStatus,
  },
  handler: async (ctx, args) => {
    await requireFactoryBidActor(ctx, "workspace:write");
    await requireDocument(ctx, args.rfqId, "rfqId");
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
    const rfq = await requireDocument<RfqDocument>(ctx, args.rfqId, "rfqId");
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
    await requireFactoryBidActor(ctx, "workspace:read");
    await requireDocument(ctx, args.rfqId, "rfqId");
    return await ctx.db
      .query("activities")
      .withIndex("by_rfq_time", (q) => q.eq("rfqId", args.rfqId))
      .order("desc")
      .take(boundedLimit(args.limit));
  },
});

export const listQuoteScenariosByRfq = query({
  args: {
    rfqId: v.id("rfqs"),
  },
  handler: async (ctx, args) => {
    await requireFactoryBidActor(ctx, "workspace:read");
    return await ctx.db
      .query("quoteScenarios")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .order("desc")
      .collect();
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
    await requireFactoryBidActor(ctx, "workspace:write");
    await requireDocument(ctx, args.rfqId, "rfqId");
    const title = nonBlank(args.title, "title");
    const now = Date.now();
    return await ctx.db.insert("quoteScenarios", {
      rfqId: args.rfqId,
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
    await requireFactoryBidActor(ctx, "workspace:read");
    const limit = boundedLimit(args.limit, 500);
    const process = args.process;
    const parts = process
      ? await ctx.db
          .query("parts")
          .withIndex("by_process", (q) => q.eq("process", process))
          .take(limit)
      : await ctx.db.query("parts").take(limit);
    const buckets = new Map<string, { partCount: number; totalQuantity: number; rfqIds: Set<string> }>();

    for (const part of parts) {
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
    await requireFactoryBidActor(ctx, "workspace:read");
    const limit = boundedLimit(args.limit);
    return await ctx.db
      .query("activities")
      .withIndex("by_offer_time", (q) => q.eq("offerId", args.offerId))
      .order("desc")
      .filter((q) => q.eq(q.field("kind"), "calendar_event"))
      .take(limit);
  },
});

export const listOfferActivities = query({
  args: {
    offerId: v.id("offers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireFactoryBidActor(ctx, "workspace:read");
    await requireDocument(ctx, args.offerId, "offerId");
    return await ctx.db
      .query("activities")
      .withIndex("by_offer_time", (q) => q.eq("offerId", args.offerId))
      .order("desc")
      .take(boundedLimit(args.limit));
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
    const offer = await requireDocument<OfferDocument>(ctx, args.offerId, "offerId");
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
    await requireFactoryBidActor(ctx, "workspace:write");
    await requireDocument(ctx, args.offerId, "offerId");
    if (args.quoteId) {
      await requireDocument(ctx, args.quoteId, "quoteId");
    }
    if (args.rfqId) {
      await requireDocument(ctx, args.rfqId, "rfqId");
    }

    return await ctx.db.insert("activities", {
      offerId: args.offerId,
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
    if (args.rfqId) {
      await requireDocument(ctx, args.rfqId, "rfqId");
    }
    if (args.quoteId) {
      await requireDocument(ctx, args.quoteId, "quoteId");
    }
    if (args.offerId) {
      await requireDocument(ctx, args.offerId, "offerId");
    }

    return await ctx.db.insert("activities", {
      rfqId: args.rfqId,
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

type RfqDocument = Pick<Doc<"rfqs">, "status">;
type RfqStatus = RfqDocument["status"];
type OfferDocument = Pick<Doc<"offers">, "offerNumber" | "quoteId" | "rfqId" | "sentAt" | "status">;

async function requireDocument<T = unknown>(ctx: { db: { get: (id: GenericId<string>) => Promise<T | null> } }, id: GenericId<string>, key: string) {
  const document = await ctx.db.get(id);
  if (!document) {
    throw new Error(`${key} does not exist`);
  }
  return document;
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
