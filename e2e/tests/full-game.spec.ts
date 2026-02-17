import { test, expect, type Page } from "@playwright/test";
import * as path from "node:path";

const FIXTURE_PATH = path.resolve(__dirname, "../../fixtures/sample.txt");
const TOTAL_QUESTIONS = 5;

/** Click the first enabled answer option on a player page. */
async function answerQuestion(page: Page) {
	const options = page.locator('button[aria-label^="Answer option"]:not([disabled])');
	await options.first().click();
}

/**
 * Full multiplayer game E2E test.
 *
 * Flow: Host uploads quiz → creates session → 2 players join →
 * host starts game → players answer all questions → final leaderboard shown.
 */
test.describe("Full Multiplayer Game", () => {
	test("complete game with host and 2 players", async ({ browser }) => {
		test.setTimeout(120_000);

		const hostContext = await browser.newContext();
		const player1Context = await browser.newContext();
		const player2Context = await browser.newContext();

		const hostPage = await hostContext.newPage();
		const player1Page = await player1Context.newPage();
		const player2Page = await player2Context.newPage();

		try {
			// === Host: Upload quiz ===
			await hostPage.goto("/host");
			const fileInput = hostPage.locator('input[type="file"]');
			await fileInput.setInputFiles(FIXTURE_PATH);
			await hostPage.getByRole("button", { name: "Upload Quiz" }).click();

			await expect(hostPage.getByText("Join Code")).toBeVisible({ timeout: 10000 });

			const joinCodeEl = hostPage.locator("text=/[A-Z0-9]{6}/").first();
			const joinCode = await joinCodeEl.textContent();
			expect(joinCode).toBeTruthy();
			expect(joinCode).toMatch(/^[A-Z0-9]{6}$/);

			// === Player 1: Join ===
			await player1Page.goto("/play");
			await player1Page.getByPlaceholder("Enter 6-character code").fill(joinCode!);
			await player1Page.getByPlaceholder("Your name").fill("Alice");
			await player1Page.getByRole("button", { name: "Join Game" }).click();

			await expect(player1Page.getByRole("heading", { name: "Waiting for Players" })).toBeVisible({ timeout: 10000 });

			// === Player 2: Join ===
			await player2Page.goto("/play");
			await player2Page.getByPlaceholder("Enter 6-character code").fill(joinCode!);
			await player2Page.getByPlaceholder("Your name").fill("Bob");
			await player2Page.getByRole("button", { name: "Join Game" }).click();

			await expect(player2Page.getByRole("heading", { name: "Waiting for Players" })).toBeVisible({ timeout: 10000 });
			await expect(hostPage.getByText("2 players connected")).toBeVisible({ timeout: 5000 });

			// === Host: Start game ===
			await hostPage.getByRole("button", { name: /Start/i }).click();

			// === Answer all questions ===
			for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
				// Wait for both players to see the question
				await expect(player1Page.getByText(`Question ${q} of ${TOTAL_QUESTIONS}`)).toBeVisible({ timeout: 15000 });
				await expect(player2Page.getByText(`Question ${q} of ${TOTAL_QUESTIONS}`)).toBeVisible({ timeout: 15000 });

				// Both players answer
				await answerQuestion(player1Page);
				await answerQuestion(player2Page);

				// Wait for feedback before next question
				await expect(player1Page.getByText(/\+\d+ points/)).toBeVisible({ timeout: 10000 });
			}

			// === Verify final leaderboard ===
			await expect(player1Page.getByText("Final Results")).toBeVisible({ timeout: 30000 });
			await expect(player2Page.getByText("Final Results")).toBeVisible({ timeout: 30000 });
			await expect(hostPage.getByText("Final Results")).toBeVisible({ timeout: 30000 });

			await expect(hostPage.getByText(/Alice/)).toBeVisible();
			await expect(hostPage.getByText(/Bob/)).toBeVisible();
		} finally {
			await hostContext.close();
			await player1Context.close();
			await player2Context.close();
		}
	});
});
