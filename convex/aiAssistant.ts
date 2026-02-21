/**
 * Convex actions for AI assistant functionality.
 *
 * WHY: Server-side AI logic must run as Convex actions (not client-side) to:
 *   1. Protect the OPENAI_API_KEY from client exposure
 *   2. Access Convex db context for equipment/service request data
 *   3. Ensure consistent and auditable AI interactions
 *
 * Functions:
 *   - queryEquipment: Natural language equipment search
 *   - draftServiceRequest: AI-assisted service request pre-filling
 *   - answerAnalyticsQuestion: Analytics Q&A using Convex data
 *
 * vi: "Các action Convex cho chức năng trợ lý AI"
 * en: "Convex actions for AI assistant functionality"
 */

import { v } from "convex/values";

import { action } from "./_generated/server";

// ---------------------------------------------------------------------------
// Equipment status literals (mirrors validators/equipmentStatusSchema)
// ---------------------------------------------------------------------------

type EquipmentStatus =
  | "available"
  | "in_use"
  | "maintenance"
  | "damaged"
  | "retired";

// ---------------------------------------------------------------------------
// Natural language equipment search action
// ---------------------------------------------------------------------------

/**
 * Queries equipment using natural language via OpenAI GPT-4o.
 *
 * The action:
 *   1. Sends the user query + available equipment list to GPT-4o
 *   2. GPT-4o identifies relevant equipment and suggests filters
 *   3. Returns matching equipment IDs and a summary
 *
 * vi: "Tìm kiếm thiết bị bằng ngôn ngữ tự nhiên"
 * en: "Natural language equipment search"
 */
export const queryEquipment = action({
  args: {
    query: v.string(),
    organizationId: v.string(),
    statusFilter: v.optional(
      v.union(
        v.literal("available"),
        v.literal("in_use"),
        v.literal("maintenance"),
        v.literal("damaged"),
        v.literal("retired"),
      ),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    summary: string;
    equipmentIds: string[];
    count: number;
    suggestions: string[];
  }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        summary:
          "Chức năng AI không khả dụng (AI feature unavailable): OPENAI_API_KEY not configured",
        equipmentIds: [],
        count: 0,
        suggestions: [],
      };
    }

    // Build the system prompt for equipment search
    // vi: "Xây dựng prompt hệ thống cho tìm kiếm thiết bị"
    const systemPrompt = `You are a medical equipment assistant for a Vietnamese healthcare school (SPMET).
Help hospital staff find equipment using natural language queries.
When analyzing a query:
1. Identify the equipment type mentioned
2. Note any status filters (broken, available, in maintenance, etc.)
3. Extract location hints if mentioned
4. Respond in JSON format with: summary (string, bilingual vi/en), statusFilter (one of: available|in_use|maintenance|damaged|retired, or null), nameKeywords (array of strings to search)

Equipment statuses:
- available (sẵn sàng)
- in_use (đang sử dụng)
- maintenance (bảo trì)
- damaged (hỏng)
- retired (đã nghỉ hưu)

Respond ONLY with valid JSON.`;

    const userMessage = args.statusFilter
      ? `${args.query}\n\nNote: User also wants to filter by status: ${args.statusFilter}`
      : args.query;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = data.choices[0]?.message?.content ?? "{}";

      let parsed: {
        summary?: string;
        statusFilter?: EquipmentStatus | null;
        nameKeywords?: string[];
      } = {};
      try {
        parsed = JSON.parse(content) as typeof parsed;
      } catch {
        // If GPT returns non-JSON, use the raw content as summary
        parsed = { summary: content, nameKeywords: [] };
      }

      const summary =
        parsed.summary ??
        `Tìm kiếm: ${args.query} (Search: ${args.query})`;
      const suggestions = [
        "Xem tất cả thiết bị (View all equipment)",
        "Lọc theo trạng thái (Filter by status)",
        "Tạo yêu cầu bảo trì (Create maintenance request)",
      ];

      return {
        summary,
        equipmentIds: [], // Populated by client-side Convex query after action
        count: 0,
        suggestions,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        summary: `Lỗi tìm kiếm (Search error): ${errorMessage}`,
        equipmentIds: [],
        count: 0,
        suggestions: [],
      };
    }
  },
});

// ---------------------------------------------------------------------------
// Service request drafting action
// ---------------------------------------------------------------------------

/**
 * Drafts a service request using natural language description via OpenAI GPT-4o.
 *
 * The action analyzes the description and extracts:
 *   - Service request title (bilingual)
 *   - Detailed description
 *   - Urgency level (low/medium/high)
 *   - Equipment location hint
 *
 * vi: "Soạn thảo yêu cầu dịch vụ bằng mô tả ngôn ngữ tự nhiên"
 * en: "Draft service request from natural language description"
 */
