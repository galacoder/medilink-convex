"use client";

/**
 * QuotesList component — renders multiple QuoteComparisonCards.
 *
 * WHY: Separating the list container from individual cards keeps each
 * component focused. The list handles empty state and maps the quotes
 * array to cards, while QuoteComparisonCard handles individual quote UI.
 */
import type { Quote } from "../types";
import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";
import { QuoteComparisonCard } from "./quote-comparison-card";

interface QuotesListProps {
  quotes: Quote[];
  onAccept: (quoteId: string) => Promise<void>;
  onReject: (quoteId: string) => Promise<void>;
}

const labels = serviceRequestLabels.quotes;

export function QuotesList({ quotes, onAccept, onReject }: QuotesListProps) {
  if (quotes.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-6 py-8 text-center text-sm">
        {labels.empty.vi}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <QuoteComparisonCard
          key={quote._id}
          quote={quote}
          onAccept={onAccept}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
