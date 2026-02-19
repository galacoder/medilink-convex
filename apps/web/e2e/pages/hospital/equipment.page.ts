import type { Page } from "@playwright/test";

/**
 * Page Object Model for the hospital equipment list page (/hospital/equipment).
 *
 * WHY: Encapsulates data-testid selectors for equipment list assertions.
 * Used by Wave 5 equipment tests to verify equipment appears in the list.
 */
export class EquipmentListPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/hospital/equipment");
  }

  /** The equipment list table (always rendered, even when empty) */
  get list() {
    return this.page.locator('[data-testid="equipment-list"]');
  }

  /** Equipment rows (tr elements with data-testid="equipment-row") */
  get rows() {
    return this.page.locator('[data-testid="equipment-row"]');
  }

  /** Status badges within equipment rows */
  get statusBadges() {
    return this.page.locator('[data-testid="status-badge"]');
  }

  /** Empty state message when no equipment exists */
  get emptyState() {
    return this.page.locator('[data-testid="equipment-empty"]');
  }
}

/**
 * Page Object Model for the hospital equipment create/edit form.
 *
 * WHY: Encapsulates form field interactions for equipment CRUD E2E tests.
 * The form uses #id selectors for all inputs (nameVi, nameEn, categoryId,
 * status, condition, criticality, serialNumber, model, manufacturer, location).
 *
 * vi: "Mô hình trang biểu mẫu thiết bị" / en: "Equipment form page object model"
 */
export class EquipmentFormPage {
  constructor(private readonly page: Page) {}

  async gotoNew(): Promise<void> {
    await this.page.goto("/hospital/equipment/new");
  }

  async gotoEdit(id: string): Promise<void> {
    await this.page.goto(`/hospital/equipment/${id}/edit`);
  }

  /** Vietnamese name input (#nameVi) */
  get nameViInput() {
    return this.page.locator("#nameVi");
  }

  /** English name input (#nameEn) */
  get nameEnInput() {
    return this.page.locator("#nameEn");
  }

  /** Category select (#categoryId) */
  get categorySelect() {
    return this.page.locator("#categoryId");
  }

  /** Status select (#status) */
  get statusSelect() {
    return this.page.locator("#status");
  }

  /** Condition select (#condition) */
  get conditionSelect() {
    return this.page.locator("#condition");
  }

  /** Criticality select (#criticality) */
  get criticalitySelect() {
    return this.page.locator("#criticality");
  }

  /** Serial number input (#serialNumber) */
  get serialNumberInput() {
    return this.page.locator("#serialNumber");
  }

  /** Form submit button */
  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  /**
   * Fill the basic name fields.
   *
   * WHY: Helper method extracts the common fill pattern to keep tests concise.
   */
  async fillBasicInfo(data: { nameVi: string; nameEn: string }): Promise<void> {
    await this.nameViInput.fill(data.nameVi);
    await this.nameEnInput.fill(data.nameEn);
  }
}
