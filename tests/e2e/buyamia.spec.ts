import { devices, expect, test } from "@playwright/test";

const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;

async function login(page: import("@playwright/test").Page, email: string, password = "Password123!") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard\//);
}

test("public homepage, category navigation, live details, and copy link work", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Buyamia live access/i })).toBeVisible();
  await page.getByRole("link", { name: /Explore live streams/i }).first().click();
  await expect(page).toHaveURL(/\/live/);
  await expect(page.getByRole("heading", { name: /Stored live streams and replays/i })).toBeVisible();
  await page.getByRole("link", { name: "Services" }).first().click();
  await expect(page).toHaveURL(/category=Services/);
  await page.getByRole("link", { name: /View details|Watch live|View replay/ }).first().click();
  await expect(page).toHaveURL(/\/live\/.+/);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy live link" }).click();
  await expect(page.getByText("Live link copied.")).toBeVisible();
});

test("signup validation, account creation, refresh persistence, and logout work", async ({ page }) => {
  await page.goto("/signup");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();

  const email = uniqueEmail("viewer");
  await page.getByLabel("Name").fill("E2E Viewer");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[type="password"]').first().fill("Password123!");
  await page.locator('input[type="password"]').nth(1).fill("Password123!");
  await page.getByRole("button", { name: "Viewer" }).click();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard\/viewer/);
  await page.reload();
  await expect(page.getByText(/E2E Viewer - viewer/)).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Duplicate Viewer");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[type="password"]').first().fill("Password123!");
  await page.locator('input[type="password"]').nth(1).fill("Password123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("An account already exists with this email address.")).toBeVisible();
});

test("role dashboards are guarded and main admin can reach all dashboards", async ({ page }) => {
  await login(page, "viewer@example.test");
  await page.goto("/dashboard/supplier");
  await expect(page.getByText("Access denied")).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to your dashboard" })).toHaveAttribute("href", "/dashboard/viewer");

  await page.getByRole("button", { name: "Logout" }).click();
  await login(page, "admin@example.test", "ChangeMe123!");
  for (const route of ["/dashboard/main", "/dashboard/hotel", "/dashboard/restaurant", "/dashboard/supplier", "/dashboard/services", "/dashboard/viewer"]) {
    await page.goto(route);
    await expect(page.getByText(/Buyamia Main Admin - main admin/)).toBeVisible();
  }
});

test("provider live request persists and admin can review it", async ({ page }) => {
  await login(page, "hotel@example.test");
  await page.goto("/dashboard/hotel");
  const requestTitle = `E2E suite request ${Date.now()}`;
  await page.getByRole("button", { name: "Create a live request" }).click();
  await page.getByLabel("Title").fill(requestTitle);
  await page.getByLabel("Category").selectOption("Rooms");
  await page.getByLabel("Description").fill("Persistent e2e live request.");
  await page.getByLabel("Preferred date").fill("2026-12-31");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Your live request has been submitted for review.")).toBeVisible();
  await expect(page.getByText(requestTitle)).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await login(page, "admin@example.test", "ChangeMe123!");
  await page.goto("/dashboard/main");
  const requestCard = page.locator("article").filter({ hasText: requestTitle }).first();
  await expect(requestCard).toBeVisible();
  await requestCard.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approve live request saved.")).toBeVisible();
});

test("viewer can follow and unfollow providers", async ({ page }) => {
  await login(page, "viewer@example.test");
  await page.goto("/dashboard/viewer");
  const follow = page.getByRole("button", { name: "Follow" }).first();
  if (await follow.isVisible().catch(() => false)) {
    await follow.click();
    await expect(page.getByText("Follow provider saved.")).toBeVisible();
  }
  await page.getByRole("button", { name: "Unfollow" }).first().click();
  await expect(page.getByText("Unfollow provider saved.")).toBeVisible();
});

test("known internal routes do not show 404 or 500", async ({ page }) => {
  const routes = ["/", "/live", "/signup", "/login", "/dashboard/main", "/dashboard/hotel", "/dashboard/restaurant", "/dashboard/supplier", "/dashboard/services", "/dashboard/viewer"];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(500);
    await expect(page.getByText(/Application error|Page not found/)).toHaveCount(0);
  }
});

test("mobile viewport renders public navigation and live catalogue", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Pixel 5"] });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Explore live streams/i }).first()).toBeVisible();
  await page.getByRole("link", { name: /Explore live streams/i }).first().click();
  await expect(page.getByRole("heading", { name: /Stored live streams and replays/i })).toBeVisible();
  await context.close();
});
