import type { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the hospital QR scanner page (/hospital/scan).
 *
 * WHY: Encapsulates data-testid selectors for the scanner page so that
 * E2E tests don't have hard-coded selectors scattered across test files.
 * Follows the EquipmentListPage pattern established in equipment.page.ts.
 *
 * vi: "Mô hình trang quét mã QR" / en: "QR scanner page object model"
 */
export class QRScannerPage {
  readonly page: Page;

  /** The main scan page container */
  readonly scanPage: Locator;

  /** The camera scanner container (present when camera mode is active) */
  readonly scannerContainer: Locator;

  /** The camera preview viewport div */
  readonly scannerPreview: Locator;

  /** The manual entry input field */
  readonly fallbackInput: Locator;

  /** The manual entry submit button */
  readonly fallbackSubmit: Locator;

  /** The toggle button to switch between camera and manual entry */
  readonly toggleManualButton: Locator;

  /** Scanner error message (when camera access fails) */
  readonly scannerError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.scanPage = page.locator('[data-testid="scan-page"]');
    this.scannerContainer = page.locator(
      '[data-testid="qr-scanner-container"]',
    );
    this.scannerPreview = page.locator('[data-testid="qr-scanner-preview"]');
    this.fallbackInput = page.locator('[data-testid="qr-fallback-input"]');
    this.fallbackSubmit = page.locator('[data-testid="qr-fallback-submit"]');
    this.toggleManualButton = page.locator(
      '[data-testid="scan-toggle-manual"]',
    );
    this.scannerError = page.locator('[data-testid="qr-scanner-error"]');
  }

  async goto(): Promise<void> {
    await this.page.goto("/hospital/scan");
  }

  /**
   * Switches from camera mode to manual entry mode.
   * WHY: Tests that run in CI have no physical camera; manual entry
   * is the fallback path that can be tested without camera hardware.
   */
  async switchToManualEntry(): Promise<void> {
    await this.toggleManualButton.click();
  }

  /**
   * Submits a manual equipment ID.
   * WHY: Simulates a user typing an equipment ID when the camera is unavailable.
   */
  async submitManualId(equipmentId: string): Promise<void> {
    await this.fallbackInput.fill(equipmentId);
    await this.fallbackSubmit.click();
  }
}
