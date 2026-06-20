import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

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

const defaultLimit = 50;

export const listRfqQueue = query({
  args: {
    status: v.optional(rfqStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rfqId, {
      status: args.status,
      updatedAt: args.updatedAt,
    });
    return args.rfqId;
  },
});

export const listQuoteScenariosByRfq = query({
  args: {
    rfqId: v.id("rfqs"),
  },
  handler: async (ctx, args) => {
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
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const title = nonBlank(args.title, "title");
    return await ctx.db.insert("quoteScenarios", {
      rfqId: args.rfqId,
      title,
      status: args.status,
      revision: positiveInteger(args.revision, "revision"),
      currency: args.currency,
      leadTimeDays: positiveInteger(args.leadTimeDays, "leadTimeDays"),
      validUntil: args.validUntil,
      createdAt: args.now,
      updatedAt: args.now,
    });
  },
});

export const processWorkloadBuckets = query({
  args: {
    process: v.optional(processKey),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_offer_time", (q) => q.eq("offerId", args.offerId))
      .order("desc")
      .take(boundedLimit(args.limit));

    return activities.filter((activity) => activity.kind === "calendar_event");
  },
});

export const createOfferFollowUpActivity = mutation({
  args: {
    offerId: v.id("offers"),
    quoteId: v.optional(v.id("quoteScenarios")),
    rfqId: v.optional(v.id("rfqs")),
    actorName: v.optional(v.string()),
    message: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      offerId: args.offerId,
      quoteId: args.quoteId,
      rfqId: args.rfqId,
      actorType: "system",
      actorName: args.actorName,
      kind: "calendar_event",
      message: nonBlank(args.message, "message"),
      createdAt: args.createdAt,
    });
  },
});

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
