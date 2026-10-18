import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing, themes, verification entry, and country search work", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You’re online.Know where.");
  await page.getByRole("button", { name: "Toggle color theme" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Find my footprint" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Sign in to Trace" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Phone number", exact: true }).click();
  await dialog.getByRole("button", { name: "Choose country calling code" }).click();
  const country = page.getByRole("combobox", { name: "Search country or calling code" });
  await country.fill("South Africa");
  await country.press("Enter");
  await expect(dialog.getByRole("button", { name: "Choose country calling code" })).toContainText(
    "+27",
  );
  await dialog.getByRole("button", { name: "Email address", exact: true }).click();
  await dialog.getByLabel("Your email address").fill("owner@example.com");
  await dialog.getByRole("button", { name: "Send me a magic link" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Sign-in is not configured");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("demo accounts can be filtered, reviewed, imported, and exported", async ({ page }) => {
  await page.goto("/dashboard?demo=1");
  await expect(page.getByText("You’re exploring sample accounts and exposures.")).toBeVisible();
  await page.getByRole("button", { name: "Your accounts", exact: true }).first().click();
  await page.getByRole("textbox", { name: "Search accounts" }).fill("spotify");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Review Spotify", exact: true }).click();
  await page.getByRole("button", { name: "Mark as reviewed", exact: true }).click();
  await expect(page.locator("tbody")).toContainText("Reviewed");
  await page.getByRole("textbox", { name: "Search accounts" }).fill("");
  await page.getByRole("button", { name: /Needs attention/ }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "All accounts", exact: true }).click();
  await page.getByRole("combobox", { name: "Filter account category" }).selectOption("Social");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByRole("combobox", { name: "Filter account category" }).selectOption("all");
  await page.getByLabel("Import account CSV").setInputFiles({
    name: "accounts.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "url,username,password\nhttps://example.com,private@example.com,PRIVATE_PASSWORD",
    ),
  });
  await expect(page.getByRole("status")).toContainText("Imported 1 website domain");
  await expect(page.locator("tbody tr")).toHaveCount(13);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("trace-footprint.json");
  const stream = await download.createReadStream();
  let content = "";
  for await (const chunk of stream!) content += chunk.toString();
  expect(content).toContain("example.com");
  expect(content).not.toContain("PRIVATE_PASSWORD");
  expect(content).not.toContain("private@example.com");
});

test("protected entry and discovery refuse unverified access", async ({ page, request }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/auth=required/);
  await expect(page.getByRole("dialog", { name: "Sign in to Trace" })).toBeVisible();
  const response = await request.post("/api/discovery", {
    data: { email: "someone-else@example.com" },
    headers: { Origin: "http://localhost:3000" },
  });
  expect([401, 503]).toContain(response.status());
  const crossOrigin = await request.post("/api/discovery", {
    headers: { Origin: "https://other.example" },
  });
  expect(crossOrigin.status()).toBe(403);
  await page.goto("/auth/callback?code=invalid&next=https://other.example");
  await expect(page).toHaveURL(/auth=expired/);
  await expect(page.getByRole("alert").filter({ hasText: "expired" })).toBeVisible();
});

test("pages fit mobile, tablet, and desktop widths", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/dashboard?demo=1"]) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${path} overflows at ${width}px`,
      ).toBe(true);
    }
  }
});

test("both themes keep the landing and dashboard accessible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/dashboard?demo=1"]) {
    await page.goto(path);
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.setAttribute("data-theme", value);
      }, theme);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect
        .soft(
          result.violations,
          `${path} in ${theme}: ${JSON.stringify(result.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) })))}`,
        )
        .toEqual([]);
    }
  }
});

test("production PWA provides a public offline fallback without caching results", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.goto("/dashboard?demo=1");
  const cached = await page.evaluate(async () => {
    const cache = await caches.open("trace-public-v1");
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });
  expect(cached).toContain("/offline.html");
  expect(cached.some((path) => /dashboard|api|auth/.test(path))).toBe(false);
  await context.setOffline(true);
  await page.goto("/dashboard?demo=1");
  await expect(page.getByRole("heading", { name: "A little pause." })).toBeVisible();
  await expect(
    page.getByText("Your personal results aren’t stored in the offline cache.", { exact: false }),
  ).toBeVisible();
});
