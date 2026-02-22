import { test, expect } from "@playwright/test";

test.describe("Player Flow", () => {
	test("player sees join form with avatar preview button and no inline emoji grid", async ({ page }) => {
		await page.goto("/play");

		await expect(page.getByText("Join a Game")).toBeVisible();
		await expect(page.getByPlaceholder("Enter 6-character code")).toBeVisible();
		await expect(page.getByPlaceholder("Your name")).toBeVisible();
		// Avatar preview button is present
		await expect(page.getByRole("button", { name: "Choose avatar" })).toBeVisible();
		// No inline emoji grid on the page
		const emojiButtons = page.locator(".emoji-picker button");
		await expect(emojiButtons).toHaveCount(0);
	});

	test("player can select emoji via modal and preview updates", async ({ page }) => {
		await page.goto("/play");

		// Default preview shows 🙂
		const previewBtn = page.getByRole("button", { name: "Choose avatar" });
		await expect(previewBtn).toContainText("🙂");

		// Click preview to open modal
		await previewBtn.click();
		await expect(page.getByRole("dialog")).toBeVisible();

		// Click lion emoji in modal
		await page.getByRole("dialog").getByText("🦁").click();

		// Modal closes
		await expect(page.getByRole("dialog")).not.toBeVisible();

		// Preview now shows 🦁
		await expect(previewBtn).toContainText("🦁");
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
