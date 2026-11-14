import { expect, test } from "@playwright/test";

test("the public shell loads without runtime errors or horizontal overflow", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  await expect(page).toHaveTitle("ICG — Integrated Communications Group");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "ICG", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/shell-${test.info().project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("legacy PHP source is not served by the new application", async ({ request }) => {
  for (const path of ["/index.php", "/php-backend/connect.php", "/design/tokens.css"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("<?php");
  }
});
