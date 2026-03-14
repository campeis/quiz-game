import { type Browser, expect, test } from "./fixtures";
import { clickOption, joinPlayer, uploadQuiz } from "./helpers";

// fixture/sample.txt question order and correct indices:
// Q1: "What is the capital of France?" → * Paris   = index 2
// Q2: "How many continents are there?" → * 7       = index 1
// Q3: "Which planet is closest to Sun?"→ * Mercury = index 0
// Q4: "What is the largest ocean?"     → * Pacific = index 0
// Q5: "World War II ended in year?"    → * 1945    = index 1

const TOTAL_QUESTIONS = 5;

test.describe("Position Race Scoring Rule", () => {
	test.describe.configure({ timeout: 120_000 });
	test.use({ lobbyOptions: { scoringRule: "Position Race" } });

	// T016: first correct responder sees "1st place" and "+1000 pts"
	test("first correct responder sees '1st place' and '+1000 pts'", async ({
		twoPlayerLobby: { hostPage, player1Page, player2Page, joinCode },
	}) => {
		await joinPlayer(player1Page, joinCode, "Alice");
		await joinPlayer(player2Page, joinCode, "Bob");
		await expect(hostPage.getByText("2 players connected")).toBeVisible({ timeout: 5000 });

		const select = hostPage.getByRole("combobox", { name: /scoring rule/i });
		await select.selectOption({ value: "position_race" });
		await expect(select).toHaveValue("position_race", { timeout: 5000 });

		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(player1Page.getByText("Q1/")).toBeVisible({ timeout: 15000 });

		// Player 1 answers first (correct: index 2 = Paris)
		await clickOption(player1Page, 2);
		await expect(player1Page.getByText("Correct!")).toBeVisible({ timeout: 10000 });
		await expect(player1Page.getByText("1st place")).toBeVisible();
		await expect(player1Page.getByText("+1000 pts")).toBeVisible();
	});

	// T017: second correct responder sees "2nd place" and "+750 pts"
	test("second correct responder sees '2nd place' and '+750 pts'", async ({
		twoPlayerLobby: { hostPage, player1Page, player2Page, joinCode },
	}) => {
		await joinPlayer(player1Page, joinCode, "Alice");
		await joinPlayer(player2Page, joinCode, "Bob");
		await expect(hostPage.getByText("2 players connected")).toBeVisible({ timeout: 5000 });

		const select = hostPage.getByRole("combobox", { name: /scoring rule/i });
		await select.selectOption({ value: "position_race" });
		await expect(select).toHaveValue("position_race", { timeout: 5000 });

		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(player1Page.getByText("Q1/")).toBeVisible({ timeout: 15000 });
		await expect(player2Page.getByText("Q1/")).toBeVisible({ timeout: 15000 });

		// Player 1 answers first (1st place → 1000 pts), then Player 2 (2nd place → 750 pts)
		await clickOption(player1Page, 2);
		await expect(player1Page.getByText("Correct!")).toBeVisible({ timeout: 10000 });

		await clickOption(player2Page, 2);
		await expect(player2Page.getByText("Correct!")).toBeVisible({ timeout: 10000 });
		await expect(player2Page.getByText("2nd place")).toBeVisible();
		await expect(player2Page.getByText("+750 pts")).toBeVisible();
	});

	// T017b: 3rd and 4th+ correct responders get 500 and 250 points respectively
	test("3rd correct responder gets '+500 pts' and 4th+ gets '+250 pts'", async ({
		browser,
	}: { browser: Browser }) => {
		const hostCtx = await browser.newContext();
		const p1Ctx = await browser.newContext();
		const p2Ctx = await browser.newContext();
		const p3Ctx = await browser.newContext();
		const p4Ctx = await browser.newContext();

		try {
			const hostPage = await hostCtx.newPage();
			const p1Page = await p1Ctx.newPage();
			const p2Page = await p2Ctx.newPage();
			const p3Page = await p3Ctx.newPage();
			const p4Page = await p4Ctx.newPage();

			const joinCode = await uploadQuiz(hostPage);
			await joinPlayer(p1Page, joinCode, "Alice");
			await joinPlayer(p2Page, joinCode, "Bob");
			await joinPlayer(p3Page, joinCode, "Carol");
			await joinPlayer(p4Page, joinCode, "Dave");
			await expect(hostPage.getByText("4 players connected")).toBeVisible({ timeout: 10000 });

			await hostPage.getByRole("radio", { name: /Position Race/i }).click();
			await expect(
				hostPage.getByRole("radio", { name: /Position Race/i }),
			).toBeChecked({ timeout: 5000 });

			await hostPage.getByRole("button", { name: /Start/i }).click();

			for (const page of [p1Page, p2Page, p3Page, p4Page]) {
				await expect(page.getByText("Q1/")).toBeVisible({ timeout: 15000 });
			}

			// Answer in order: 1st, 2nd, 3rd, 4th
			await clickOption(p1Page, 2);
			await expect(p1Page.getByText("1st place")).toBeVisible({ timeout: 10000 });

			await clickOption(p2Page, 2);
			await expect(p2Page.getByText("2nd place")).toBeVisible({ timeout: 10000 });

			await clickOption(p3Page, 2);
			await expect(p3Page.getByText("3rd place")).toBeVisible({ timeout: 10000 });
			await expect(p3Page.getByText("+500 pts")).toBeVisible();

			await clickOption(p4Page, 2);
			await expect(p4Page.getByText(/place/)).toBeVisible({ timeout: 10000 });
			await expect(p4Page.getByText("+250 pts")).toBeVisible();
		} finally {
			await hostCtx.close();
			await p1Ctx.close();
			await p2Ctx.close();
			await p3Ctx.close();
			await p4Ctx.close();
		}
	});

	// T018: incorrect answer shows "+0 pts" and no position rank badge
	test("incorrect answer shows '+0 pts' and no position rank badge", async ({
		lobby: { hostPage, playerPage },
	}) => {
		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(playerPage.getByText("Q1/")).toBeVisible({ timeout: 15000 });

		// Answer wrong (index 0 = London, not Paris)
		await clickOption(playerPage, 0);

		await expect(playerPage.getByText("Incorrect")).toBeVisible({ timeout: 10000 });
		await expect(playerPage.getByText("+0 pts")).toBeVisible();
		await expect(playerPage.getByText(/place/)).not.toBeVisible();
	});

	// T019: full game — player who answers first consistently has higher leaderboard score
	test("full game — consistently fastest player ranks higher on final leaderboard", async ({
		twoPlayerLobby: { hostPage, player1Page, player2Page, joinCode },
	}) => {
		await joinPlayer(player1Page, joinCode, "Alice");
		await joinPlayer(player2Page, joinCode, "Bob");
		await expect(hostPage.getByText("2 players connected")).toBeVisible({ timeout: 5000 });

		const select = hostPage.getByRole("combobox", { name: /scoring rule/i });
		await select.selectOption({ value: "position_race" });
		await expect(select).toHaveValue("position_race", { timeout: 5000 });

		await hostPage.getByRole("button", { name: /Start/i }).click();

		// Correct answer indices per question: [2, 1, 0, 0, 1]
		const correctIndices = [2, 1, 0, 0, 1];

		for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
			await expect(
				player1Page.getByText(`Q${q}/${TOTAL_QUESTIONS}`),
			).toBeVisible({ timeout: 15000 });
			await expect(
				player2Page.getByText(`Q${q}/${TOTAL_QUESTIONS}`),
			).toBeVisible({ timeout: 15000 });

			// Alice always answers first (correctly), Bob answers second (correctly)
			await clickOption(player1Page, correctIndices[q - 1]);
			await expect(player1Page.getByText(/\+\d+ pts/)).toBeVisible({ timeout: 10000 });
			await clickOption(player2Page, correctIndices[q - 1]);
			await expect(player2Page.getByText(/\+\d+ pts/)).toBeVisible({ timeout: 10000 });
		}

		await expect(player1Page.getByText("Final Results")).toBeVisible({ timeout: 30000 });
		await expect(player2Page.getByText("Final Results")).toBeVisible({ timeout: 30000 });

		// Alice (always 1st: 1000×5 = 5000 pts) should rank above Bob (always 2nd: 750×5 = 3750 pts)
		const leaderboard = hostPage.locator('[aria-label="Final results"] ul');
		const entries = leaderboard.locator("li");
		const firstEntry = entries.first();
		await expect(firstEntry.getByText(/Alice/)).toBeVisible({ timeout: 10000 });
	});
});
