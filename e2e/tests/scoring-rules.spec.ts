import { test, expect, type Page } from "@playwright/test";
import * as path from "node:path";

const FIXTURE_PATH = path.resolve(__dirname, "../../fixtures/sample.txt");

/** Click the first enabled answer option on a player page. */
async function answerQuestion(page: Page) {
	const options = page.locator('button[aria-label^="Answer option"]:not([disabled])');
	await options.first().click();
}

test.describe("Scoring Rules", () => {
	test("host selects Linear Decay and player sees label on question screen", async ({
		browser,
	}) => {
		test.setTimeout(120_000);

		const hostContext = await browser.newContext();
		const playerContext = await browser.newContext();

		const hostPage = await hostContext.newPage();
		const playerPage = await playerContext.newPage();

		try {
			// === Host: Upload quiz and reach lobby ===
			await hostPage.goto("/host");
			const fileInput = hostPage.locator('input[type="file"]');
			await fileInput.setInputFiles(FIXTURE_PATH);
			await hostPage.getByRole("button", { name: "Upload Quiz" }).click();

			await expect(hostPage.getByText("Join Code")).toBeVisible({ timeout: 10000 });

			const joinCodeEl = hostPage.locator("text=/[A-Z0-9]{6}/").first();
			const joinCode = await joinCodeEl.textContent();
			expect(joinCode).toBeTruthy();

			// === Host: Select Linear Decay scoring rule ===
			const linearDecayRadio = hostPage.getByRole("radio", { name: /Linear Decay/i });
			await linearDecayRadio.click();

			// Verify scoring_rule_set is reflected (radio checked)
			await expect(linearDecayRadio).toBeChecked({ timeout: 5000 });

			// === Player: Join game ===
			await playerPage.goto("/play");
			await playerPage.getByPlaceholder("Enter 6-character code").fill(joinCode!);
			await playerPage.getByPlaceholder("Your name").fill("Alice");
			await playerPage.getByRole("button", { name: "Join Game" }).click();

			await expect(
				playerPage.getByRole("heading", { name: "Waiting for Players" }),
			).toBeVisible({ timeout: 10000 });

			await expect(hostPage.getByText("1 player connected")).toBeVisible({ timeout: 5000 });

			// === Host: Start game ===
			await hostPage.getByRole("button", { name: /Start/i }).click();

			// === Player: Verify "Linear Decay" label is visible on question screen ===
			await expect(playerPage.getByText("Question 1 of")).toBeVisible({ timeout: 15000 });
			await expect(playerPage.getByText("Linear Decay")).toBeVisible();

			// === Player: Answer question correctly (first option) ===
			await answerQuestion(playerPage);

			// Verify result shown
			await expect(
				playerPage.getByText(/Correct!|Incorrect/).first(),
			).toBeVisible({ timeout: 10000 });
		} finally {
			await hostContext.close();
			await playerContext.close();
		}
	});

	test("Stepped Decay is selected by default and label shown on question screen", async ({
		browser,
	}) => {
		test.setTimeout(120_000);

		const hostContext = await browser.newContext();
		const playerContext = await browser.newContext();

		const hostPage = await hostContext.newPage();
		const playerPage = await playerContext.newPage();

		try {
			// === Host: Upload quiz (no rule change — default is Stepped Decay) ===
			await hostPage.goto("/host");
			const fileInput = hostPage.locator('input[type="file"]');
			await fileInput.setInputFiles(FIXTURE_PATH);
			await hostPage.getByRole("button", { name: "Upload Quiz" }).click();

			await expect(hostPage.getByText("Join Code")).toBeVisible({ timeout: 10000 });

			const joinCodeEl = hostPage.locator("text=/[A-Z0-9]{6}/").first();
			const joinCode = await joinCodeEl.textContent();
			expect(joinCode).toBeTruthy();

			// Verify default selection
			await expect(hostPage.getByRole("radio", { name: /Stepped Decay/i })).toBeChecked();

			// === Player: Join and verify label ===
			await playerPage.goto("/play");
			await playerPage.getByPlaceholder("Enter 6-character code").fill(joinCode!);
			await playerPage.getByPlaceholder("Your name").fill("Bob");
			await playerPage.getByRole("button", { name: "Join Game" }).click();

			await expect(
				playerPage.getByRole("heading", { name: "Waiting for Players" }),
			).toBeVisible({ timeout: 10000 });
			await expect(hostPage.getByText("1 player connected")).toBeVisible({ timeout: 5000 });

			await hostPage.getByRole("button", { name: /Start/i }).click();

			await expect(playerPage.getByText("Question 1 of")).toBeVisible({ timeout: 15000 });
			await expect(playerPage.getByText("Stepped Decay")).toBeVisible();
		} finally {
			await hostContext.close();
			await playerContext.close();
		}
	});
});
