import type { Page } from "@playwright/test";

/**
 * Page Object Model for the platform admin hospital management page (/admin/hospitals).
 *
 * WHY: Encapsulates selectors for the hospital list page used by platform admins.
 * The page shows all registered hospital organizations, supports search/filter,
 * and renders a HospitalTable component with Convex real-time data.
 *
 * Tests use these locators to verify the page renders without asserting
 * specific counts (which depend on seeded data).
 */
export class AdminHospitalsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/hospitals");
  }

  /**
   * h1 heading: "Quản lý bệnh viện" (Hospital Management)
   * WHY: Confirms we're on the hospitals management page (not dashboard).
   */
  get heading() {
    return this.page.locator("h1");
  }

  /**
   * The stats grid containing hospital count cards.
   * WHY: Verifies the stats overview section renders.
   */
  get statsGrid() {
    return this.page.locator(".grid.gap-4");
  }

  /**
   * The hospital list Card container.
   * WHY: Confirms the HospitalTable card rendered (even when empty).
   */
  get hospitalListCard() {
    return this.page.locator('[class*="Card"]').last();
  }

  /**
   * The Onboard Hospital dialog trigger button.
   * WHY: Verifies the CTA button for admin action is visible.
   */
  get onboardButton() {
    return this.page
      .locator("button")
      .filter({ hasText: /Thêm bệnh viện|Onboard|Đăng ký/ });
  }
}
