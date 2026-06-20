import { describe, expect, it } from "vitest";

import { requireFactoryBidActor, resolveFactoryBidActor } from "./authz";

describe("FactoryBid Convex authz", () => {
  it("uses migration-safe operator and tenant defaults for authenticated users", () => {
    expect(
      resolveFactoryBidActor({
        email: "sari@example.com",
        name: "Sari",
        subject: "user-123",
      }),
    ).toEqual({
      displayName: "Sari",
      role: "operator",
      subject: "user-123",
      tenantId: "factorybid-single-tenant",
    });
  });

  it("accepts explicit FactoryBid role and tenant claims", () => {
    expect(
      resolveFactoryBidActor({
        publicMetadata: {
          factorybidRole: "admin",
          factorybidTenantId: "tenant-north",
        },
        subject: "user-456",
      }),
    ).toMatchObject({
      role: "admin",
      tenantId: "tenant-north",
    });
  });

  it("requires authentication and role permissions", async () => {
    await expect(
      requireFactoryBidActor(
        {
          auth: {
            getUserIdentity: async () => null,
          },
        },
        "workspace:read",
      ),
    ).rejects.toThrow("authentication required");

    await expect(
      requireFactoryBidActor(
        {
          auth: {
            getUserIdentity: async () => ({
              factorybidRole: "viewer",
              subject: "user-789",
            }),
          },
        },
        "workspace:write",
      ),
    ).rejects.toThrow("permission workspace:write requires a higher FactoryBid role");
  });
});
