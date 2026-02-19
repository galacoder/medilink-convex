/**
 * Vitest test setup file for the web app.
 *
 * WHY: @testing-library/jest-dom extends expect() with DOM-specific matchers
 * like toBeInTheDocument(), toHaveClass(), etc. Importing here ensures all
 * test files have access to these matchers automatically via the
 * setupFiles configuration in vitest.config.ts.
 */
import "@testing-library/jest-dom";
