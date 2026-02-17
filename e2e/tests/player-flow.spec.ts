import { test, expect } from "@playwright/test";

test.describe("Player Flow", () => {
	test("player sees join form", async ({ page }) => {
		await page.goto("/play");

		await expect(page.getByText("Join a Game")).toBeVisible();
		await expect(page.getByPlaceholder("Enter 6-character code")).toBeVisible();
		await expect(page.getByPlaceholder("Your name")).toBeVisible();
	});

	test("player gets error for invalid join code", async ({ page }) => {
		await page.goto("/play");

		await page.getByPlaceholder("Enter 6-character code").fill("XXXXXX");
		await page.getByPlaceholder("Your name").fill("TestPlayer");
		await page.getByRole("button", { name: "Join Game" }).click();

		await expect(page.getByText(/Failed|not found/i)).toBeVisible({ timeout: 10000 });
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
		await expect(page.getByText("Join a Game")).toBeVisible();
	});
});
