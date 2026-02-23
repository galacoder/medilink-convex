/**
 * TypeScript types for the ai-assistant feature module.
 *
 * vi: "Kiểu TypeScript cho module trợ lý AI" / en: "TypeScript types for ai-assistant module"
 */

/** Portal contexts the AI assistant supports */
export type AiAssistantPortal = "hospital" | "provider";

/** Role in an AI conversation message */
export type AiMessageRole = "user" | "assistant" | "system";

/** A single message in an AI conversation */
export interface AiMessage {
  role: AiMessageRole;
  content: string;
  /** Epoch milliseconds timestamp */
  timestamp: number;
}

/** A full AI conversation record (matches the future aiConversation Convex table) */
export interface AiConversation {
  _id: string;
  userId: string;
  organizationId?: string;
  titleVi: string;
  titleEn: string;
  messages: AiMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

/** Equipment query result from the AI assistant */
export interface EquipmentQueryResult {
  equipmentIds: string[];
  summary: string;
  filters?: Record<string, unknown>;
}

/** Service request draft from the AI assistant */
export interface ServiceRequestDraft {
  descriptionVi: string;
  descriptionEn?: string;
  urgency?: "low" | "medium" | "high";
  suggestedEquipmentIds?: string[];
}

/** Analytics answer from the AI assistant */
export interface AnalyticsAnswer {
  answer: string;
  data?: Record<string, unknown>;
  confidence?: number;
}

/** Shape returned by the useAiAssistant hook */
export interface UseAiAssistantReturn {
  queryEquipment: (
    query: string,
    organizationId: string,
  ) => Promise<EquipmentQueryResult>;
  draftServiceRequest: (
    description: string,
    organizationId: string,
  ) => Promise<ServiceRequestDraft>;
  answerAnalyticsQuestion: (
    question: string,
    organizationId: string,
  ) => Promise<AnalyticsAnswer>;
  isLoading: boolean;
  error: string | null;
}

/** Shape returned by the useAiHistory hook (skeleton until Wave 2 adds persistence) */
export interface UseAiHistoryReturn {
  conversations: AiConversation[];
  isLoading: boolean;
  selectedConversation: AiConversation | null;
  selectConversation: (id: string) => void;
  clearSelection: () => void;
}
