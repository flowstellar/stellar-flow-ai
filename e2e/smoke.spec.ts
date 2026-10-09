import { test, expect } from "@playwright/test";

test.describe("landing page", () => {
  test("renders the headline and mount root",  async ({ page }) => {
    await page.goto("/");

    const root = page.locator("#root");
    await expect(root).toBeVisible();

    const headline = page.getByRole("heading", { level: 1 });
    await expect(headline).toBeVisible();
    await expect(headline).toHaveText(/.+/);
  });
});
