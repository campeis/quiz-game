import { test, expect, type Page } from "@playwright/test";
import * as path from "node:path";

const FIXTURE_PATH = path.resolve(__dirname, "../../fixtures/sample.txt");

/**
 * Full multiplayer game E2E test.
 *
 * Flow: Host uploads quiz → creates session → 2 players join →
 * host starts game → players answer → final leaderboard shown.
 */
test.describe("Full Multiplayer Game", () => {
	test("complete game with host and 2 players", async ({ browser }) => {
		test.setTimeout(60000);

		// Create separate browser contexts for isolation
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

			// Wait for lobby with join code
			await expect(hostPage.getByText("Join Code")).toBeVisible({ timeout: 10000 });

			// Extract join code from the lobby display
			const joinCodeEl = hostPage.locator("text=/[A-Z0-9]{6}/").first();
			const joinCode = await joinCodeEl.textContent();
			expect(joinCode).toBeTruthy();
			expect(joinCode).toMatch(/^[A-Z0-9]{6}$/);

			// === Player 1: Join ===
			await player1Page.goto("/play");
			await player1Page.getByPlaceholder("Enter 6-character code").fill(joinCode!);
			await player1Page.getByPlaceholder("Your name").fill("Alice");
			await player1Page.getByRole("button", { name: "Join Game" }).click();

			// Player 1 should see lobby
			await expect(player1Page.getByText("Waiting")).toBeVisible({ timeout: 10000 });

			// === Player 2: Join ===
			await player2Page.goto("/play");
			await player2Page.getByPlaceholder("Enter 6-character code").fill(joinCode!);
			await player2Page.getByPlaceholder("Your name").fill("Bob");
			await player2Page.getByRole("button", { name: "Join Game" }).click();

			await expect(player2Page.getByText("Waiting")).toBeVisible({ timeout: 10000 });

			// Host should see player count
			await expect(hostPage.getByText("2")).toBeVisible({ timeout: 5000 });

			// === Host: Start game ===
			await hostPage.getByRole("button", { name: /Start/i }).click();

			// Players should see "Get Ready" then questions
			await expect(player1Page.getByText(/Question 1/i)).toBeVisible({ timeout: 15000 });
			await expect(player2Page.getByText(/Question 1/i)).toBeVisible({ timeout: 15000 });

			// === Players answer first question ===
			// Click the second option (which is the correct answer in sample.txt)
			const p1Options = player1Page.locator('button[aria-label^="Answer option"]');
			const p2Options = player2Page.locator('button[aria-label^="Answer option"]');

			await p1Options.nth(1).click(); // Alice picks option 2 (correct)
			await p2Options.nth(0).click(); // Bob picks option 1 (wrong)

			// Wait for answer feedback
			await expect(player1Page.getByText(/Correct|points/i)).toBeVisible({ timeout: 10000 });
			await expect(player2Page.getByText(/Incorrect|points/i)).toBeVisible({ timeout: 10000 });

			// Wait for next question or game end
			// The sample quiz has 2 questions
			await expect(player1Page.getByText(/Question 2|Final Results/i)).toBeVisible({ timeout: 15000 });

			// If there's a question 2, answer it
			const hasQ2 = await player1Page.getByText(/Question 2/i).isVisible().catch(() => false);
			if (hasQ2) {
				const p1Opts2 = player1Page.locator('button[aria-label^="Answer option"]');
				const p2Opts2 = player2Page.locator('button[aria-label^="Answer option"]');

				await p1Opts2.nth(1).click();
				await p2Opts2.nth(1).click();
			}

			// === Verify final leaderboard ===
			await expect(player1Page.getByText("Final Results")).toBeVisible({ timeout: 30000 });
			await expect(player2Page.getByText("Final Results")).toBeVisible({ timeout: 30000 });
			await expect(hostPage.getByText("Final Results")).toBeVisible({ timeout: 30000 });

			// Alice should be on the leaderboard
			await expect(hostPage.getByText("Alice")).toBeVisible();
			await expect(hostPage.getByText("Bob")).toBeVisible();
		} finally {
			await hostContext.close();
			await player1Context.close();
			await player2Context.close();
		}
	});
});
