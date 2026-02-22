/**
 * Zod v4 schemas for AI assistant request inputs and function call results.
 *
 * vi: "Lược đồ xác thực cho trợ lý AI" / en: "Validation schemas for AI assistant"
 *
 * WHY: Centralizing schemas here ensures the same validation logic is used
 * by both the Convex action layer and the frontend before submitting requests.
 * Bilingual error messages support Vietnamese-primary users.
 */
import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// Equipment status enum (shared with equipment.ts)
// ---------------------------------------------------------------------------

/**
 * Valid equipment statuses for AI query filtering.
 * vi: "Trạng thái thiết bị hợp lệ" / en: "Valid equipment statuses"
 */
const equipmentStatusEnum = z.enum([
  "available",
  "in_use",
  "maintenance",
  "damaged",
  "retired",
]);

// ---------------------------------------------------------------------------
// Portal type
// ---------------------------------------------------------------------------

/**
 * Portal type: which portal context the AI assistant runs in.
 * vi: "Loại cổng thông tin" / en: "Portal type"
 *   hospital - vi: "Cổng bệnh viện" / en: "Hospital portal"
 *   provider - vi: "Cổng nhà cung cấp" / en: "Provider portal"
 */
export const aiAssistantPortalSchema = z.enum(["hospital", "provider"]);
export type AiAssistantPortal = z.infer<typeof aiAssistantPortalSchema>;

// ---------------------------------------------------------------------------
// Equipment search action schema
// ---------------------------------------------------------------------------

/**
 * Schema for natural language equipment search requests.
 *
 * vi: "Lược đồ tìm kiếm thiết bị bằng ngôn ngữ tự nhiên"
 * en: "Schema for natural language equipment search"
 */
export const aiQueryEquipmentSchema = z.object({
  /**
   * Natural language query from the user.
   * vi: "Câu hỏi ngôn ngữ tự nhiên từ người dùng"
   * en: "Natural language query from the user"
   */
  query: z.string().min(1, {
    message: "Câu hỏi không được để trống (Query cannot be empty)",
  }),

  /**
   * Organization ID to scope the search.
   * vi: "ID tổ chức để giới hạn phạm vi tìm kiếm"
   * en: "Organization ID to scope the search"
   */
  organizationId: z.string().min(1, {
    message: "ID tổ chức không được để trống (Organization ID cannot be empty)",
  }),

  /**
   * Optional status filter for the search.
   * vi: "Bộ lọc trạng thái tùy chọn" / en: "Optional status filter"
   */
  statusFilter: equipmentStatusEnum.optional(),
});

export type AiQueryEquipmentInput = z.infer<typeof aiQueryEquipmentSchema>;

// ---------------------------------------------------------------------------
// Service request drafting action schema
// ---------------------------------------------------------------------------

/**
 * Schema for AI-assisted service request drafting.
 *
 * vi: "Lược đồ soạn thảo yêu cầu dịch vụ bằng AI"
 * en: "Schema for AI-assisted service request drafting"
 */
export const aiDraftServiceRequestSchema = z.object({
  /**
   * Description of what the service request should be about.
   * vi: "Mô tả yêu cầu dịch vụ" / en: "Service request description"
   */
  description: z.string().min(1, {
    message: "Mô tả không được để trống (Description cannot be empty)",
  }),

  /**
   * Organization ID for the service request.
   * vi: "ID tổ chức" / en: "Organization ID"
   */
  organizationId: z.string().min(1, {
    message: "ID tổ chức không được để trống (Organization ID cannot be empty)",
  }),

  /**
   * Optional equipment ID to pre-fill in the form.
   * vi: "ID thiết bị tùy chọn" / en: "Optional equipment ID"
   */
  equipmentId: z.string().optional(),
});

export type AiDraftServiceRequestInput = z.infer<
  typeof aiDraftServiceRequestSchema
>;

// ---------------------------------------------------------------------------
// Analytics Q&A action schema
// ---------------------------------------------------------------------------

/**
 * Valid date range presets for analytics queries.
 * vi: "Các khoảng thời gian hợp lệ cho truy vấn phân tích"
 * en: "Valid date range presets for analytics queries"
 */
export const aiAnalyticsDateRangeSchema = z.enum(["7d", "30d", "90d"]);
export type AiAnalyticsDateRange = z.infer<typeof aiAnalyticsDateRangeSchema>;

/**
 * Schema for natural language analytics questions.
 *
 * vi: "Lược đồ câu hỏi phân tích bằng ngôn ngữ tự nhiên"
 * en: "Schema for natural language analytics questions"
 */
