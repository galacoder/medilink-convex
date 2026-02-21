/**
 * Tests for the AI Assistant Widget component.
 *
 * WHY: Testing the widget in isolation ensures the floating button renders,
 * the slide-out panel opens/closes correctly, and CopilotKit integration
 * props are passed correctly without needing a live LLM connection.
 *
 * vi: "Kiểm tra thành phần Widget Trợ lý AI"
 * en: "Tests for AI Assistant Widget component"
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AIAssistantWidget } from "../AIAssistantWidget";

// Mock CopilotKit to avoid needing a real runtime in tests
vi.mock("@copilotkit/react-core", () => ({
  CopilotKit: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="copilotkit-provider">{children}</div>
  ),
  useCopilotReadable: vi.fn(),
  useCopilotAction: vi.fn(),
  useCopilotChatSuggestions: vi.fn(),
}));

vi.mock("@copilotkit/react-ui", () => ({
  CopilotSidebar: ({
    children,
    labels,
  }: {
    children: React.ReactNode;
    labels?: { title?: string };
  }) => (
    <div data-testid="copilot-sidebar">
      {labels?.title && <div data-testid="sidebar-title">{labels.title}</div>}
      {children}
    </div>
  ),
}));

describe("AIAssistantWidget", () => {
  it("test_renders_floating_button_for_hospital_portal", () => {
    render(
      <AIAssistantWidget portal="hospital" runtimeUrl="/api/copilotkit" />,
    );
    const button = screen.getByRole("button", {
      name: /trợ lý ai|ai assistant/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("test_renders_floating_button_for_provider_portal", () => {
    render(
      <AIAssistantWidget portal="provider" runtimeUrl="/api/copilotkit" />,
    );
    const button = screen.getByRole("button", {
      name: /trợ lý ai|ai assistant/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("test_opens_sidebar_when_floating_button_clicked", () => {
    render(
      <AIAssistantWidget portal="hospital" runtimeUrl="/api/copilotkit" />,
    );
    const button = screen.getByRole("button", {
      name: /trợ lý ai|ai assistant/i,
    });
    fireEvent.click(button);
    // After click, the CopilotSidebar should be visible
    expect(screen.getByTestId("copilot-sidebar")).toBeInTheDocument();
  });

  it("test_wraps_content_in_copilotkit_provider", () => {
    render(
      <AIAssistantWidget portal="hospital" runtimeUrl="/api/copilotkit" />,
    );
    expect(screen.getByTestId("copilotkit-provider")).toBeInTheDocument();
  });

  it("test_hospital_portal_shows_medical_equipment_title", () => {
    render(
      <AIAssistantWidget portal="hospital" runtimeUrl="/api/copilotkit" />,
    );
    const button = screen.getByRole("button", {
      name: /trợ lý ai|ai assistant/i,
    });
    fireEvent.click(button);
    const sidebarTitle = screen.getByTestId("sidebar-title");
    expect(sidebarTitle.textContent).toMatch(/thiết bị|equipment|trợ lý/i);
  });

  it("test_provider_portal_shows_simplified_title", () => {
    render(
      <AIAssistantWidget portal="provider" runtimeUrl="/api/copilotkit" />,
    );
    const button = screen.getByRole("button", {
      name: /trợ lý ai|ai assistant/i,
    });
    fireEvent.click(button);
    const sidebarTitle = screen.getByTestId("sidebar-title");
    expect(sidebarTitle.textContent).toMatch(/trợ lý|assistant/i);
  });

  it("test_does_not_show_sidebar_initially", () => {
    render(
      <AIAssistantWidget portal="hospital" runtimeUrl="/api/copilotkit" />,
    );
    // Sidebar should only render when open
    const sidebar = screen.queryByTestId("copilot-sidebar");
    expect(sidebar).not.toBeInTheDocument();
  });
});
