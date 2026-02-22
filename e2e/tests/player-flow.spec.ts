import { test, expect } from "@playwright/test";

test.describe("Player Flow", () => {
	test("player sees join form with emoji picker", async ({ page }) => {
		await page.goto("/play");

		await expect(page.getByText("Join a Game")).toBeVisible();
		await expect(page.getByPlaceholder("Enter 6-character code")).toBeVisible();
		await expect(page.getByPlaceholder("Your name")).toBeVisible();
		// EmojiPicker renders 30 buttons
		const emojiButtons = page.locator(".emoji-picker button");
		await expect(emojiButtons).toHaveCount(30);
	});

	test("player can select emoji and it gets highlighted", async ({ page }) => {
		await page.goto("/play");

		// Click the lion emoji
		await page.getByText("🦁").click();

		// The button should have aria-pressed="true"
		const lionButton = page.locator("button", { hasText: "🦁" });
		await expect(lionButton).toHaveAttribute("aria-pressed", "true");
	});

	test("player gets error for invalid join code", async ({ page }) => {
		await page.goto("/play");

		await page.getByPlaceholder("Enter 6-character code").fill("XXXXXX");
		await page.getByPlaceholder("Your name").fill("TestPlayer");
		await page.getByRole("button", { name: "Join Game" }).click();

		await expect(page.getByText(/No active game session/i)).toBeVisible({ timeout: 10000 });
	});

	test("player gets validation error without name", async ({ page }) => {
		await page.goto("/play");

		await page.getByPlaceholder("Enter 6-character code").fill("ABCDEF");
		await page.getByRole("button", { name: "Join Game" }).click();

		await expect(page.getByText("Please enter a display name")).toBeVisible();
	});

	test("player can navigate from home page", async ({ page }) => {
		await page.goto("/");

		await page.getByRole("button", { name: "Join a Game" }).click();

		await expect(page).toHaveURL("/play");
		await expect(page.getByRole("heading", { name: "Join a Game" })).toBeVisible();
	});
});
