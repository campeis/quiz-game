import { test, expect } from "@playwright/test";
import * as path from "node:path";

const FIXTURE_PATH = path.resolve(__dirname, "../../fixtures/sample.txt");

test.describe("Host Flow", () => {
	test("host can upload quiz and see lobby", async ({ page }) => {
		await page.goto("/host");

		await expect(page.getByText("Host a Quiz")).toBeVisible();
		await expect(page.getByText("Upload Quiz File")).toBeVisible();

		// Upload quiz file
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(FIXTURE_PATH);
		await page.getByRole("button", { name: "Upload Quiz" }).click();

		// Should transition to lobby
		await expect(page.getByText("Join Code")).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("Waiting for players")).toBeVisible();
	});

	test("host can navigate from home page", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByText("Quiz Game")).toBeVisible();
		await page.getByRole("button", { name: "Host a Quiz" }).click();

		await expect(page).toHaveURL("/host");
		await expect(page.getByText("Upload Quiz File")).toBeVisible();
	});
});
