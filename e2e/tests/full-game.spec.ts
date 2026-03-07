import { expect, test } from "./fixtures";
import { answerOptions, joinPlayer } from "./helpers";

// The fixture file has 5 questions
const TOTAL_QUESTIONS = 5;

test.describe("Full Multiplayer Game", () => {
	test.describe.configure({ timeout: 120_000 });

	test("complete game with host and 2 players", async ({
		twoPlayerLobby: { hostPage, player1Page, player2Page, joinCode },
	}) => {
		// Join both players with distinct avatars
		await joinPlayer(player1Page, joinCode, "Alice", "🦁");
		await joinPlayer(player2Page, joinCode, "Bob", "🤖");
		await expect(hostPage.getByText("2 players connected")).toBeVisible({ timeout: 5000 });

		// Verify avatars appear in the lobby player list
		await expect(player1Page.getByText(/🦁.*Alice|Alice.*🦁/)).toBeVisible();
		await expect(player1Page.getByText(/🤖.*Bob|Bob.*🤖/)).toBeVisible();

		await hostPage.getByRole("button", { name: /Start/i }).click();

		// Both players answer every question
		for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
			await expect(
				player1Page.getByText(`Question ${q} of ${TOTAL_QUESTIONS}`),
			).toBeVisible({ timeout: 15000 });
			await expect(
				player2Page.getByText(`Question ${q} of ${TOTAL_QUESTIONS}`),
			).toBeVisible({ timeout: 15000 });

			await answerOptions(player1Page).first().click();
			await answerOptions(player2Page).first().click();

			await expect(player1Page.getByText(/\+\d+ points/)).toBeVisible({ timeout: 10000 });
		}

		// Verify final leaderboard appears for all participants
		await expect(player1Page.getByText("Final Results")).toBeVisible({ timeout: 30000 });
		await expect(player2Page.getByText("Final Results")).toBeVisible({ timeout: 30000 });
		await expect(hostPage.getByText("Final Results")).toBeVisible({ timeout: 30000 });

		const leaderboardList = hostPage.locator('[aria-label="Final results"] ul');
		await expect(leaderboardList.getByText(/🦁.*Alice|Alice.*🦁/)).toBeVisible();
		await expect(leaderboardList.getByText(/🤖.*Bob|Bob.*🤖/)).toBeVisible();
	});

	test("duplicate avatars are allowed (FR-006)", async ({
		twoPlayerLobby: { hostPage, player1Page, player2Page, joinCode },
	}) => {
		// Both players pick the same emoji — no error should occur
		await joinPlayer(player1Page, joinCode, "Alice", "🤖");
		await joinPlayer(player2Page, joinCode, "Bob", "🤖");
		await expect(hostPage.getByText("2 players connected")).toBeVisible({ timeout: 5000 });

		await expect(player1Page.getByText(/🤖.*Alice|Alice.*🤖/)).toBeVisible();
		await expect(player1Page.getByText(/🤖.*Bob|Bob.*🤖/)).toBeVisible();
	});
});
