import { expect, test } from "@playwright/test";

test("form controls keep a 16px font size at mobile and desktop widths", async ({ page }) => {
  test.setTimeout(90_000);

  async function expectSixteenPixelFields() {
    const sizes = await page.locator("input, select, textarea").evaluateAll((fields) =>
      fields.map((field) => ({
        element: field.tagName.toLowerCase(),
        type: field.getAttribute("type"),
        fontSize: getComputedStyle(field).fontSize,
      })),
    );

    expect(sizes.length).toBeGreaterThan(0);
    for (const field of sizes) {
      expect(field.fontSize, `${field.element} (${field.type ?? "default"})`).toBe("16px");
    }
  }

  await page.route("**/api/auth/providers", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ providers: { email: true, phone: true, google: false } }),
    }),
  );

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Find my footprint" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Sign in to Trace" });
    await expect(dialog).toBeVisible();
    await expectSixteenPixelFields();

    await dialog.getByRole("button", { name: "Phone number", exact: true }).click();
    await dialog.getByRole("button", { name: "Choose country calling code" }).click();
    await expect(
      dialog.getByRole("combobox", { name: "Search country or calling code" }),
    ).toBeVisible();
    await expectSixteenPixelFields();

    await page.goto("/dashboard?demo=1");
    await page.getByRole("button", { name: "Your accounts", exact: true }).first().click();
    await expect(page.getByRole("combobox", { name: "Filter account category" })).toBeVisible();
    await expectSixteenPixelFields();
  }
});
