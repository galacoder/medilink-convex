/**
 * AI Assistant feature module — public exports.
 *
 * WHY: Single import point for all ai-assistant feature components, hooks, labels, and types.
 * Consumers should import from this barrel file, not from sub-paths.
 *
 * Usage:
 *   import { AIAssistantWidget, useAiAssistant } from "~/features/ai-assistant"
 *
 * vi: "Xuất module trợ lý AI" / en: "AI assistant feature module exports"
 */

// Components
export { AIAssistantWidget } from "./components/ai-assistant-widget";
export { AiChatHistory } from "./components/ai-chat-history";

// Hooks
export { useAiAssistant } from "./hooks/use-ai-assistant";
export { useAiHistory } from "./hooks/use-ai-history";

// Labels + Types
export * from "./labels";
export * from "./types";
