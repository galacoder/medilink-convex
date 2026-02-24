/**
 * AI assistant Convex actions.
 *
 * WHY: Wraps AI-powered features (equipment search, service request drafting,
 * analytics Q&A) behind Convex actions so they run server-side with access to
 * the database and can be called from any client via the Convex API.
 *
 * vi: "Các action Convex cho trợ lý AI" / en: "AI assistant Convex actions"
 */

import { v } from "convex/values";

import { action } from "./_generated/server";

/**
 * Natural language equipment search.
 *
 * Searches the equipment database based on a natural language query and
 * returns matching equipment IDs with a human-readable summary.
 *
 * vi: "Tìm kiếm thiết bị bằng ngôn ngữ tự nhiên" / en: "Natural language equipment search"
 */
export const queryEquipment = action({
  args: {
    /** vi: "Câu hỏi tìm kiếm" / en: "Natural language search query" */
    query: v.string(),
    /** vi: "ID tổ chức" / en: "Organization ID to scope the search" */
    organizationId: v.string(),
  },
  returns: v.object({
    equipmentIds: v.array(v.string()),
    summary: v.string(),
  }),
  handler: async (_ctx, args) => {
    // TODO: Implement AI-powered equipment search using embeddings or LLM
    // For now returns empty results — replace with actual AI integration
    void args;
    return {
      equipmentIds: [],
      summary: "AI equipment search not yet implemented.",
    };
  },
});

/**
 * AI-assisted service request drafting.
 *
 * Analyzes a natural language description and suggests a structured
 * service request with urgency classification.
 *
 * vi: "Soạn thảo yêu cầu dịch vụ bằng AI" / en: "AI-assisted service request drafting"
 */
export const draftServiceRequest = action({
  args: {
    /** vi: "Mô tả vấn đề" / en: "Natural language problem description" */
    description: v.string(),
    /** vi: "ID tổ chức" / en: "Organization ID for context" */
    organizationId: v.string(),
  },
  returns: v.object({
    descriptionSuggestion: v.optional(v.string()),
    urgency: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    ),
  }),
  handler: async (_ctx, args) => {
    // TODO: Implement AI service request drafting using LLM
    // For now returns the description as-is with medium urgency
    return {
      descriptionSuggestion: args.description,
      urgency: "medium" as const,
    };
  },
});

/**
 * AI-powered analytics question answering.
 *
 * Answers natural language questions about organizational analytics data
 * by querying the database and synthesizing a response.
 *
 * vi: "Trả lời câu hỏi phân tích bằng AI" / en: "AI-powered analytics Q&A"
 */
export const answerAnalyticsQuestion = action({
  args: {
    /** vi: "Câu hỏi phân tích" / en: "Natural language analytics question" */
    question: v.string(),
    /** vi: "ID tổ chức" / en: "Organization ID for data scoping" */
    organizationId: v.string(),
  },
  returns: v.object({
    answer: v.string(),
    dataPoints: v.optional(v.any()),
  }),
  handler: async (_ctx, args) => {
    // TODO: Implement AI analytics Q&A using LLM + database queries
    void args;
    return {
      answer: "AI analytics Q&A not yet implemented.",
      dataPoints: undefined,
    };
  },
});
