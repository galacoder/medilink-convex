import type { Page } from "@playwright/test";

/**
 * Page Object Model for the sign-up page (/sign-up).
 *
 * WHY: Encapsulating selectors and actions in a POM makes tests read like
 * specifications and insulates them from CSS/ID changes. The actual selectors
 * match the sign-up form in apps/web/src/app/(auth)/sign-up/page.tsx:
 *   - #name      — Input[id="name"]
 *   - #email     — Input[id="email"]
 *   - #password  — Input[id="password"]
 *   - #hospital  — RadioGroupItem[id="hospital"]
 *   - #provider  — RadioGroupItem[id="provider"]
 *   - #orgName   — Input[id="orgName"]
 */
export class SignUpPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/sign-up");
  }

  async fillForm(data: {
    name: string;
    email: string;
    password: string;
    orgType: "hospital" | "provider";
    orgName: string;
  }): Promise<void> {
    await this.page.fill("#name", data.name);
    await this.page.fill("#email", data.email);
    await this.page.fill("#password", data.password);
    // RadioGroupItem renders with id equal to the value ("hospital" or "provider")
    await this.page.click(`#${data.orgType}`);
    await this.page.fill("#orgName", data.orgName);
  }

  async submit(): Promise<void> {
    await this.page.click('button[type="submit"]');
  }

  async waitForDashboard(orgType: "hospital" | "provider"): Promise<void> {
    await this.page.waitForURL(`**/${orgType}/dashboard`, { timeout: 20000 });
  }

  getErrorMessage() {
    // The error div uses bg-destructive/10 class — match by role or content
    return this.page.locator('[class*="bg-destructive"]');
  }
}
