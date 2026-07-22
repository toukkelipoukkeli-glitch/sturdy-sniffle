import { describe, expect, it } from "vitest"

import type { ConnectorSyncPersistenceSnapshot } from "../integrations/connectorSyncPersistence"
import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import type { OfferFollowUpActivityReadinessHistorySummary } from "../offers/offerFollowUpActivityReadinessHistory"
import type { OfferFollowUpActivityReadinessReadModel } from "../offers/offerFollowUpActivityReadinessReadModel"
import {
  buildOfferEmailDraftPackageReadSyncState,
} from "../offers/offerEmailDraftPackageReadSync"
import { buildOfferReleaseProviderOutcomeReadSyncState } from "../offers/offerReleaseProviderOutcomeReadSync"
import {
  buildOfferFollowUpActivityReadinessSyncHealthEvent,
  summarizeOfferFollowUpActivityReadinessSyncHealth,
} from "../offers/offerFollowUpActivityReadinessSyncHealth"
import type { ProviderRunAudit } from "../providers/providerRunAudit"
import type { WorkspaceConvexBridgeHealth, WorkspaceConvexRuntimeConfigHealth } from "./convexBridgeHealth"
import { summarizeWorkspaceIntegrationStatus } from "./integrationStatus"

describe("workspace integration status", () => {
  it("summarizes live connector, provider, reply, and follow-up state", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    expect(status.warningCount).toBe(0)
    expect(status.sources.map((source) => [source.key, source.status, source.severity])).toEqual([
      ["persistence", "convex", "healthy"],
      ["connector", "linked", "healthy"],
      ["provider_runs", "audited", "healthy"],
      ["offer_replies", "matched", "healthy"],
      ["calendar_follow_up", "scheduled", "healthy"],
    ])
  })

  it("surfaces configured optional Convex bridge capability health", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      convexBridgeHealth: {
        availableCapabilityCount: 4,
        capabilities: [
          { configured: true, key: "workspace_writes", label: "workspace writes" },
          { configured: true, key: "provider_run_reads", label: "provider run reads" },
          { configured: true, key: "offer_release_reads", label: "offer release reads" },
          { configured: true, key: "follow_up_activity_reads", label: "follow-up activity reads" },
        ],
        missingCapabilityLabels: [],
        status: "configured",
        totalCapabilityCount: 4,
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    const convexBridgeSource = status.sources.find((source) => source.key === "convex_bridge")
    expect(convexBridgeSource?.actions).toBeUndefined()
    expect(convexBridgeSource).toMatchObject({
      count: 4,
      detail: "4/4 optional Convex bridge capabilities are configured.",
      diagnosticExport: [
        "Convex bridge health",
        "Status: configured",
        "Capabilities configured: 4/4",
        "Capability details:",
        "- workspace writes: configured",
        "- provider run reads: configured",
        "- offer release reads: configured",
        "- follow-up activity reads: configured",
        "Missing capabilities:",
        "- none",
        "Recovery actions:",
        "- none",
      ].join("\n"),
      details: [
        { key: "workspace_writes", label: "workspace writes", status: "configured" },
        { key: "provider_run_reads", label: "provider run reads", status: "configured" },
        { key: "offer_release_reads", label: "offer release reads", status: "configured" },
        { key: "follow_up_activity_reads", label: "follow-up activity reads", status: "configured" },
      ],
      severity: "healthy",
      status: "convex",
    })
  })

  it("surfaces email draft package read-source recovery actions", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      offerEmailDraftPackageReadSync: buildOfferEmailDraftPackageReadSyncState({
        localPackageCount: 1,
        status: "local",
      }),
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded" })],
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    const source = status.sources.find((candidate) => candidate.key === "email_draft_package_reads")
    expect(source).toMatchObject({
      actions: [
        {
          detail: "Configure an optional browser bridge email draft package query before expecting persisted Gmail draft history.",
          key: "configure_email_draft_package_read",
          label: "Configure Convex read",
        },
      ],
      count: 1,
      detail: "1 local email draft package available; Convex email draft package reads are not configured.",
      diagnosticExport: [
        "Email draft package read diagnostics",
        "Status: local",
        "Draft packages: persisted 0, local 1, fallback 0",
        "Detail: 1 local email draft package available; Convex email draft package reads are not configured.",
        "Recovery actions:",
        "- Configure Convex read: Configure an optional browser bridge email draft package query before expecting persisted Gmail draft history.",
      ].join("\n"),
      label: "Email draft package reads",
      severity: "attention",
      status: "local",
    })
  })

  it("surfaces provider outcome read-source recovery actions", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      offerProviderOutcomeReadSync: buildOfferReleaseProviderOutcomeReadSyncState({
        localBatchCount: 1,
        status: "local",
      }),
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded" })],
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    const source = status.sources.find((candidate) => candidate.key === "offer_provider_outcome_reads")
    expect(source).toMatchObject({
      actions: [
        {
          detail: "Configure an optional browser bridge provider outcome query before expecting persisted release side-effect history.",
          key: "configure_provider_outcome_read",
          label: "Configure Convex read",
        },
      ],
      count: 1,
      detail: "1 local provider outcome batch available; Convex provider outcome reads are not configured.",
      diagnosticExport: [
        "Provider outcome read diagnostics",
        "Status: local",
        "Outcome batches: persisted 0, local 1, fallback 0",
        "Detail: 1 local provider outcome batch available; Convex provider outcome reads are not configured.",
        "Recovery actions:",
        "- Configure Convex read: Configure an optional browser bridge provider outcome query before expecting persisted release side-effect history.",
      ].join("\n"),
      label: "Provider outcome reads",
      severity: "attention",
      status: "local",
    })
  })

  it("surfaces public Convex runtime config health separately from bridge capabilities", () => {
    const configured = summarizeWorkspaceIntegrationStatus({
      convexRuntimeConfigHealth: {
        configuredCount: 1,
        entries: [
          {
            configured: true,
            key: "convex_url",
            label: "VITE_CONVEX_URL",
            value: "https://necessary-fly-178.convex.cloud/",
          },
          {
            configured: false,
            key: "convex_site_url",
            label: "VITE_CONVEX_SITE_URL",
          },
        ],
        invalidLabels: [],
        missingLabels: [],
        nextActionLabels: [
          "Install the optional browser bridge with generated Convex refs before enabling persisted reads or writes.",
        ],
        operatorSummary:
          "1/2 public Convex runtime URLs configured; browser bridge can be installed behind the existing fallback boundary.",
        status: "configured",
        totalCount: 2,
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })
    const invalid = summarizeWorkspaceIntegrationStatus({
      convexRuntimeConfigHealth: {
        configuredCount: 0,
        entries: [
          {
            configured: false,
            issue: "invalid URL",
            key: "convex_url",
            label: "VITE_CONVEX_URL",
          },
          {
            configured: false,
            key: "convex_site_url",
            label: "VITE_CONVEX_SITE_URL",
          },
        ],
        invalidLabels: ["VITE_CONVEX_URL"],
        missingLabels: [],
        nextActionLabels: ["Fix malformed public Convex runtime setting: VITE_CONVEX_URL."],
        operatorSummary: "Public Convex runtime config is invalid: VITE_CONVEX_URL.",
        status: "invalid",
        totalCount: 2,
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(configured.sources.find((source) => source.key === "convex_runtime")).toMatchObject({
      actions: [
        {
          detail: "Install the optional browser bridge with generated Convex refs before enabling persisted reads or writes.",
          key: "convex_runtime_next_1",
          label: "Install browser bridge",
        },
      ],
      detail:
        "1/2 public Convex runtime URLs configured; browser bridge can be installed behind the existing fallback boundary.",
      details: [
        { key: "convex_url", label: "VITE_CONVEX_URL", status: "configured" },
        { key: "convex_site_url", label: "VITE_CONVEX_SITE_URL", status: "missing" },
      ],
      severity: "healthy",
      status: "convex",
    })
    expect(invalid.sources.find((source) => source.key === "convex_runtime")).toMatchObject({
      actions: [
        {
          detail: "Fix malformed public Convex runtime setting: VITE_CONVEX_URL.",
          key: "convex_runtime_fix_1",
          label: "Fix runtime config",
        },
      ],
      detail: "Public Convex runtime config is invalid: VITE_CONVEX_URL.",
      details: [
        { key: "convex_url", label: "VITE_CONVEX_URL (invalid URL)", status: "missing" },
        { key: "convex_site_url", label: "VITE_CONVEX_SITE_URL", status: "missing" },
      ],
      severity: "attention",
      status: "review",
    })
  })

  it("surfaces guarded Convex browser bridge install plan readiness", () => {
    const bridgeHealth = {
      availableCapabilityCount: 1,
      availableIdentityMapCount: 1,
      capabilities: [
        { configured: true, key: "workspace_writes", label: "workspace writes" },
        { configured: false, key: "provider_run_reads", label: "provider run reads" },
      ],
      identityMaps: [
        { configured: true, key: "rfq_id_map", label: "RFQ ID map", localIdCount: 1 },
        { configured: false, key: "offer_id_map", label: "offer ID map", localIdCount: 0 },
      ],
      missingCapabilityLabels: ["provider run reads"],
      missingIdentityMapLabels: ["offer ID map"],
      status: "partial" as const,
      totalCapabilityCount: 2,
      totalIdentityMapCount: 2,
    } satisfies WorkspaceConvexBridgeHealth
    const runtimeConfigHealth = {
      configuredCount: 1,
      entries: [
        {
          configured: true,
          key: "convex_url",
          label: "VITE_CONVEX_URL",
          value: "https://necessary-fly-178.convex.cloud/",
        },
        {
          configured: false,
          key: "convex_site_url",
          label: "VITE_CONVEX_SITE_URL",
        },
      ],
      invalidLabels: [],
      missingLabels: [],
      nextActionLabels: [
        "Install the optional browser bridge with generated Convex refs before enabling persisted reads or writes.",
      ],
      operatorSummary:
        "1/2 public Convex runtime URLs configured; browser bridge can be installed behind the existing fallback boundary.",
      status: "configured" as const,
      totalCount: 2,
    } satisfies WorkspaceConvexRuntimeConfigHealth
    const status = summarizeWorkspaceIntegrationStatus({
      convexBridgeHealth: bridgeHealth,
      convexBridgeInstallPlan: {
        blockedReasonLabels: ["provider run reads", "offer ID map"],
        bridgeHealth,
        nextActionLabels: [
          "Wire missing browser bridge refs: provider run reads.",
          "Seed browser bridge identity maps: offer ID map.",
          "Keep local fallback active until runtime config, generated refs, runners, and identity maps are ready together.",
        ],
        operatorSummary:
          "3/6 Convex browser bridge install facts are ready; blocked by provider run reads, offer ID map.",
        readyFactCount: 3,
        runtimeConfigHealth,
        status: "blocked",
        totalFactCount: 6,
      },
      convexRuntimeConfigHealth: runtimeConfigHealth,
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("fallback")
    expect(status.sources.map((source) => source.key)).toEqual([
      "convex_install_plan",
      "persistence",
      "connector",
      "provider_runs",
      "offer_replies",
      "calendar_follow_up",
    ])
    expect(status.sources.find((source) => source.key === "convex_install_plan")).toMatchObject({
      actions: [
        {
          detail: "Wire missing browser bridge refs: provider run reads.",
          key: "convex_install_plan_1",
          label: "Resolve install blocker",
        },
        {
          detail: "Seed browser bridge identity maps: offer ID map.",
          key: "convex_install_plan_2",
          label: "Resolve install blocker",
        },
        {
          detail: "Keep local fallback active until runtime config, generated refs, runners, and identity maps are ready together.",
          key: "convex_install_plan_3",
          label: "Keep fallback active",
        },
      ],
      count: 3,
      detail: "3/6 Convex browser bridge install facts are ready; blocked by provider run reads, offer ID map.",
      details: [
        { key: "runtime_config", label: "Runtime config (1/2)", status: "configured" },
        { key: "bridge_runtime", label: "Bridge refs and identity maps (2/4)", status: "missing" },
      ],
      severity: "attention",
      status: "blocked",
    })
    expect(status.warnings).toContain(
      "Convex bridge install: 3/6 Convex browser bridge install facts are ready; blocked by provider run reads, offer ID map.",
    )
  })

  it("surfaces guarded installer fallback when install facts are ready but opt-in is disabled", () => {
    const bridgeHealth = {
      availableCapabilityCount: 2,
      availableIdentityMapCount: 1,
      capabilities: [
        { configured: true, key: "workspace_writes", label: "workspace writes" },
        { configured: true, key: "provider_run_reads", label: "provider run reads" },
      ],
      identityMaps: [{ configured: true, key: "rfq_id_map", label: "RFQ ID map", localIdCount: 1 }],
      missingCapabilityLabels: [],
      missingIdentityMapLabels: [],
      status: "configured" as const,
      totalCapabilityCount: 2,
      totalIdentityMapCount: 1,
    } satisfies WorkspaceConvexBridgeHealth
    const runtimeConfigHealth = {
      configuredCount: 2,
      entries: [
        {
          configured: true,
          key: "convex_url",
          label: "VITE_CONVEX_URL",
          value: "https://necessary-fly-178.convex.cloud/",
        },
        {
          configured: true,
          key: "convex_site_url",
          label: "VITE_CONVEX_SITE_URL",
          value: "https://factorybid-os.convex.site/",
        },
      ],
      invalidLabels: [],
      missingLabels: [],
      nextActionLabels: ["Install the optional browser bridge with generated Convex refs before enabling persisted reads or writes."],
      operatorSummary:
        "2/2 public Convex runtime URLs configured; browser bridge can be installed behind the existing fallback boundary.",
      status: "configured" as const,
      totalCount: 2,
    } satisfies WorkspaceConvexRuntimeConfigHealth
    const convexBridgeInstallPlan = {
      blockedReasonLabels: [],
      bridgeHealth,
      nextActionLabels: ["Install the optional browser bridge with guarded Convex query and mutation runners."],
      operatorSummary: "5/5 Convex browser bridge install facts are ready; guarded runtime installation can proceed.",
      readyFactCount: 5,
      runtimeConfigHealth,
      status: "ready" as const,
      totalFactCount: 5,
    }
    const status = summarizeWorkspaceIntegrationStatus({
      convexBridgeHealth: bridgeHealth,
      convexBridgeInstallPlan,
      convexBridgeInstallerDecision: {
        blockedReasonLabels: ["VITE_FACTORYBID_ENABLE_CONVEX_BROWSER_BRIDGE disabled"],
        canInstall: true,
        enabled: false,
        installAction: "keep_local_fallback",
        mode: "local",
        nextActionLabels: [
          "Set VITE_FACTORYBID_ENABLE_CONVEX_BROWSER_BRIDGE=true only after generated Convex refs, runners, and identity maps are deployed together.",
          "Keep local fallback active while the optional browser bridge is disabled.",
        ],
        operatorSummary:
          "Convex browser bridge install facts are ready, but the guarded opt-in is disabled; local fallback remains active.",
        status: "fallback",
      },
      convexRuntimeConfigHealth: runtimeConfigHealth,
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.sources.find((source) => source.key === "convex_install_plan")).toMatchObject({
      actions: [
        {
          detail:
            "Set VITE_FACTORYBID_ENABLE_CONVEX_BROWSER_BRIDGE=true only after generated Convex refs, runners, and identity maps are deployed together.",
          key: "convex_install_plan_1",
          label: "Enable guarded bridge",
        },
        {
          detail: "Keep local fallback active while the optional browser bridge is disabled.",
          key: "convex_install_plan_2",
          label: "Keep fallback active",
        },
      ],
      detail: "Convex browser bridge install facts are ready, but the guarded opt-in is disabled; local fallback remains active.",
      details: [
        { key: "runtime_config", label: "Runtime config (2/2)", status: "configured" },
        { key: "bridge_runtime", label: "Bridge refs and identity maps (3/3)", status: "configured" },
        { key: "installer_opt_in", label: "Installer opt-in (disabled)", status: "missing" },
      ],
      severity: "attention",
      status: "fallback",
    })
    expect(status.warnings).toContain(
      "Convex bridge install: Convex browser bridge install facts are ready, but the guarded opt-in is disabled; local fallback remains active.",
    )
  })

  it("surfaces guarded installer ready state when install facts and opt-in are both ready", () => {
    const bridgeHealth = {
      availableCapabilityCount: 1,
      availableIdentityMapCount: 1,
      capabilities: [{ configured: true, key: "workspace_writes", label: "workspace writes" }],
      identityMaps: [{ configured: true, key: "rfq_id_map", label: "RFQ ID map", localIdCount: 1 }],
      missingCapabilityLabels: [],
      missingIdentityMapLabels: [],
      status: "configured" as const,
      totalCapabilityCount: 1,
      totalIdentityMapCount: 1,
    } satisfies WorkspaceConvexBridgeHealth
    const runtimeConfigHealth = {
      configuredCount: 1,
      entries: [
        {
          configured: true,
          key: "convex_url",
          label: "VITE_CONVEX_URL",
          value: "https://necessary-fly-178.convex.cloud/",
        },
        {
          configured: false,
          key: "convex_site_url",
          label: "VITE_CONVEX_SITE_URL",
        },
      ],
      invalidLabels: [],
      missingLabels: [],
      nextActionLabels: ["Install the optional browser bridge with generated Convex refs before enabling persisted reads or writes."],
      operatorSummary:
        "1/2 public Convex runtime URLs configured; browser bridge can be installed behind the existing fallback boundary.",
      status: "configured" as const,
      totalCount: 2,
    } satisfies WorkspaceConvexRuntimeConfigHealth
    const status = summarizeWorkspaceIntegrationStatus({
      convexBridgeHealth: bridgeHealth,
      convexBridgeInstallPlan: {
        blockedReasonLabels: [],
        bridgeHealth,
        nextActionLabels: ["Install the optional browser bridge with guarded Convex query and mutation runners."],
        operatorSummary: "3/4 Convex browser bridge install facts are ready; guarded runtime installation can proceed.",
        readyFactCount: 3,
        runtimeConfigHealth,
        status: "ready",
        totalFactCount: 4,
      },
      convexBridgeInstallerDecision: {
        blockedReasonLabels: [],
        canInstall: true,
        enabled: true,
        installAction: "install_guarded_bridge",
        mode: "convex",
        nextActionLabels: [
          "Install the optional browser bridge with guarded Convex query and mutation runners.",
          "Keep local fallback and sync-error telemetry attached after installation.",
        ],
        operatorSummary:
          "Convex browser bridge install facts are ready and explicitly enabled; guarded runtime installation can proceed.",
        status: "ready",
      },
      convexRuntimeConfigHealth: runtimeConfigHealth,
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.warningCount).toBe(0)
    expect(status.sources.find((source) => source.key === "convex_install_plan")).toMatchObject({
      actions: [
        {
          detail: "Install the optional browser bridge with guarded Convex query and mutation runners.",
          key: "convex_install_plan_1",
          label: "Install guarded bridge",
        },
        {
          detail: "Keep local fallback and sync-error telemetry attached after installation.",
          key: "convex_install_plan_2",
          label: "Keep fallback active",
        },
      ],
      detail: "Convex browser bridge install facts are ready and explicitly enabled; guarded runtime installation can proceed.",
      details: [
        { key: "runtime_config", label: "Runtime config (1/2)", status: "configured" },
        { key: "bridge_runtime", label: "Bridge refs and identity maps (2/2)", status: "configured" },
        { key: "installer_opt_in", label: "Installer opt-in (enabled)", status: "configured" },
      ],
      severity: "healthy",
      status: "ready",
    })
  })

  it("surfaces missing and partial optional Convex bridge capability health", () => {
    const missing = summarizeWorkspaceIntegrationStatus({
      convexBridgeHealth: {
        availableCapabilityCount: 0,
        capabilities: [
          { configured: false, key: "workspace_writes", label: "workspace writes" },
          { configured: false, key: "provider_run_reads", label: "provider run reads" },
        ],
        missingCapabilityLabels: ["workspace writes", "provider run reads"],
        status: "missing",
        totalCapabilityCount: 2,
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })
    const partial = summarizeWorkspaceIntegrationStatus({
      convexBridgeHealth: {
        availableCapabilityCount: 1,
        capabilities: [
          { configured: true, key: "workspace_writes", label: "workspace writes" },
          { configured: false, key: "provider_run_reads", label: "provider run reads" },
          { configured: false, key: "offer_release_reads", label: "offer release reads" },
          { configured: false, key: "follow_up_activity_reads", label: "follow-up activity reads" },
          { configured: false, key: "follow_up_readiness_writes", label: "follow-up readiness writes" },
        ],
        missingCapabilityLabels: [
          "provider run reads",
          "offer release reads",
          "follow-up activity reads",
          "follow-up readiness writes",
        ],
        status: "partial",
        totalCapabilityCount: 5,
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(missing.status).toBe("fallback")
    expect(missing.sources.find((source) => source.key === "convex_bridge")).toMatchObject({
      actions: [
        {
          detail:
            "Expose browser bridge refs plus runQuery/runMutation before expecting persisted workspace reads or writes.",
          key: "configure_bridge",
          label: "Configure Convex bridge",
        },
        {
          detail: "Keep local fallback paths visible until bridge health reports configured.",
          key: "keep_local_fallback",
          label: "Keep local fallback",
        },
      ],
      count: 0,
      detail: "No optional browser Convex bridge is configured; workspace uses local fallback paths.",
      diagnosticExport: [
        "Convex bridge health",
        "Status: missing",
        "Capabilities configured: 0/2",
        "Capability details:",
        "- workspace writes: missing",
        "- provider run reads: missing",
        "Missing capabilities:",
        "- workspace writes",
        "- provider run reads",
        "Recovery actions:",
        "- Configure Convex bridge: Expose browser bridge refs plus runQuery/runMutation before expecting persisted workspace reads or writes.",
        "- Keep local fallback: Keep local fallback paths visible until bridge health reports configured.",
      ].join("\n"),
      details: [
        { key: "workspace_writes", label: "workspace writes", status: "missing" },
        { key: "provider_run_reads", label: "provider run reads", status: "missing" },
      ],
      severity: "attention",
      status: "local",
    })
    expect(partial.status).toBe("attention")
    expect(partial.sources.find((source) => source.key === "convex_bridge")).toMatchObject({
      actions: [
        {
          detail: "Wire provider run reads, offer release reads, follow-up activity reads, and 1 more in the optional browser bridge.",
          key: "wire_missing_capabilities",
          label: "Add missing bridge refs",
        },
        {
          detail: "Keep local fallback paths visible until bridge health reports configured.",
          key: "keep_local_fallback",
          label: "Keep local fallback",
        },
      ],
      count: 1,
      detail:
        "1/5 optional Convex bridge capabilities are configured; missing provider run reads, offer release reads, follow-up activity reads, and 1 more.",
      diagnosticExport: [
        "Convex bridge health",
        "Status: partial",
        "Capabilities configured: 1/5",
        "Capability details:",
        "- workspace writes: configured",
        "- provider run reads: missing",
        "- offer release reads: missing",
        "- follow-up activity reads: missing",
        "- follow-up readiness writes: missing",
        "Missing capabilities:",
        "- provider run reads",
        "- offer release reads",
        "- follow-up activity reads",
        "- follow-up readiness writes",
        "Recovery actions:",
        "- Add missing bridge refs: Wire provider run reads, offer release reads, follow-up activity reads, and 1 more in the optional browser bridge.",
        "- Keep local fallback: Keep local fallback paths visible until bridge health reports configured.",
      ].join("\n"),
      details: [
        { key: "workspace_writes", label: "workspace writes", status: "configured" },
        { key: "provider_run_reads", label: "provider run reads", status: "missing" },
        { key: "offer_release_reads", label: "offer release reads", status: "missing" },
        { key: "follow_up_activity_reads", label: "follow-up activity reads", status: "missing" },
        { key: "follow_up_readiness_writes", label: "follow-up readiness writes", status: "missing" },
      ],
      severity: "attention",
      status: "review",
    })
  })

  it("surfaces Convex bridge identity-map readiness in details and diagnostics", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      convexBridgeHealth: {
        availableCapabilityCount: 7,
        availableIdentityMapCount: 1,
        capabilities: [
          { configured: true, key: "workspace_writes", label: "workspace writes" },
          { configured: true, key: "provider_run_reads", label: "provider run reads" },
          { configured: true, key: "offer_release_reads", label: "offer release reads" },
          { configured: true, key: "follow_up_activity_reads", label: "follow-up activity reads" },
          { configured: true, key: "follow_up_readiness_writes", label: "follow-up readiness writes" },
          {
            configured: true,
            key: "provider_outcome_readiness_writes",
            label: "provider outcome readiness writes",
          },
          { configured: true, key: "offer_reply_writes", label: "offer reply writes" },
        ],
        identityMaps: [
          { configured: true, key: "rfq_id_map", label: "RFQ ID map", localIdCount: 2 },
          { configured: false, key: "offer_id_map", label: "offer ID map", localIdCount: 0 },
          { configured: false, key: "quote_id_map", label: "quote ID map", localIdCount: 0 },
        ],
        missingCapabilityLabels: [],
        missingIdentityMapLabels: ["offer ID map", "quote ID map"],
        status: "partial",
        totalCapabilityCount: 7,
        totalIdentityMapCount: 3,
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    const convexBridgeSource = status.sources.find((source) => source.key === "convex_bridge")
    expect(convexBridgeSource).toMatchObject({
      actions: [
        {
          detail: "Wire offer ID map, quote ID map in the optional browser bridge.",
          key: "wire_missing_capabilities",
          label: "Add missing bridge refs",
        },
        {
          detail: "Keep local fallback paths visible until bridge health reports configured.",
          key: "keep_local_fallback",
          label: "Keep local fallback",
        },
      ],
      detail: "7/7 optional Convex bridge capabilities are configured; missing offer ID map, quote ID map.",
      severity: "attention",
      status: "review",
    })
    expect(convexBridgeSource?.details?.slice(-3)).toEqual([
      { key: "rfq_id_map", label: "RFQ ID map (2 local IDs)", status: "configured" },
      { key: "offer_id_map", label: "offer ID map (0 local IDs)", status: "missing" },
      { key: "quote_id_map", label: "quote ID map (0 local IDs)", status: "missing" },
    ])
    expect(convexBridgeSource?.diagnosticExport).toContain("Identity maps:")
    expect(convexBridgeSource?.diagnosticExport).toContain("- RFQ ID map: configured (2 local IDs)")
    expect(convexBridgeSource?.diagnosticExport).toContain("Missing identity maps:\n- offer ID map\n- quote ID map")
  })

  it("marks local and stale integration paths as fallback while preserving counts", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("stale"),
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded", warnings: ["Used mock fallback."] })],
      replySync: replySync({ matched: false, status: "fallback" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("fallback")
    expect(status.warningCount).toBe(5)
    expect(status.sources.find((source) => source.key === "connector")).toMatchObject({
      count: 2,
      severity: "attention",
      status: "stale",
    })
    expect(status.warnings).toContain("Persistence: Workspace writes are kept in local fallback storage.")
    expect(status.warnings).toContain("Calendar follow-up: No offer follow-up calendar hold is scheduled yet.")
  })

  it("escalates blocked connector, provider, and reply failures", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("blocked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "failed" })],
      replySync: replySync({ matched: false, status: "failed" }),
      rfqId: "rfq-204",
      syncErrorCount: 2,
    })

    expect(status.status).toBe("blocked")
    expect(status.warningCount).toBe(4)
    expect(status.sources.filter((source) => source.severity === "blocked").map((source) => source.key)).toEqual([
      "connector",
      "provider_runs",
      "offer_replies",
    ])
  })

  it("keeps connector sync failures separate from persistence fallback health", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorErrorCount: 1,
      connectorSnapshot: { payloads: [], syncCount: 0 },
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("blocked")
    expect(status.sources.find((source) => source.key === "persistence")).toMatchObject({
      severity: "healthy",
      status: "convex",
    })
    expect(status.sources.find((source) => source.key === "connector")).toMatchObject({
      count: 1,
      severity: "blocked",
      status: "failed",
    })
    expect(status.warnings).not.toContain("Persistence: Workspace writes are routed through Convex.")
  })

  it("surfaces follow-up readiness sync health on the persistence source", () => {
    const syncHealth = summarizeOfferFollowUpActivityReadinessSyncHealth(
      [
        buildOfferFollowUpActivityReadinessSyncHealthEvent({
          offerId: "offer-204",
          operation: "read",
          recordedAt: "2026-06-18T05:00:00.000Z",
          rfqId: "rfq-204",
        }),
        buildOfferFollowUpActivityReadinessSyncHealthEvent({
          nonce: "write",
          offerId: "offer-204",
          operation: "write",
          recordedAt: "2026-06-18T05:10:00.000Z",
          rfqId: "rfq-204",
        }),
      ],
      { now: "2026-06-20T06:00:00.000Z" },
    )

    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpReadinessReadModel: followUpReadinessReadModel({
        nextActionLabels: ["Check Convex readiness reads before trusting remote follow-up history."],
        status: "fallback",
      }),
      followUpReadinessSyncHealth: syncHealth,
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 2,
    })

    expect(status.status).toBe("blocked")
    expect(status.sources.find((source) => source.key === "persistence")).toMatchObject({
      count: 2,
      detail: "2 follow-up readiness persistence fallbacks recorded (read 1, write 1); latest fallback is stale.",
      actions: [
        {
          detail: "Check Convex readiness reads before trusting remote follow-up history.",
          key: "follow_up_readiness_read_1",
          label: "Recover readiness reads",
        },
      ],
      diagnosticExport: [
        "Follow-up readiness persisted read: fallback",
        "Source: none",
        "Sync health: healthy",
        "Records: 0",
        "Persisted read enabled: no",
        "Summary: No current follow-up readiness record is available across 0 persisted record(s).",
        "Next actions: Check Convex readiness reads before trusting remote follow-up history.",
      ].join("\n"),
      severity: "blocked",
      status: "stale",
    })
    expect(status.warnings).toContain(
      "Persistence: 2 follow-up readiness persistence fallbacks recorded (read 1, write 1); latest fallback is stale.",
    )
  })

  it("surfaces ready follow-up readiness persisted reads on the persistence source", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpReadinessReadModel: followUpReadinessReadModel({
        canUsePersistedRead: true,
        nextActionLabels: ["Use persisted follow-up readiness to avoid duplicate follow-up activity writes."],
        source: "convex",
        status: "ready",
        totalReadinessRecords: 2,
      }),
      followUpReadinessHistory: followUpReadinessHistory({
        totalReadinessRecords: 2,
      }),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    expect(status.sources.find((source) => source.key === "persistence")).toMatchObject({
      actions: [
        {
          detail: "Use persisted follow-up readiness to avoid duplicate follow-up activity writes.",
          key: "follow_up_readiness_read_1",
          label: "Use persisted readiness",
        },
      ],
      diagnosticExport: [
        "Follow-up readiness persisted read: ready",
        "Source: convex",
        "Sync health: healthy",
        "Records: 2",
        "Persisted read enabled: yes",
        "Summary: No current follow-up readiness record is available across 0 persisted record(s).",
        "Next actions: Use persisted follow-up readiness to avoid duplicate follow-up activity writes.",
        "",
        "Follow-up readiness history: offer-follow-up-activity-readiness-history.v1",
        "Records: total 2, recorded 1, partial 0, pending 1, review 0",
        "Task gaps: missing 0, unexpected 0, unmatched activity 0",
        "Latest recorded at: 2026-07-03T07:10:00.000Z",
        "Current readiness: recorded 1/1 tasks readiness:offer-204:recorded",
      ].join("\n"),
      detail: "Workspace writes are routed through Convex. Follow-up persisted read is ready from convex with 2 readiness records.",
      severity: "healthy",
      status: "convex",
    })
  })

  it("surfaces Convex provider-run read health on the provider source", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRunReadSync: {
        fallbackCount: 0,
        localRunCount: 1,
        persistedRunCount: 1,
        status: "convex",
      },
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    expect(status.sources.find((source) => source.key === "provider_runs")).toMatchObject({
      count: 1,
      detail: "1 persisted provider audit read from Convex and merged with 1 local audit.",
      severity: "healthy",
      status: "convex",
    })
  })

  it("surfaces provider-run read fallback health on the provider source", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRunReadSync: {
        fallbackCount: 1,
        localRunCount: 1,
        persistedRunCount: 0,
        status: "fallback",
      },
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("fallback")
    expect(status.sources.find((source) => source.key === "provider_runs")).toMatchObject({
      count: 1,
      detail: "Provider run history fell back to 1 local audit after a Convex read failure.",
      severity: "attention",
      status: "fallback",
    })
    expect(status.warnings).toContain(
      "Provider runs: Provider run history fell back to 1 local audit after a Convex read failure.",
    )
  })

  it("surfaces Convex release execution read health as a separate source", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      offerReleaseExecutionReadSync: {
        fallbackCount: 0,
        localRunCount: 1,
        persistedRunCount: 2,
        status: "convex",
      },
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    expect(status.sources.find((source) => source.key === "offer_release_execution_reads")).toMatchObject({
      actions: [
        {
          detail:
            "Use persisted release execution runs when reviewing release audits; keep local fallback runs visible for comparison.",
          key: "review_convex_release_executions",
          label: "Review Convex executions",
        },
      ],
      count: 2,
      detail: "2 persisted release execution runs read from Convex and merged with 1 local fallback run.",
      diagnosticExport: [
        "Release execution read diagnostics",
        "Status: convex",
        "Runs: persisted 2, local 1, fallback 0",
        "Detail: 2 persisted release execution runs read from Convex and merged with 1 local fallback run.",
        "Recovery actions:",
        "- Review Convex executions: Use persisted release execution runs when reviewing release audits; keep local fallback runs visible for comparison.",
      ].join("\n"),
      label: "Release execution reads",
      severity: "healthy",
      status: "convex",
    })
  })

  it("keeps pending release execution reads actionable without marking them healthy", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      offerReleaseExecutionReadSync: {
        fallbackCount: 0,
        localRunCount: 2,
        persistedRunCount: 0,
        status: "pending",
      },
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("attention")
    expect(status.sources.find((source) => source.key === "offer_release_execution_reads")).toMatchObject({
      actions: [
        {
          detail: "Keep local fallback release execution runs visible while the optional Convex execution query is still loading.",
          key: "wait_for_release_execution_read",
          label: "Wait for read result",
        },
      ],
      count: 2,
      detail: "Checking Convex release execution history; 2 local fallback runs remain visible.",
      label: "Release execution reads",
      severity: "attention",
      status: "pending",
    })
  })

  it("surfaces release execution read fallbacks as integration warnings", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      offerReleaseExecutionReadSync: {
        fallbackCount: 1,
        localRunCount: 2,
        persistedRunCount: 0,
        status: "fallback",
      },
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("fallback")
    expect(status.sources.find((source) => source.key === "offer_release_execution_reads")).toMatchObject({
      actions: [
        {
          detail:
            "Keep local release execution runs visible and retry the optional Convex read before committing more release actions.",
          key: "retry_release_execution_read",
          label: "Retry execution read",
        },
      ],
      count: 1,
      detail: "Release execution history fell back to 2 local release runs after a Convex read failure.",
      label: "Release execution reads",
      severity: "attention",
      status: "fallback",
    })
    expect(status.warnings).toContain(
      "Release execution reads: Release execution history fell back to 2 local release runs after a Convex read failure.",
    )
  })

  it("surfaces Convex calendar provider outcome read health as a separate source", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      calendarProviderOutcomeReadSync: {
        fallbackCount: 0,
        localBatchCount: 0,
        persistedBatchCount: 1,
        status: "convex",
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    expect(status.sources.find((source) => source.key === "calendar_provider_outcome_reads")).toMatchObject({
      actions: [
        {
          detail:
            "Use persisted calendar provider outcome batches when reviewing reschedule execution audits; keep local fallback batches visible for comparison.",
          key: "review_convex_calendar_outcomes",
          label: "Review Convex outcomes",
        },
      ],
      count: 1,
      detail: "1 persisted calendar provider outcome batch read from Convex and merged with 0 local fallback batches.",
      diagnosticExport: [
        "Calendar provider outcome read diagnostics",
        "Status: convex",
        "Batches: persisted 1, local 0, fallback 0",
        "Detail: 1 persisted calendar provider outcome batch read from Convex and merged with 0 local fallback batches.",
        "Recovery actions:",
        "- Review Convex outcomes: Use persisted calendar provider outcome batches when reviewing reschedule execution audits; keep local fallback batches visible for comparison.",
      ].join("\n"),
      label: "Calendar outcome reads",
      severity: "healthy",
      status: "convex",
    })
  })

  it("surfaces local calendar provider outcome read setup actions", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      calendarProviderOutcomeReadSync: {
        fallbackCount: 0,
        localBatchCount: 1,
        persistedBatchCount: 0,
        status: "local",
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("fallback")
    expect(status.sources.find((source) => source.key === "calendar_provider_outcome_reads")).toMatchObject({
      actions: [
        {
          detail:
            "Configure the optional browser bridge calendar outcome query before expecting persisted calendar provider outcome history.",
          key: "configure_calendar_outcome_read",
          label: "Configure Convex read",
        },
      ],
      count: 1,
      detail: "1 local calendar provider outcome batch available; Convex calendar provider outcome reads are not configured.",
      diagnosticExport: [
        "Calendar provider outcome read diagnostics",
        "Status: local",
        "Batches: persisted 0, local 1, fallback 0",
        "Detail: 1 local calendar provider outcome batch available; Convex calendar provider outcome reads are not configured.",
        "Recovery actions:",
        "- Configure Convex read: Configure the optional browser bridge calendar outcome query before expecting persisted calendar provider outcome history.",
      ].join("\n"),
      label: "Calendar outcome reads",
      severity: "attention",
      status: "local",
    })
  })

  it("keeps pending calendar provider outcome reads actionable without marking them healthy", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      calendarProviderOutcomeReadSync: {
        fallbackCount: 0,
        localBatchCount: 1,
        persistedBatchCount: 0,
        status: "pending",
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("attention")
    expect(status.sources.find((source) => source.key === "calendar_provider_outcome_reads")).toMatchObject({
      actions: [
        {
          detail:
            "Keep local fallback batches visible while the optional Convex calendar provider outcome query is still loading.",
          key: "wait_for_calendar_outcome_read",
          label: "Wait for read result",
        },
      ],
      count: 1,
      detail: "Checking Convex calendar provider outcome history; 1 local fallback batch remains visible.",
      diagnosticExport: [
        "Calendar provider outcome read diagnostics",
        "Status: pending",
        "Batches: persisted 0, local 1, fallback 0",
        "Detail: Checking Convex calendar provider outcome history; 1 local fallback batch remains visible.",
        "Recovery actions:",
        "- Wait for read result: Keep local fallback batches visible while the optional Convex calendar provider outcome query is still loading.",
      ].join("\n"),
      label: "Calendar outcome reads",
      severity: "attention",
      status: "pending",
    })
  })

  it("surfaces calendar provider outcome read fallbacks as integration warnings", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      calendarProviderOutcomeReadSync: {
        fallbackCount: 1,
        localBatchCount: 2,
        persistedBatchCount: 0,
        status: "fallback",
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("fallback")
    expect(status.sources.find((source) => source.key === "calendar_provider_outcome_reads")).toMatchObject({
      actions: [
        {
          detail:
            "Keep local calendar provider outcome batches visible and retry the optional Convex read before committing provider-side calendar changes.",
          key: "retry_calendar_outcome_read",
          label: "Retry outcome read",
        },
      ],
      count: 1,
      detail: "Calendar provider outcome history fell back to 2 local calendar provider outcome batches after a Convex read failure.",
      diagnosticExport: [
        "Calendar provider outcome read diagnostics",
        "Status: fallback",
        "Batches: persisted 0, local 2, fallback 1",
        "Detail: Calendar provider outcome history fell back to 2 local calendar provider outcome batches after a Convex read failure.",
        "Recovery actions:",
        "- Retry outcome read: Keep local calendar provider outcome batches visible and retry the optional Convex read before committing provider-side calendar changes.",
      ].join("\n"),
      label: "Calendar outcome reads",
      severity: "attention",
      status: "fallback",
    })
    expect(status.warnings).toContain(
      "Calendar outcome reads: Calendar provider outcome history fell back to 2 local calendar provider outcome batches after a Convex read failure.",
    )
  })

  it("surfaces provider readiness read health as a separate source", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerReadinessReadSync: {
        fallbackCount: 0,
        localRecordCount: 0,
        persistedRecordCount: 2,
        status: "convex",
      },
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    expect(status.sources.find((source) => source.key === "provider_readiness_reads")).toMatchObject({
      actions: [
        {
          detail:
            "Use persisted provider readiness records when reviewing release execution gates; keep local fallback records visible for comparison.",
          key: "review_convex_provider_readiness",
          label: "Review Convex readiness",
        },
      ],
      count: 2,
      detail: "2 persisted provider readiness records read from Convex and merged with 0 local fallback records.",
      diagnosticExport: [
        "Provider readiness read diagnostics",
        "Status: convex",
        "Records: persisted 2, local 0, fallback 0",
        "Detail: 2 persisted provider readiness records read from Convex and merged with 0 local fallback records.",
        "Recovery actions:",
        "- Review Convex readiness: Use persisted provider readiness records when reviewing release execution gates; keep local fallback records visible for comparison.",
      ].join("\n"),
      label: "Provider readiness reads",
      severity: "healthy",
      status: "convex",
    })
  })

  it("keeps pending provider readiness reads actionable without marking them healthy", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerReadinessReadSync: {
        fallbackCount: 0,
        localRecordCount: 1,
        persistedRecordCount: 0,
        status: "pending",
      },
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("attention")
    expect(status.sources.find((source) => source.key === "provider_readiness_reads")).toMatchObject({
      actions: [
        {
          detail: "Keep local fallback readiness records visible while the optional Convex provider readiness query is still loading.",
          key: "wait_for_provider_readiness_read",
          label: "Wait for read result",
        },
      ],
      count: 1,
      detail: "Checking Convex provider readiness history; 1 local fallback record remains visible.",
      label: "Provider readiness reads",
      severity: "attention",
      status: "pending",
    })
  })

  it("surfaces provider readiness read fallbacks as integration warnings", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerReadinessReadSync: {
        fallbackCount: 1,
        localRecordCount: 2,
        persistedRecordCount: 0,
        status: "fallback",
      },
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("fallback")
    expect(status.sources.find((source) => source.key === "provider_readiness_reads")).toMatchObject({
      actions: [
        {
          detail:
            "Keep local provider readiness records visible and retry the optional Convex read before committing provider-side release actions.",
          key: "retry_provider_readiness_read",
          label: "Retry readiness read",
        },
      ],
      count: 1,
      detail: "Provider readiness history fell back to 2 local readiness records after a Convex read failure.",
      label: "Provider readiness reads",
      severity: "attention",
      status: "fallback",
    })
    expect(status.warnings).toContain(
      "Provider readiness reads: Provider readiness history fell back to 2 local readiness records after a Convex read failure.",
    )
  })

  it("surfaces Convex follow-up activity read health as a separate source", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpActivityReadSync: {
        fallbackCount: 0,
        localActivityCount: 0,
        persistedActivityCount: 2,
        status: "convex",
      },
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    expect(status.sources.find((source) => source.key === "follow_up_activity_reads")).toMatchObject({
      actions: [
        {
          detail:
            "Use persisted follow-up activity records when reviewing follow-up readiness; keep local fallback records visible for comparison.",
          key: "review_convex_follow_up_activities",
          label: "Review Convex activities",
        },
      ],
      count: 2,
      detail: "2 persisted follow-up activities read from Convex and merged with 0 local fallback activities.",
      diagnosticExport: [
        "Follow-up activity read diagnostics",
        "Status: convex",
        "Activities: persisted 2, local 0, fallback 0",
        "Detail: 2 persisted follow-up activities read from Convex and merged with 0 local fallback activities.",
        "Recovery actions:",
        "- Review Convex activities: Use persisted follow-up activity records when reviewing follow-up readiness; keep local fallback records visible for comparison.",
      ].join("\n"),
      label: "Follow-up activity reads",
      severity: "healthy",
      status: "convex",
    })
  })

  it("keeps pending follow-up activity reads actionable without marking them healthy", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpActivityReadSync: {
        fallbackCount: 0,
        localActivityCount: 1,
        persistedActivityCount: 0,
        status: "pending",
      },
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("attention")
    expect(status.sources.find((source) => source.key === "follow_up_activity_reads")).toMatchObject({
      actions: [
        {
          detail: "Keep local fallback follow-up activity records visible while the optional Convex activity query is still loading.",
          key: "wait_for_follow_up_activity_read",
          label: "Wait for read result",
        },
      ],
      count: 1,
      detail: "Checking Convex follow-up activity history; 1 local fallback activity remains visible.",
      label: "Follow-up activity reads",
      severity: "attention",
      status: "pending",
    })
  })

  it("surfaces follow-up activity read fallbacks as integration warnings", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpActivityReadSync: {
        fallbackCount: 1,
        localActivityCount: 2,
        persistedActivityCount: 0,
        status: "fallback",
      },
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("fallback")
    expect(status.sources.find((source) => source.key === "follow_up_activity_reads")).toMatchObject({
      actions: [
        {
          detail:
            "Keep local follow-up activity records visible and retry the optional Convex read before committing follow-up lifecycle actions.",
          key: "retry_follow_up_activity_read",
          label: "Retry activity read",
        },
      ],
      count: 1,
      detail: "Follow-up activity history fell back to 2 local follow-up activities after a Convex read failure.",
      label: "Follow-up activity reads",
      severity: "attention",
      status: "fallback",
    })
    expect(status.warnings).toContain(
      "Follow-up activity reads: Follow-up activity history fell back to 2 local follow-up activities after a Convex read failure.",
    )
  })
})

