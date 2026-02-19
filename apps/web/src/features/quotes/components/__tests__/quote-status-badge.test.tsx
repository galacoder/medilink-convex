/**
 * Tests for QuoteStatusBadge component.
 *
 * WHY: Verifies that each status maps to the correct visual variant and
 * bilingual label. Consistent visual treatment is critical for providers
 * to quickly parse quote status across the quotes list page.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { QuoteStatusBadge } from "../quote-status-badge";

describe("QuoteStatusBadge", () => {
  it("test_QuoteStatusBadge_mapsStatusToVariant - renders badge with testid", () => {
    renderWithProviders(<QuoteStatusBadge status="pending" />);
    expect(screen.getByTestId("quote-status-badge")).toBeInTheDocument();
  });

  it("displays Vietnamese label for pending status", () => {
    renderWithProviders(<QuoteStatusBadge status="pending" />);
    expect(screen.getByText("Chờ phản hồi")).toBeInTheDocument();
  });

  it("displays Vietnamese label for accepted status", () => {
    renderWithProviders(<QuoteStatusBadge status="accepted" />);
    expect(screen.getByText("Được chấp nhận")).toBeInTheDocument();
  });

  it("displays Vietnamese label for rejected status", () => {
    renderWithProviders(<QuoteStatusBadge status="rejected" />);
    expect(screen.getByText("Bị từ chối")).toBeInTheDocument();
  });

  it("displays Vietnamese label for expired status", () => {
    renderWithProviders(<QuoteStatusBadge status="expired" />);
    expect(screen.getByText("Hết hạn")).toBeInTheDocument();
  });
});
