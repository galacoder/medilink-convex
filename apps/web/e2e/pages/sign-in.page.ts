import type {Page} from "@playwright/test";

/**
 * Page Object Model for the sign-in page (/sign-in).
 *
 * WHY: Encapsulates sign-in form selectors for reuse across tests that
 * need to re-authenticate (e.g., after session expiry).
 */
export class SignInPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/sign-in");
  }

  async fillForm(data: { email: string; password: string }): Promise<void> {
    await this.page.fill("#email", data.email);
    await this.page.fill("#password", data.password);
  }

  async submit(): Promise<void> {
    await this.page.click('button[type="submit"]');
  }

  async waitForDashboard(orgType: "hospital" | "provider"): Promise<void> {
    await this.page.waitForURL(`**/${orgType}/dashboard`, { timeout: 20000 });
  }

  getErrorMessage() {
    return this.page.locator('[class*="bg-destructive"]');
  }
}
