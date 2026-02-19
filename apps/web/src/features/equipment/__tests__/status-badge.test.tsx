import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "../components/status-badge";

describe("StatusBadge", () => {
  it("renders Vietnamese label for available status", () => {
    render(<StatusBadge status="available" locale="vi" />);
    expect(screen.getByText("Sẵn sàng")).toBeInTheDocument();
  });

  it("renders English label for available status", () => {
    render(<StatusBadge status="available" locale="en" />);
    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("renders Vietnamese label for in_use status", () => {
    render(<StatusBadge status="in_use" locale="vi" />);
    expect(screen.getByText("Đang sử dụng")).toBeInTheDocument();
  });

  it("renders English label for damaged status", () => {
    render(<StatusBadge status="damaged" locale="en" />);
    expect(screen.getByText("Damaged")).toBeInTheDocument();
  });

  it("renders all 5 status values without error", () => {
    const statuses = [
      "available",
      "in_use",
      "maintenance",
      "damaged",
      "retired",
    ] as const;
    statuses.forEach((status) => {
      const { unmount } = render(<StatusBadge status={status} />);
      unmount();
    });
  });

  it("applies correct color class for available status", () => {
    const { container } = render(
      <StatusBadge status="available" locale="vi" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-green-100");
    expect(badge.className).toContain("text-green-800");
  });

  it("applies correct color class for damaged status", () => {
    const { container } = render(<StatusBadge status="damaged" locale="vi" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-red-100");
    expect(badge.className).toContain("text-red-800");
  });

  it("applies correct color class for maintenance status", () => {
    const { container } = render(
      <StatusBadge status="maintenance" locale="vi" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-yellow-100");
    expect(badge.className).toContain("text-yellow-800");
  });

  it("applies correct color class for retired status", () => {
    const { container } = render(
      <StatusBadge status="retired" locale="vi" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-gray-100");
    expect(badge.className).toContain("text-gray-600");
  });

  it("renders Vietnamese label by default when locale not specified", () => {
    render(<StatusBadge status="maintenance" />);
    expect(screen.getByText("Bảo trì")).toBeInTheDocument();
  });
});
