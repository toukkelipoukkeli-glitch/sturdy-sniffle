export type FactoryBidPermission = "workspace:read" | "workspace:write" | "admin:write";
export type FactoryBidRole = "viewer" | "operator" | "admin";

export interface FactoryBidIdentity {
  email?: string;
  name?: string;
  subject?: string;
  tokenIdentifier?: string;
  orgId?: string;
  publicMetadata?: Record<string, unknown>;
  role?: string;
  factorybidRole?: string;
  factorybidTenantId?: string;
}

export interface FactoryBidActor {
  displayName: string;
  role: FactoryBidRole;
  subject: string;
  tenantId: string;
}

export interface FactoryBidAuthzOptions {
  defaultRole?: FactoryBidRole;
  defaultTenantId?: string;
}

const defaultTenantId = "factorybid-single-tenant";
const permissionByRole: Record<FactoryBidRole, Set<FactoryBidPermission>> = {
  admin: new Set(["admin:write", "workspace:read", "workspace:write"]),
  operator: new Set(["workspace:read", "workspace:write"]),
  viewer: new Set(["workspace:read"]),
};

export async function requireFactoryBidActor(
  ctx: { auth: { getUserIdentity: () => Promise<FactoryBidIdentity | null> } },
  permission: FactoryBidPermission,
  options: FactoryBidAuthzOptions = {},
): Promise<FactoryBidActor> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("authentication required");
  }

  const actor = resolveFactoryBidActor(identity, options);
  if (!permissionByRole[actor.role].has(permission)) {
    throw new Error(`permission ${permission} requires a higher FactoryBid role`);
  }
  return actor;
}

export function resolveFactoryBidActor(
  identity: FactoryBidIdentity,
  options: FactoryBidAuthzOptions = {},
): FactoryBidActor {
  const metadata = identity.publicMetadata ?? {};
  const role = normalizeRole(
    identity.factorybidRole ?? stringClaim(metadata.factorybidRole) ?? identity.role ?? stringClaim(metadata.role),
    options.defaultRole ?? "operator",
  );
  const tenantId =
    nonBlank(identity.factorybidTenantId) ??
    stringClaim(metadata.factorybidTenantId) ??
    nonBlank(identity.orgId) ??
    options.defaultTenantId ??
    defaultTenantId;
  const subject = nonBlank(identity.subject) ?? nonBlank(identity.tokenIdentifier) ?? nonBlank(identity.email);
  if (!subject) {
    throw new Error("authenticated identity must include a stable subject");
  }

  return {
    displayName: nonBlank(identity.name) ?? nonBlank(identity.email) ?? subject,
    role,
    subject,
    tenantId,
  };
}

function normalizeRole(value: string | undefined, fallback: FactoryBidRole): FactoryBidRole {
  if (value === "viewer" || value === "operator" || value === "admin") {
    return value;
  }
  return fallback;
}

function stringClaim(value: unknown): string | undefined {
  return typeof value === "string" ? nonBlank(value) : undefined;
}

function nonBlank(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
