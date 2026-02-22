/**
 * AI Assistant component barrel export — re-exports from features/ai-assistant/.
 *
 * WHY: Component has been promoted to the feature module at
 * src/features/ai-assistant/. This file is kept for backward-compatibility
 * so existing imports of "~/components/ai-assistant" continue to work.
 * New code should import from "~/features/ai-assistant" directly.
 *
 * vi: "Xuất thành phần Trợ lý AI" / en: "AI Assistant component exports"
 */
export { AIAssistantWidget } from "~/features/ai-assistant/components/ai-assistant-widget";