function connectorSnapshot(syncStatus: "linked" | "stale" | "blocked"): ConnectorSyncPersistenceSnapshot {
  return {
    payloads: [
      {
        activities: [
          {
            kind: "email_received",
            message: "Synced Gmail RFQ thread-001:msg-001.",
            rfqId: "rfq-204",
          },
        ],
        links: [
          {
            externalId: "thread-001:msg-001",
            provider: "gmail",
            rfqId: "rfq-204",
            syncStatus,
          },
          {
            externalId: "event-001",
            provider: "calendar",
            rfqId: "rfq-204",
            syncStatus,
          },
        ],
      },
    ],
    syncCount: 1,
  }
}

function followUpReadinessHistory(
  overrides: Partial<OfferFollowUpActivityReadinessHistorySummary> = {},
): OfferFollowUpActivityReadinessHistorySummary {
  return {
    currentReadiness: {
      expectedTaskCount: 1,
      missingTaskCount: 0,
      nextActionCount: 0,
      offerId: "offer-204",
      readinessKey: "readiness:offer-204:recorded",
      readinessVersion: "offer-follow-up-activity-readiness.v1",
      recordedAt: "2026-07-03T07:10:00.000Z",
      recordedTaskCount: 1,
      rfqId: "rfq-204",
      status: "recorded",
      totalActivities: 1,
      unexpectedTaskCount: 0,
      unmatchedActivityCount: 0,
    },
    historyVersion: "offer-follow-up-activity-readiness-history.v1",
    latestRecordedAt: "2026-07-03T07:10:00.000Z",
    missingTaskTotal: 0,
    partialRecordCount: 0,
    pendingRecordCount: 1,
    recordedRecordCount: 1,
    reviewRecordCount: 0,
    statusCounts: { pending: 1, recorded: 1 },
    totalReadinessRecords: 2,
    unexpectedTaskTotal: 0,
    unmatchedActivityTotal: 0,
    ...overrides,
  }
}

