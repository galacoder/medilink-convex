import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Seed org + user + membership for aiConversation tests */
async function seedOrgContext(t: ReturnType<typeof convexTest>) {
  let orgId: string = "";
  let userId: string = "";

  await t.run(async (ctx) => {
    orgId = await ctx.db.insert("organizations", {
      name: "Test Hospital",
      slug: "test-hospital",
      org_type: "hospital",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    userId = await ctx.db.insert("users", {
      name: "Test User",
      email: "test@spmet.edu.vn",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("organizationMemberships", {
      orgId,
      userId,
      role: "owner",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return { orgId, userId };
}

/** Create an identity that matches seeded user */
function makeIdentity(orgId: string) {
  return {
    subject: "test-subject",
    email: "test@spmet.edu.vn",
    tokenIdentifier: "test-token",
    organizationId: orgId,
    platformRole: null,
  };
}

// ---------------------------------------------------------------------------
// Tests: create
// ---------------------------------------------------------------------------

describe("aiConversation.create", () => {
  it("creates a conversation and returns its ID", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity(makeIdentity(orgId));

    const convId = await authed.mutation(api.aiConversation.create, {
      organizationId: orgId as any,
      titleVi: "Tìm thiết bị siêu âm",
      titleEn: "Find ultrasound equipment",
    });

    expect(convId).toBeTruthy();

    // Verify the created document
    await t.run(async (ctx) => {
      const doc = await ctx.db.get(convId as any);
      expect(doc).not.toBeNull();
      expect(doc!.titleVi).toBe("Tìm thiết bị siêu âm");
      expect(doc!.titleEn).toBe("Find ultrasound equipment");
      expect(doc!.messages).toEqual([]);
      expect(doc!.model).toBe("stub");
      expect(doc!.createdAt).toBeGreaterThan(0);
      expect(doc!.updatedAt).toBeGreaterThan(0);
    });
  });

  it("throws UNAUTHENTICATED when not signed in", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);

    await expect(
      t.mutation(api.aiConversation.create, {
        organizationId: orgId as any,
        titleVi: "Test",
        titleEn: "Test",
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: list
// ---------------------------------------------------------------------------

describe("aiConversation.list", () => {
  it("lists conversations for the user in an org", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity(makeIdentity(orgId));

    // Create 2 conversations
    await authed.mutation(api.aiConversation.create, {
      organizationId: orgId as any,
      titleVi: "Hội thoại 1",
      titleEn: "Conversation 1",
    });
    await authed.mutation(api.aiConversation.create, {
      organizationId: orgId as any,
      titleVi: "Hội thoại 2",
      titleEn: "Conversation 2",
    });

    const result = await authed.query(api.aiConversation.list, {
      organizationId: orgId as any,
    });

    expect(result).toHaveLength(2);
    expect(result[0]!.titleVi).toBeTruthy();
  });

  it("returns empty array for user with no conversations", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity(makeIdentity(orgId));

    const result = await authed.query(api.aiConversation.list, {
      organizationId: orgId as any,
    });

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: getById
// ---------------------------------------------------------------------------

describe("aiConversation.getById", () => {
  it("returns a conversation by ID", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity(makeIdentity(orgId));

    const convId = await authed.mutation(api.aiConversation.create, {
      organizationId: orgId as any,
      titleVi: "Chi tiết",
      titleEn: "Detail",
    });

    const result = await authed.query(api.aiConversation.getById, {
      id: convId as any,
    });

    expect(result).not.toBeNull();
    expect(result!.titleVi).toBe("Chi tiết");
    expect(result!.titleEn).toBe("Detail");
  });

  it("returns null for non-existent ID", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity(makeIdentity(orgId));

    // Create a conversation to get a valid-format ID, then delete it
    const convId = await authed.mutation(api.aiConversation.create, {
      organizationId: orgId as any,
      titleVi: "Temp",
      titleEn: "Temp",
    });
    await authed.mutation(api.aiConversation.remove, { id: convId as any });

    const result = await authed.query(api.aiConversation.getById, {
      id: convId as any,
    });

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: addMessage
// ---------------------------------------------------------------------------

describe("aiConversation.addMessage", () => {
  it("appends a user message to the conversation", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity(makeIdentity(orgId));

    const convId = await authed.mutation(api.aiConversation.create, {
      organizationId: orgId as any,
      titleVi: "Tin nhắn test",
      titleEn: "Message test",
    });

    await authed.mutation(api.aiConversation.addMessage, {
      id: convId as any,
      role: "user",
      content: "Tìm máy siêu âm",
    });

    // Verify message was added
    const conv = await authed.query(api.aiConversation.getById, {
      id: convId as any,
    });
    expect(conv!.messages).toHaveLength(1);
    expect(conv!.messages[0]!.role).toBe("user");
    expect(conv!.messages[0]!.content).toBe("Tìm máy siêu âm");
    expect(conv!.messages[0]!.timestamp).toBeGreaterThan(0);
  });

  it("appends an assistant message after user message", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity(makeIdentity(orgId));

    const convId = await authed.mutation(api.aiConversation.create, {
      organizationId: orgId as any,
      titleVi: "Multi msg",
      titleEn: "Multi msg",
    });

    await authed.mutation(api.aiConversation.addMessage, {
      id: convId as any,
      role: "user",
      content: "Hello",
    });
    await authed.mutation(api.aiConversation.addMessage, {
      id: convId as any,
      role: "assistant",
      content: "AI response placeholder",
    });

    const conv = await authed.query(api.aiConversation.getById, {
      id: convId as any,
    });
    expect(conv!.messages).toHaveLength(2);
    expect(conv!.messages[1]!.role).toBe("assistant");
  });

  it("throws when conversation not found", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity(makeIdentity(orgId));

    // Create then delete to get a valid-format but non-existent ID
    const convId = await authed.mutation(api.aiConversation.create, {
      organizationId: orgId as any,
      titleVi: "Temp",
      titleEn: "Temp",
    });
    await authed.mutation(api.aiConversation.remove, { id: convId as any });

    await expect(
      authed.mutation(api.aiConversation.addMessage, {
        id: convId as any,
        role: "user",
        content: "test",
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: remove (delete)
// ---------------------------------------------------------------------------

describe("aiConversation.remove", () => {
  it("deletes a conversation", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity(makeIdentity(orgId));

    const convId = await authed.mutation(api.aiConversation.create, {
      organizationId: orgId as any,
      titleVi: "To delete",
      titleEn: "To delete",
    });

    await authed.mutation(api.aiConversation.remove, { id: convId as any });

    const result = await authed.query(api.aiConversation.getById, {
      id: convId as any,
    });
    expect(result).toBeNull();
  });

  it("throws when conversation not found", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity(makeIdentity(orgId));

    // Create then delete to get a valid-format but non-existent ID
    const convId = await authed.mutation(api.aiConversation.create, {
      organizationId: orgId as any,
      titleVi: "Temp",
      titleEn: "Temp",
    });
    await authed.mutation(api.aiConversation.remove, { id: convId as any });

    await expect(
      authed.mutation(api.aiConversation.remove, { id: convId as any }),
    ).rejects.toThrow();
  });
});
