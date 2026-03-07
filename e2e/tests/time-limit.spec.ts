import { test, expect, type Browser } from "@playwright/test";
import * as path from "node:path";

const FIXTURE_PATH = path.resolve(__dirname, "../../fixtures/sample.txt");

async function setupLobby(browser: Browser) {
	const hostContext = await browser.newContext();
	const playerContext = await browser.newContext();
	const hostPage = await hostContext.newPage();
	const playerPage = await playerContext.newPage();

	await hostPage.goto("/host");
	const fileInput = hostPage.locator('input[type="file"]');
	await fileInput.setInputFiles(FIXTURE_PATH);
	await hostPage.getByRole("button", { name: "Upload Quiz" }).click();
	await expect(hostPage.getByText("Join Code")).toBeVisible({ timeout: 10000 });

	const joinCodeEl = hostPage.locator("text=/[A-Z0-9]{6}/").first();
	const joinCode = await joinCodeEl.textContent();
	expect(joinCode).toBeTruthy();

	await playerPage.goto("/play");
	await playerPage.getByPlaceholder("Enter 6-character code").fill(joinCode!);
	await playerPage.getByPlaceholder("Your name").fill("Alice");
	await playerPage.getByRole("button", { name: "Join Game" }).click();
	await expect(playerPage.getByRole("heading", { name: "Waiting for Players" })).toBeVisible({ timeout: 10000 });
	await expect(hostPage.getByText("1 player connected")).toBeVisible({ timeout: 5000 });

	return { hostContext, playerContext, hostPage, playerPage, joinCode: joinCode! };
}

test.describe("Question Time Limit", () => {
	test("host sets 15s time limit, player sees 15s on question screen", async ({ browser }) => {
		test.setTimeout(120_000);

		const { hostContext, playerContext, hostPage, playerPage } = await setupLobby(browser);

		try {
			// === Host: Set time limit to 15 seconds ===
			const timeLimitInput = hostPage.getByRole("spinbutton");
			await timeLimitInput.fill("15");
			// Wait for time_limit_set acknowledgment (input stays at 15, no error)
			await expect(hostPage.locator("#time-limit-error")).not.toBeVisible({ timeout: 3000 });

			// === Host: Start game ===
			await hostPage.getByRole("button", { name: /Start/i }).click();

			// === Player: Verify timer shows 15s on question screen ===
			await expect(playerPage.getByText("Question 1 of")).toBeVisible({ timeout: 15000 });
			const timer = playerPage.getByRole("timer");
			await expect(timer).toBeVisible();
			// Timer should start at 15 (or be counting down from 15)
			const timerText = await timer.textContent();
			const timerValue = Number(timerText?.trim());
			expect(timerValue).toBeGreaterThanOrEqual(1);
			expect(timerValue).toBeLessThanOrEqual(15);
		} finally {
			await hostContext.close();
			await playerContext.close();
		}
	});

	test("default time limit is 20s when host makes no change", async ({ browser }) => {
		test.setTimeout(120_000);

		const { hostContext, playerContext, hostPage, playerPage } = await setupLobby(browser);

		try {
			// Verify default input value is 20
			const timeLimitInput = hostPage.getByRole("spinbutton");
			await expect(timeLimitInput).toHaveValue("20");

			// === Host: Start game without changing time limit ===
			await hostPage.getByRole("button", { name: /Start/i }).click();

			// === Player: Verify timer starts at 20 ===
			await expect(playerPage.getByText("Question 1 of")).toBeVisible({ timeout: 15000 });
			const timer = playerPage.getByRole("timer");
			await expect(timer).toBeVisible();
			const timerText = await timer.textContent();
			const timerValue = Number(timerText?.trim());
			expect(timerValue).toBeGreaterThanOrEqual(1);
			expect(timerValue).toBeLessThanOrEqual(20);
		} finally {
			await hostContext.close();
			await playerContext.close();
		}
	});
});

test.describe("Host early close", () => {
	test("host clicks End Question before timer expires, question ends immediately", async ({
		browser,
	}) => {
		test.setTimeout(120_000);

		const { hostContext, playerContext, hostPage, playerPage } = await setupLobby(browser);

		try {
			// === Host: Set a long time limit so we can close early ===
			const timeLimitInput = hostPage.getByRole("spinbutton");
			await timeLimitInput.fill("60");

			// === Host: Start game ===
			await hostPage.getByRole("button", { name: /Start/i }).click();

			// === Host: Wait for question 1 to appear then click End Question ===
			await expect(hostPage.getByRole("button", { name: /End Question/i })).toBeVisible({ timeout: 15000 });
			await hostPage.getByRole("button", { name: /End Question/i }).click();

			// === Player: Question 2 should appear well before the 60s timer expires ===
			// This proves early close worked — without it, question 2 wouldn't appear for 60s
			await expect(playerPage.getByText("Question 2 of")).toBeVisible({ timeout: 15000 });
		} finally {
			await hostContext.close();
			await playerContext.close();
		}
	});
});
