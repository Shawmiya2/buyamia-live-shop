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
  await expect(page.getByRole("link", { name: "Login" }).first()).toHaveAttribute("href", "/login");
  await expect(page.getByRole("heading", { name: "Featured Supplier Sessions" })).toBeVisible();
  for (const category of ["Recommended", "Popular", "Nearby", "Sponsored", "New verified suppliers"]) {
    await expect(page.getByRole("link", { name: category })).toBeVisible();
  }
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
  for (const route of ["/dashboard/main", "/dashboard/procurement-agent", "/dashboard/hotel", "/dashboard/restaurant", "/dashboard/supplier", "/dashboard/services", "/dashboard/viewer"]) {
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
  await expect(page.getByRole("link", { name: "View full catalogue" })).toHaveAttribute("href", "/dashboard/main/live-requests");
  const requestCard = page.locator("article").filter({ hasText: requestTitle }).first();
  await expect(requestCard).toBeVisible();
  await requestCard.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approve live request saved.")).toBeVisible();
});

test("main admin manages paginated lives with persistent filters and details", async ({ page }) => {
  await login(page, "admin@example.test", "ChangeMe123!");
  await page.goto("/dashboard/main");
  await page.getByRole("link", { name: "Manage all lives" }).click();
  await expect(page).toHaveURL(/\/dashboard\/main\/lives/);
  await expect(page.getByRole("heading", { name: "Backend live controls" })).toBeVisible();

  await page.getByLabel("Search").fill("replay");
  await page.locator('select[name="status"]').selectOption("replay");
  await page.getByLabel("Provider role").selectOption("hotel");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/search=replay/);
  await expect(page).toHaveURL(/status=replay/);
  await expect(page).toHaveURL(/providerRole=hotel/);
  await page.reload();
  await expect(page.getByLabel("Search")).toHaveValue("replay");
  await expect(page.locator('select[name="status"]')).toHaveValue("replay");
  await expect(page.getByLabel("Provider role")).toHaveValue("hotel");

  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/dashboard\/main\/lives$/);
  await page.getByRole("link", { name: "Details" }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/main\/lives\/.+/);
  await expect(page.getByRole("heading", { name: /live/i })).toBeVisible();
  await expect(page.getByText("Replay expiration")).toBeVisible();
});

test("non-admin dashboards hide admin controls and keep role-owned content", async ({ page }) => {
  const cases = [
    {
      email: "service@example.test",
      route: "/dashboard/services",
      heading: /Services dashboard/i,
      roleText: /service provider/i,
    },
    {
      email: "hotel@example.test",
      route: "/dashboard/hotel",
      heading: /Hotel dashboard/i,
      roleText: /hotel/i,
    },
    {
      email: "restaurant@example.test",
      route: "/dashboard/restaurant",
      heading: /Restaurant dashboard/i,
      roleText: /restaurant/i,
    },
    {
      email: "supplier@example.test",
      route: "/dashboard/supplier",
      heading: /Supplier dashboard/i,
      roleText: /supplier/i,
    },
  ];

  for (const item of cases) {
    await login(page, item.email);
    await page.goto(item.route);
    await expect(page.getByRole("heading", { name: item.heading })).toBeVisible();
    await expect(page.getByText(item.roleText).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Main dashboard" })).toHaveCount(0);
    await expect(page.getByText("Backend live controls")).toHaveCount(0);
    await expect(page.getByText("Manage all lives")).toHaveCount(0);
    await expect(page.getByText("API analytics")).toHaveCount(0);
    await expect(page.getByText("Main admin review")).toHaveCount(0);
    await expect(page.getByText("Pending live requests")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Pin live" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Unpin" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Extend replay by 5 days" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reject" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Request more information" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Schedule" })).toHaveCount(0);
    await expect(page.getByText("Your live requests")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create a live request" })).toBeVisible();
    await page.getByRole("button", { name: "Logout" }).click();
  }
});