function followUpReadinessReadModel(
  overrides: Partial<OfferFollowUpActivityReadinessReadModel> = {},
): OfferFollowUpActivityReadinessReadModel {
  return {
    blockerLabels: [],
    canUsePersistedRead: false,
    nextActionLabels: [],
    operatorSummary: "No current follow-up readiness record is available across 0 persisted record(s).",
    readModelVersion: "offer-follow-up-activity-readiness-read-model.v1",
    source: "none",
    status: "pending",
    syncHealthStatus: "healthy",
    totalReadinessRecords: 0,
    warningLabels: [],
    ...overrides,
  }
}

function providerAudit({
  status,
  warnings = [],
}: {
  status: ProviderRunAudit["status"]
  warnings?: string[]
}): ProviderRunAudit {
  return {
    adapterVersion: "provider-adapter.v1.mock",
    auditVersion: "provider-run-audit.v1",
    completedAt: "2026-06-20T06:00:01.000Z",
    durationMs: 1000,
    inputHash: "hash-001",
    metadata: {},
    promptExcerpt: "Summarize RFQ.",
    provider: "mock",
    purpose: "summarize",
    runKey: `summarize:mock:hash-001:${status}`,
    startedAt: "2026-06-20T06:00:00.000Z",
    status,
    warnings,
  }
}

function replySync({
  matched,
  status,
}: {
  matched: boolean
  status: GmailOfferReplySyncResult["status"]
}): GmailOfferReplySyncResult {
  return {
    adapterVersion: "gmail-offer-reply.v1",
    offerNumber: "OFFER-204",
    provider: status === "succeeded" ? "gmail" : "mock",
    query: "offer OFFER-204",
    records: [
      {
        message: {
          id: "msg-001",
          plainText: matched ? "We accept offer OFFER-204." : "Thanks for the update.",
          receivedAt: "2026-06-20T07:00:00.000Z",
          subject: "Re: OFFER-204",
        },
        parsed: {
          adapterVersion: "gmail-offer-reply.v1",
          matched,
          messageId: "msg-001",
          offerNumber: "OFFER-204",
          warnings: matched ? [] : ["Message msg-001 does not mention offer OFFER-204."],
        },
      },
    ],
    status,
    warnings: status === "fallback" ? ["Used mock offer reply fallback."] : [],
  }
}