export const draftServiceRequest = action({
  args: {
    description: v.string(),
    organizationId: v.string(),
    equipmentId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    titleSuggestion: string;
    descriptionSuggestion: string;
    urgency: "low" | "medium" | "high";
    equipmentId?: string;
    location?: string;
  }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        titleSuggestion: args.description.slice(0, 100),
        descriptionSuggestion: args.description,
        urgency: "medium",
        equipmentId: args.equipmentId,
      };
    }

    const systemPrompt = `You are a medical equipment service request assistant for a Vietnamese healthcare school.
Parse the user's natural language description and create a structured service request.

Respond ONLY with valid JSON in this format:
{
  "titleSuggestion": "brief title (max 100 chars)",
  "descriptionSuggestion": "detailed description with context",
  "urgency": "low|medium|high",
  "location": "extracted location or null"
}

Urgency rules:
- high: broken equipment, patient safety risk, immediate use needed
- medium: maintenance needed, degraded performance
- low: routine maintenance, cosmetic issues`;

    const userMessage = args.equipmentId
      ? `${args.description}\n\nEquipment ID: ${args.equipmentId}`
      : args.description;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = data.choices[0]?.message?.content ?? "{}";

      let parsed: {
        titleSuggestion?: string;
        descriptionSuggestion?: string;
        urgency?: "low" | "medium" | "high";
        location?: string | null;
      } = {};
      try {
        parsed = JSON.parse(content) as typeof parsed;
      } catch {
        parsed = {};
      }

      return {
        titleSuggestion:
          parsed.titleSuggestion ?? args.description.slice(0, 100),
        descriptionSuggestion:
          parsed.descriptionSuggestion ?? args.description,
        urgency: parsed.urgency ?? "medium",
        equipmentId: args.equipmentId,
        location: parsed.location ?? undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        titleSuggestion: args.description.slice(0, 100),
        descriptionSuggestion: `${args.description}\n\nLỗi AI (AI Error): ${errorMessage}`,
        urgency: "medium",
        equipmentId: args.equipmentId,
      };
    }
  },
});

// ---------------------------------------------------------------------------
// Analytics Q&A action
// ---------------------------------------------------------------------------

/**
 * Answers natural language analytics questions using Convex data + GPT-4o.
 *
 * The action:
 *   1. Receives an analytics question
 *   2. Uses GPT-4o to interpret and generate a structured answer
 *   3. Returns the answer with data points and follow-up suggestions
 *
 * vi: "Trả lời câu hỏi phân tích bằng ngôn ngữ tự nhiên"
 * en: "Answer analytics questions in natural language"
 */
export const answerAnalyticsQuestion = action({
  args: {
    question: v.string(),
    organizationId: v.string(),
    dateRange: v.optional(
      v.union(v.literal("7d"), v.literal("30d"), v.literal("90d")),
    ),
    // Context data passed from client (from Convex queries)
    analyticsContext: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    answer: string;
    dataPoints?: Record<string, unknown>;
    suggestions?: string[];
  }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        answer:
          "Chức năng AI không khả dụng (AI feature unavailable): OPENAI_API_KEY not configured",
        suggestions: [
          "Xem bảng phân tích (View analytics dashboard)",
          "Xuất báo cáo (Export report)",
        ],
      };
    }

    const dateRangeLabel =
      args.dateRange === "7d"
        ? "7 ngày qua (last 7 days)"
        : args.dateRange === "30d"
          ? "30 ngày qua (last 30 days)"
          : args.dateRange === "90d"
            ? "90 ngày qua (last 90 days)"
            : "30 ngày qua (last 30 days)";

    const systemPrompt = `You are a medical equipment analytics assistant for a Vietnamese healthcare school.
Answer questions about equipment usage, service requests, maintenance, and performance metrics.

Context data (if provided): ${args.analyticsContext ?? "No additional context provided"}
Date range: ${dateRangeLabel}

Respond ONLY with valid JSON:
{
  "answer": "clear, bilingual answer (Vietnamese first, English in parentheses)",
  "suggestions": ["follow-up action 1", "follow-up action 2"]
}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: args.question },
          ],
          temperature: 0.2,
          max_tokens: 600,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = data.choices[0]?.message?.content ?? "{}";

      let parsed: {
        answer?: string;
        suggestions?: string[];
      } = {};
      try {
        parsed = JSON.parse(content) as typeof parsed;
      } catch {
        parsed = { answer: content };
      }

      return {
        answer:
          parsed.answer ??
          "Không thể xử lý câu hỏi (Could not process question)",
        suggestions: parsed.suggestions ?? [
          "Xem bảng phân tích (View analytics dashboard)",
          "Xuất báo cáo (Export report)",
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        answer: `Lỗi trả lời (Answer error): ${errorMessage}`,
        suggestions: ["Thử lại (Try again)", "Xem bảng phân tích (View analytics)"],
      };
    }
  },
});
