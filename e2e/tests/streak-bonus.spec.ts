import { expect, test } from "./fixtures";
import { clickOption } from "./helpers";

// fixture/sample.txt question order and correct indices:
// Q1: "What is the capital of France?" → * Paris   = index 2
// Q2: "How many continents are there?" → * 7       = index 1
// Q3: "Which planet is closest to Sun?"→ * Mercury = index 0

test.describe("Streak Bonus Scoring Rule", () => {
	test.describe.configure({ timeout: 120_000 });
	test.use({ lobbyOptions: { scoringRule: "Streak Bonus" } });

	test("host can select Streak Bonus and it appears as label on question screen", async ({
		lobby: { hostPage, playerPage },
	}) => {
		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(playerPage.getByText("Q1/")).toBeVisible({ timeout: 15000 });
		await expect(playerPage.getByText("Streak Bonus")).toBeVisible();
	});

	test("first correct answer awards 1000 pts with no multiplier displayed", async ({
		lobby: { hostPage, playerPage },
	}) => {
		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(playerPage.getByText("Q1/")).toBeVisible({ timeout: 15000 });
		await clickOption(playerPage, 2); // Paris — correct for Q1

		await expect(playerPage.getByText("Correct!")).toBeVisible({ timeout: 10000 });
		await expect(playerPage.getByText("+1000 pts")).toBeVisible();
		// streak=0 before this answer → ×1.0 is suppressed
		await expect(playerPage.getByText(/×\d/)).not.toBeVisible();
	});

	test("incorrect answer resets the multiplier — next correct answer awards 1000 pts", async ({
		lobby: { hostPage, playerPage },
	}) => {
		await hostPage.getByRole("button", { name: /Start/i }).click();

		// Q1: correct → streak becomes 1; ×1.0 suppressed
		await expect(playerPage.getByText("Q1/")).toBeVisible({ timeout: 15000 });
		await clickOption(playerPage, 2); // Paris — correct
		await expect(playerPage.getByText("Correct!")).toBeVisible({ timeout: 10000 });
		await expect(playerPage.getByText(/×\d/)).not.toBeVisible();

		// Q2: incorrect → streak resets to 0
		await expect(playerPage.getByText("Q2/")).toBeVisible({ timeout: 15000 });
		await clickOption(playerPage, 0); // "5" — wrong (correct is "7" = index 1)
		await expect(playerPage.getByText("Incorrect")).toBeVisible({ timeout: 10000 });
		await expect(playerPage.getByText(/×\d/)).not.toBeVisible();

		// Q3: correct with streak=0 → ×1.0 → 1000 pts, no multiplier badge
		await expect(playerPage.getByText("Q3/")).toBeVisible({ timeout: 15000 });
		await clickOption(playerPage, 0); // Mercury — correct
		await expect(playerPage.getByText("Correct!")).toBeVisible({ timeout: 10000 });
		await expect(playerPage.getByText("+1000 pts")).toBeVisible();
		await expect(playerPage.getByText(/×\d/)).not.toBeVisible();
	});

	test("timeout resets the multiplier — unanswered question resets streak", async ({
		lobby: { hostPage, playerPage },
	}) => {
		await hostPage.getByRole("button", { name: /Start/i }).click();

		// Q1: correct → streak becomes 1
		await expect(playerPage.getByText("Q1/")).toBeVisible({ timeout: 15000 });
		await clickOption(playerPage, 2); // Paris — correct
		await expect(playerPage.getByText("Correct!")).toBeVisible({ timeout: 10000 });

		// Q2: player does NOT answer — host ends question, simulating timeout
		await expect(playerPage.getByText("Q2/")).toBeVisible({ timeout: 15000 });
		await hostPage.getByRole("button", { name: "End Question" }).click();

		// Q3: correct with streak reset by timeout → ×1.0 → 1000 pts, no multiplier badge
		await expect(playerPage.getByText("Q3/")).toBeVisible({ timeout: 15000 });
		await clickOption(playerPage, 0); // Mercury — correct
		await expect(playerPage.getByText("Correct!")).toBeVisible({ timeout: 10000 });
		await expect(playerPage.getByText("+1000 pts")).toBeVisible();
		await expect(playerPage.getByText(/×\d/)).not.toBeVisible();
	});
});
