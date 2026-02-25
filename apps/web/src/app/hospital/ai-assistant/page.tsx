"use client";

/**
 * Hospital AI Assistant page.
 *
 * WHY: Hospital users need a dedicated page to interact with the AI assistant
 * and browse conversation history. Org-scoped via useActiveOrganization.
 *
 * vi: "Trang tro ly AI benh vien" / en: "Hospital AI assistant page"
 */
import type { Id } from "@medilink/backend";

import { useActiveOrganization } from "~/auth/client";
import { AiChatPage } from "~/features/ai-assistant/components/ai-chat-page";
import { aiAssistantLabels } from "~/features/ai-assistant/labels";

export default function HospitalAiAssistantPage() {
  const { data: activeOrg, isPending } = useActiveOrganization();
  const organizationId = activeOrg?.id as Id<"organizations"> | undefined;

  return (
    <div className="space-y-6" data-testid="hospital-ai-assistant">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">
          {aiAssistantLabels.pageTitle.vi}{" "}
          <span className="text-muted-foreground text-base font-normal">
            ({aiAssistantLabels.pageTitle.en})
          </span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {aiAssistantLabels.pageSubtitle.vi}
        </p>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-14 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <AiChatPage portal="hospital" organizationId={organizationId} />
      )}
    </div>
  );
}
