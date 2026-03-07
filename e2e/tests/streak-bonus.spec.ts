import { type Browser, type Page, expect, test } from "@playwright/test";
import * as path from "node:path";

const FIXTURE_PATH = path.resolve(__dirname, "../../fixtures/sample.txt");

// fixture/sample.txt question order and correct indices:
// Q1: "What is the capital of France?" → * Paris   = index 2
// Q2: "How many continents are there?" → * 7       = index 1
// Q3: "Which planet is closest to Sun?"→ * Mercury = index 0

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
	await expect(
		playerPage.getByRole("heading", { name: "Waiting for Players" }),
	).toBeVisible({ timeout: 10000 });
	await expect(hostPage.getByText("1 player connected")).toBeVisible({ timeout: 5000 });

	// Select Streak Bonus
	await hostPage.getByRole("radio", { name: /Streak Bonus/i }).click();
	await expect(
		hostPage.getByRole("radio", { name: /Streak Bonus/i }),
	).toBeChecked({ timeout: 5000 });

	return { hostContext, playerContext, hostPage, playerPage, joinCode: joinCode! };
}

async function clickOption(playerPage: Page, index: number) {
	const options = playerPage.locator('button[aria-label^="Answer option"]:not([disabled])');
	await options.nth(index).click();
}

test.describe("Streak Bonus Scoring Rule", () => {
	test("host can select Streak Bonus and it appears as label on question screen", async ({
		browser,
	}) => {
		test.setTimeout(120_000);

		const { hostContext, playerContext, hostPage, playerPage } = await setupLobby(browser);

		try {
			await hostPage.getByRole("button", { name: /Start/i }).click();

			await expect(playerPage.getByText("Question 1 of")).toBeVisible({ timeout: 15000 });
			await expect(playerPage.getByText("Streak Bonus")).toBeVisible();
		} finally {
			await hostContext.close();
			await playerContext.close();
		}
	});

	test("first correct answer awards 1000 pts with no multiplier displayed", async ({
		browser,
	}) => {
		test.setTimeout(120_000);

		const { hostContext, playerContext, hostPage, playerPage } = await setupLobby(browser);

		try {
			await hostPage.getByRole("button", { name: /Start/i }).click();

			await expect(playerPage.getByText("Question 1 of")).toBeVisible({ timeout: 15000 });
			await clickOption(playerPage, 2); // Paris — correct for Q1

			await expect(playerPage.getByText("Correct!")).toBeVisible({ timeout: 10000 });
			await expect(playerPage.getByText("+1000 points")).toBeVisible();
			// No multiplier shown on first answer (streak=0, ×1.0 is suppressed)
			await expect(playerPage.getByText(/×\d/)).not.toBeVisible();
		} finally {
			await hostContext.close();
			await playerContext.close();
		}
	});

	test("incorrect answer resets the multiplier — next correct answer awards 1000 pts", async ({
		browser,
	}) => {
		test.setTimeout(120_000);

		const { hostContext, playerContext, hostPage, playerPage } = await setupLobby(browser);

		try {
			await hostPage.getByRole("button", { name: /Start/i }).click();

			// Q1: answer correctly → streak becomes 1, auto-advances to Q2
			await expect(playerPage.getByText("Question 1 of")).toBeVisible({ timeout: 15000 });
			await clickOption(playerPage, 2); // Paris — correct for Q1
			await expect(playerPage.getByText("Correct!")).toBeVisible({ timeout: 10000 });
			// streak=0 → ×1.0 → NOT shown
			await expect(playerPage.getByText(/×\d/)).not.toBeVisible();

			// Q2: answer incorrectly → streak resets to 0, auto-advances to Q3
			await expect(playerPage.getByText("Question 2 of")).toBeVisible({ timeout: 15000 });
			await clickOption(playerPage, 0); // "5" — incorrect for Q2 (correct is "7" = index 1)
			await expect(playerPage.getByText("Incorrect")).toBeVisible({ timeout: 10000 });
			// Multiplier NOT shown on incorrect answers
			await expect(playerPage.getByText(/×\d/)).not.toBeVisible();

			// Q3: answer correctly — streak was reset to 0, so ×1.0 → 1000 pts
			await expect(playerPage.getByText("Question 3 of")).toBeVisible({ timeout: 15000 });
			await clickOption(playerPage, 0); // Mercury — correct for Q3
			await expect(playerPage.getByText("Correct!")).toBeVisible({ timeout: 10000 });
			await expect(playerPage.getByText("+1000 points")).toBeVisible();
			// Streak was reset, multiplier is ×1.0 → NOT shown
			await expect(playerPage.getByText(/×\d/)).not.toBeVisible();
		} finally {
			await hostContext.close();
			await playerContext.close();
		}
	});

	test("timeout resets the multiplier — unanswered question resets streak", async ({
		browser,
	}) => {
		test.setTimeout(120_000);

		const { hostContext, playerContext, hostPage, playerPage } = await setupLobby(browser);

		try {
			await hostPage.getByRole("button", { name: /Start/i }).click();

			// Q1: answer correctly → streak becomes 1, auto-advances to Q2
			await expect(playerPage.getByText("Question 1 of")).toBeVisible({ timeout: 15000 });
			await clickOption(playerPage, 2); // Paris — correct for Q1
			await expect(playerPage.getByText("Correct!")).toBeVisible({ timeout: 10000 });

			// Q2: player does NOT answer — host ends question (simulating timeout)
			// do_end_question resets streak for unanswered players (StreakBonus rule)
			await expect(playerPage.getByText("Question 2 of")).toBeVisible({ timeout: 15000 });
			await hostPage.getByRole("button", { name: "End Question" }).click();

			// Q3: answer correctly — streak was reset by timeout → ×1.0 → 1000 pts
			await expect(playerPage.getByText("Question 3 of")).toBeVisible({ timeout: 15000 });
			await clickOption(playerPage, 0); // Mercury — correct for Q3
			await expect(playerPage.getByText("Correct!")).toBeVisible({ timeout: 10000 });
			await expect(playerPage.getByText("+1000 points")).toBeVisible();
			// Streak was reset by timeout, ×1.0 → NOT shown
			await expect(playerPage.getByText(/×\d/)).not.toBeVisible();
		} finally {
			await hostContext.close();
			await playerContext.close();
		}
	});
});