test("viewer dashboard hides provider and admin mutation controls", async ({ page }) => {
  await login(page, "viewer@example.test");
  await page.goto("/dashboard/viewer");
  await expect(page.getByRole("heading", { name: /Traveler dashboard/i })).toBeVisible();
  await expect(page.getByText("Followed providers and feeds")).toBeVisible();
  await expect(page.getByText("Backend live controls")).toHaveCount(0);
  await expect(page.getByText("Manage all lives")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create a live request" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pin live" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
});

test("main admin dashboard shows global admin controls", async ({ page }) => {
  await login(page, "admin@example.test", "ChangeMe123!");
  await page.goto("/dashboard/main");
  await expect(page.getByText("Backend live controls")).toBeVisible();
  await expect(page.getByText("Manage all lives")).toBeVisible();
  await expect(page.getByText("Main admin review")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pending live requests" })).toBeVisible();
  await expect(page.getByText("API analytics")).toBeVisible();
  await expect(page.getByText("Review pending live requests")).toBeVisible();
});

test("direct admin dashboard and API access is denied for providers", async ({ page }) => {
  await login(page, "supplier@example.test");

  for (const route of ["/dashboard/main", "/dashboard/main/lives", "/dashboard/main/live-requests"]) {
    await page.goto(route);
    await expect(page.getByText(/Access denied|You are not allowed/i).first()).toBeVisible();
  }

  for (const route of ["/api/dashboard/main", "/api/analytics/main", "/api/admin/live-requests"]) {
    const response = await page.request.get(route);
    expect(response.status(), route).toBe(403);
  }
});

test("main admin live request catalogue renders and filters without crashing", async ({ page }) => {
  await login(page, "admin@example.test", "ChangeMe123!");
  await page.goto("/dashboard/main");
  await page.getByRole("link", { name: "View full catalogue" }).click();
  await expect(page).toHaveURL(/\/dashboard\/main\/live-requests/);
  await expect(page.getByRole("heading", { name: "Live request catalogue" })).toBeVisible();

  await page.getByLabel("Search").fill("suite");
  await page.locator('select[name="status"]').selectOption("pending_review");
  await page.getByLabel("Provider role").selectOption("hotel");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/search=suite/);
  await expect(page).toHaveURL(/status=pending_review/);
  await expect(page).toHaveURL(/providerRole=hotel/);
  await expect(page.getByText(/Application error|Page not found/)).toHaveCount(0);
});

test("main admin submits an RFQ without runtime errors and sees it in the list", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await login(page, "admin@example.test", "ChangeMe123!");
  await page.goto("/dashboard/main/rfqs/new");

  const title = `E2E RFQ ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Category").fill("Outdoor furniture");
  await page.getByLabel("Requirements").fill("Supply weather-resistant lounge chairs, side tables, and replacement cushions for resort pool areas.");
  await page.getByLabel("Budget min").fill("1000");
  await page.getByLabel("Budget max").fill("2500");
  await page.getByLabel("Deadline").fill("2026-12-31");
  await page.getByLabel("Supplier type").selectOption("supplier");
  await page.getByRole("button", { name: "Create RFQ" }).click();

  await expect(page.getByText(`RFQ created: ${title}`)).toBeVisible();
  await expect(pageErrors).toEqual([]);
  await expect(page.getByRole("link", { name: "View all RFQs" })).toHaveAttribute("href", "/dashboard/main/rfqs");
  await expect(page.getByLabel("Title")).toHaveValue("");
  await expect(page.getByLabel("Category")).toHaveValue("");
  await expect(page.getByLabel("Requirements")).toHaveValue("");
  await expect(page.getByLabel("Budget min")).toHaveValue("");
  await expect(page.getByLabel("Budget max")).toHaveValue("");
  await expect(page.getByLabel("Deadline")).toHaveValue("");
  await expect(page.getByLabel("Supplier type")).toHaveValue("");

  await page.getByRole("link", { name: "View all RFQs" }).click();
  await expect(page).toHaveURL(/\/dashboard\/main\/rfqs$/);
  await expect(page.getByRole("heading", { name: "RFQs" })).toBeVisible();
  await expect(page.getByText(title)).toBeVisible();
});

test("Buyamia Assistant opens, searches, handles commands, and respects role restrictions", async ({ page }) => {
  await login(page, "admin@example.test", "ChangeMe123!");
  await page.goto("/dashboard/main");

  await page.getByRole("button", { name: "Open Buyamia Assistant" }).click();
  await expect(page.getByRole("dialog", { name: "Buyamia Assistant" })).toBeVisible();
  await expect(page.getByLabel("Assistant query")).toBeFocused();

  await page.getByLabel("Assistant query").fill("Manage lives");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("link", { name: /Manage lives/ })).toHaveAttribute("href", "/dashboard/main/lives");

  await page.getByLabel("Assistant query").fill("Find hotel lives");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Results")).toBeVisible();
  await expect(page.locator('a[href^="/dashboard/main/lives/"], a[href^="/live/"]').first()).toBeVisible();

  await page.getByLabel("Assistant query").fill("unknown command with no match");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(/could not match/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Show available commands" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Buyamia Assistant" })).toHaveCount(0);

  await page.keyboard.press("Control+K");
  await expect(page.getByRole("dialog", { name: "Buyamia Assistant" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Logout" }).click();
  await login(page, "viewer@example.test");
  await page.goto("/dashboard/viewer");
  await page.getByRole("button", { name: "Open Buyamia Assistant" }).click();
  await page.getByLabel("Assistant query").fill("Manage lives");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("link", { name: /Manage lives/ })).toHaveCount(0);
  await expect(page.getByText(/could not match/i)).toBeVisible();
});

test("AI integration status page reports local assistant mode without secrets", async ({ page }) => {
  await page.goto("/settings/integrations/ai");
  await expect(page.getByRole("heading", { name: "Buyamia Assistant status" })).toBeVisible();
  await expect(page.getByText(/Local assistant|Provider adapter/)).toBeVisible();
  await expect(page.getByText("No secrets are shown here")).toBeVisible();
  await expect(page.getByText(/OPENAI_API_KEY|BUYAMIA_AI_PROVIDER/)).toHaveCount(0);
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
  const routes = ["/", "/live", "/signup", "/login", "/dashboard/main", "/dashboard/procurement-agent", "/dashboard/hotel", "/dashboard/restaurant", "/dashboard/supplier", "/dashboard/services", "/dashboard/viewer"];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(500);
    await expect(page.getByText(/Application error|Page not found/)).toHaveCount(0);
  }
});

test("main admin live routes do not show unexpected 404", async ({ page }) => {
  await login(page, "admin@example.test", "ChangeMe123!");
  const response = await page.goto("/dashboard/main/lives");
  expect(response?.status()).toBeLessThan(500);
  await expect(page.getByText(/Application error|Page not found/)).toHaveCount(0);
  await page.getByRole("link", { name: "Details" }).first().click();
  await expect(page.getByText(/Application error|Page not found/)).toHaveCount(0);
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
