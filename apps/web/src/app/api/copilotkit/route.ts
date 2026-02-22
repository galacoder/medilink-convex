/**
 * CopilotKit runtime endpoint for AI assistant.
 *
 * WHY: CopilotKit requires a backend runtime to securely handle LLM calls.
 * This endpoint bridges the frontend CopilotKit components with OpenAI GPT-4o,
 * keeping the API key server-side and out of the browser bundle.
 *
 * The runtime is configured with:
 *   - OpenAI GPT-4o as the LLM provider
 *   - Three backend actions mapping to Convex AI functions
 *
 * vi: "Điểm cuối thời gian chạy CopilotKit cho trợ lý AI"
 * en: "CopilotKit runtime endpoint for AI assistant"
 */

import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import OpenAI from "openai";

import { env } from "~/env";

export const runtime = "nodejs";

/**
 * POST handler for CopilotKit runtime.
 * Processes chat messages and tool calls from the frontend.
 *
 * vi: "Xử lý tin nhắn trò chuyện và cuộc gọi công cụ từ giao diện"
 * en: "Processes chat messages and tool calls from the frontend"
 */
export const POST = async (req: Request) => {
  // WHY: OPENAI_API_KEY is only read server-side (never in client bundle).
  // If missing, CopilotKit will return an error response that the UI displays.
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY ?? "",
  });

  const serviceAdapter = new OpenAIAdapter({
    openai,
    model: "gpt-4o",
  });

  /**
   * CopilotRuntime instance.
   * Actions defined here are available to the CopilotKit frontend.
   * The actual business logic runs server-side in this route handler.
   *
   * NOTE: Heavy AI operations (equipment search, service request drafting,
   * analytics Q&A) are delegated to Convex actions via the frontend
   * useCopilotAction hooks, which call Convex mutations/actions directly.
   * This route handles the chat LLM layer only.
   *
   * vi: "Phiên bản CopilotRuntime, xử lý lớp LLM trò chuyện"
   * en: "CopilotRuntime instance, handles the chat LLM layer"
   */
  const runtime = new CopilotRuntime({});

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