export const aiAnalyticsQuestionSchema = z.object({
  /**
   * Natural language question about analytics data.
   * vi: "Câu hỏi về dữ liệu phân tích" / en: "Analytics data question"
   */
  question: z.string().min(1, {
    message: "Câu hỏi không được để trống (Question cannot be empty)",
  }),

  /**
   * Organization ID to scope analytics data.
   * vi: "ID tổ chức" / en: "Organization ID"
   */
  organizationId: z.string().min(1, {
    message: "ID tổ chức không được để trống (Organization ID cannot be empty)",
  }),

  /**
   * Optional date range for the analytics query.
   * vi: "Khoảng thời gian tùy chọn" / en: "Optional date range"
   */
  dateRange: aiAnalyticsDateRangeSchema.optional(),
});

export type AiAnalyticsQuestionInput = z.infer<
  typeof aiAnalyticsQuestionSchema
>;

// ---------------------------------------------------------------------------
// AI assistant result schemas (returned by Convex actions)
// ---------------------------------------------------------------------------

/**
 * Schema for equipment search results from AI assistant.
 * vi: "Kết quả tìm kiếm thiết bị từ trợ lý AI"
 * en: "Equipment search results from AI assistant"
 */
export const aiEquipmentResultSchema = z.object({
  summary: z.string(),
  equipmentIds: z.array(z.string()),
  count: z.number(),
  suggestions: z.array(z.string()).optional(),
});

export type AiEquipmentResult = z.infer<typeof aiEquipmentResultSchema>;

/**
 * Schema for service request draft from AI assistant.
 * vi: "Bản nháp yêu cầu dịch vụ từ trợ lý AI"
 * en: "Service request draft from AI assistant"
 */
export const aiServiceRequestDraftSchema = z.object({
  titleSuggestion: z.string(),
  descriptionSuggestion: z.string(),
  urgency: z.enum(["low", "medium", "high"]),
  equipmentId: z.string().optional(),
  location: z.string().optional(),
});

export type AiServiceRequestDraft = z.infer<typeof aiServiceRequestDraftSchema>;

/**
 * Schema for analytics answer from AI assistant.
 * vi: "Câu trả lời phân tích từ trợ lý AI"
 * en: "Analytics answer from AI assistant"
 */
export const aiAnalyticsAnswerSchema = z.object({
  answer: z.string(),
  dataPoints: z.record(z.string(), z.unknown()).optional(),
  suggestions: z.array(z.string()).optional(),
});

export type AiAnalyticsAnswer = z.infer<typeof aiAnalyticsAnswerSchema>;

// ---------------------------------------------------------------------------
// AI Conversation History schemas (new — Wave 2)
// ---------------------------------------------------------------------------

/**
 * Schema for a single AI conversation message.
 * vi: "Tin nhắn hội thoại AI" / en: "AI conversation message"
 */
export const aiMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, {
    message:
      "Nội dung tin nhắn không được để trống (Message content cannot be empty)",
  }),
  timestamp: z.number().positive({
    message: "Thời gian không hợp lệ (Invalid timestamp)",
  }),
});

export type AiMessage = z.infer<typeof aiMessageSchema>;

/**
 * Schema for creating/saving an AI conversation to persistent history.
 * vi: "Lưu hội thoại AI" / en: "Save AI conversation"
 *
 * WHY: Used by the UI when persisting a completed conversation session
 * to the aiConversation table via saveConversation mutation.
 */
export const createAiConversationSchema = z.object({
  titleVi: z.string().min(1, {
    message:
      "Tiêu đề không được để trống (Title cannot be empty)",
  }),
  titleEn: z.string().min(1, {
    message:
      "English title cannot be empty (Tiêu đề tiếng Anh không được để trống)",
  }),
  messages: z.array(aiMessageSchema).min(1, {
    message:
      "Hội thoại phải có ít nhất một tin nhắn (Conversation must have at least one message)",
  }),
  model: z.string().min(1, {
    message:
      "Tên mô hình không được để trống (Model name cannot be empty)",
  }),
});

export type CreateAiConversationInput = z.infer<
  typeof createAiConversationSchema
>;

/**
 * Schema for filtering/querying AI conversation history.
 * vi: "Lọc lịch sử hội thoại AI" / en: "Filter AI conversation history"
 */
export const aiConversationFilterSchema = z.object({
  limit: z.number().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export type AiConversationFilter = z.infer<typeof aiConversationFilterSchema>;
