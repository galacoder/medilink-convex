import type { Page } from "@playwright/test";

import { expect, test } from "../../fixtures/hospital";
import { QRScannerPage } from "../../pages/hospital/qr-scanner.page";

/**
 * Hospital QR scanner page E2E tests.
 *
 * WHY: The QR scanner page is the primary mobile interface for staff to
 * look up equipment. These tests verify:
 *   1. The page loads and renders the scanner container
 *   2. The manual entry fallback is accessible when camera is unavailable
 *   3. The toggle between camera and manual entry works
 *
 * Camera mocking: CI environments have no physical camera. We mock
 * `navigator.mediaDevices.getUserMedia` via page.addInitScript to prevent
 * the camera permission error from blocking the UI from rendering.
 *
 * Uses the hospitalPage auth fixture (pre-authenticated via global-setup).
 *
 * vi: "Kiểm tra E2E trang quét mã QR" / en: "QR scanner page E2E tests"
 */

/**
 * Mock the browser camera API to prevent permission errors in CI.
 *
 * WHY: html5-qrcode calls navigator.mediaDevices.getUserMedia when starting
 * the scanner. In headless CI environments, this call fails with
 * "NotAllowedError: Permission denied" which causes the UI to show the
 * error state instead of the scanner container. By providing a mock
 * MediaStream, we allow the scanner component to render its container
 * while the actual decode loop is simulated.
 */
async function mockCameraAPI(page: Page) {
  await page.addInitScript(() => {
    // Create a minimal MediaStream mock that html5-qrcode accepts
    const mockStream = {
      getTracks: () => [
        {
          stop: () => {
            // no-op cleanup
          },
          kind: "video",
          enabled: true,
        },
      ],
      getVideoTracks: () => [
        {
          stop: () => {
            // no-op cleanup
          },
          kind: "video",
          enabled: true,
        },
      ],
      getAudioTracks: () => [],
    };

    // Override getUserMedia to always resolve with the mock stream
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: () => Promise.resolve(mockStream),
        enumerateDevices: () =>
          Promise.resolve([
            {
              kind: "videoinput",
              deviceId: "mock-camera",
              label: "Mock Camera",
              groupId: "mock-group",
            },
          ]),
      },
      writable: true,
    });
  });
}

test.describe("QR Scanner", () => {
  /**
   * Test: Hospital user can view scanner page.
   *
   * WHY: Confirms that:
   * 1. Auth session is valid (middleware allows /hospital/scan access)
   * 2. The scan page component renders without crashing
   * 3. The page heading is visible in Vietnamese
   */
  test("hospital user can view scanner page", async ({ hospitalPage }) => {
    await mockCameraAPI(hospitalPage);

    const scannerPage = new QRScannerPage(hospitalPage);
    await scannerPage.goto();

    // Should not be redirected to sign-in
    await expect(hospitalPage).toHaveURL(/\/hospital\/scan/, {
      timeout: 15000,
    });

    // Main scan page container should be present
    await expect(scannerPage.scanPage).toBeVisible({ timeout: 10000 });

    // Page heading should display the Vietnamese title
    await expect(hospitalPage.locator("h1")).toContainText("Quét mã QR");
  });

  /**
   * Test: Manual entry fallback is accessible.
   *
   * WHY: Staff may use desktop computers or devices with camera access
   * blocked by policy. The manual entry fallback ensures they can still
   * look up equipment by ID without the camera.
   */
  test("manual entry fallback is accessible", async ({ hospitalPage }) => {
    await mockCameraAPI(hospitalPage);

    const scannerPage = new QRScannerPage(hospitalPage);
    await scannerPage.goto();

    await expect(hospitalPage).toHaveURL(/\/hospital\/scan/, {
      timeout: 15000,
    });

    // Toggle to manual entry mode
    await expect(scannerPage.toggleManualButton).toBeVisible({
      timeout: 10000,
    });
    await scannerPage.switchToManualEntry();

    // Manual entry components should now be visible
    await expect(scannerPage.fallbackInput).toBeVisible({ timeout: 5000 });
    await expect(scannerPage.fallbackSubmit).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test: Toggle between camera and manual entry.
   *
   * WHY: The toggle button allows users to switch between camera mode
   * (primary) and manual entry (fallback). This tests the state management
   * of the toggle and that both modes can be accessed interchangeably.
   */
  test("scanner container is present when camera mode is active", async ({
    hospitalPage,
  }) => {
    await mockCameraAPI(hospitalPage);

    const scannerPage = new QRScannerPage(hospitalPage);
    await scannerPage.goto();

    await expect(hospitalPage).toHaveURL(/\/hospital\/scan/, {
      timeout: 15000,
    });

    // In camera mode (default), scanner container should be present
    await expect(scannerPage.scannerContainer).toBeVisible({ timeout: 10000 });

    // Switch to manual, then back to camera
    await scannerPage.switchToManualEntry();
    await expect(scannerPage.fallbackInput).toBeVisible({ timeout: 5000 });

    // Toggle back to camera mode
    await scannerPage.toggleManualButton.click();
    await expect(scannerPage.scannerContainer).toBeVisible({ timeout: 5000 });
  });
});

/**
 * QR Scanner manual ID lookup tests (AC-2).
 *
 * WHY: Staff in desktop environments or with camera-restricted policies
 * rely on manual ID entry to look up equipment. This path must process
 * user input without crashing or hanging, even for unknown equipment IDs.
 */
test.describe("QR Scanner manual ID lookup", () => {
  /**
   * Test (AC-2): Manual entry with any ID processes without crash.
   *
   * WHY: Verifies the manual entry form submits and the system handles
   * the result gracefully -- either navigating to equipment detail (if found)
   * or staying on the scan page (if not found). Both are valid outcomes;
   * the test asserts no crash occurs.
   */
  test("manual entry with valid ID navigates or shows result", async ({
    hospitalPage,
  }) => {
    await mockCameraAPI(hospitalPage);

    const scannerPage = new QRScannerPage(hospitalPage);
    await scannerPage.goto();

    await expect(hospitalPage).toHaveURL(/\/hospital\/scan/, {
      timeout: 15000,
    });

    // Switch to manual entry mode
    await scannerPage.switchToManualEntry();
    await expect(scannerPage.fallbackInput).toBeVisible({ timeout: 5000 });

    // Submit a test equipment ID (may not exist, but tests the interaction)
    await scannerPage.submitManualId("test-equipment-id");

    // Either navigates to equipment page or stays on scan page (not found)
    // We verify the submission was processed without crash/hang
    await hospitalPage.waitForTimeout(2000);
    const url = hospitalPage.url();
    // Should either stay on scan page (not found) or navigate to equipment detail
    expect(url).toMatch(/\/(hospital\/scan|hospital\/equipment)/);
  });
});
