import { expect, test } from "./fixtures";
import { answerOptions } from "./helpers";

test.describe("Scoring Rules — Linear Decay", () => {
	test.describe.configure({ timeout: 120_000 });
	test.use({ lobbyOptions: { scoringRule: "Linear Decay" } });

	test("host selects Linear Decay and player sees label on question screen", async ({
		lobby: { hostPage, playerPage },
	}) => {
		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(playerPage.getByText("Q1/")).toBeVisible({ timeout: 15000 });
		await expect(playerPage.getByText("Linear Decay")).toBeVisible();

		await answerOptions(playerPage).first().click();
		await expect(playerPage.getByText(/Correct!|Incorrect/).first()).toBeVisible({
			timeout: 10000,
		});
	});
});

test.describe("Scoring Rules — Stepped Decay (default)", () => {
	test.describe.configure({ timeout: 120_000 });

	test("Stepped Decay is selected by default and label shown on question screen", async ({
		lobby: { hostPage, playerPage },
	}) => {
		await expect(hostPage.getByRole("radio", { name: /Stepped Decay/i })).toBeChecked();

		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(playerPage.getByText("Q1/")).toBeVisible({ timeout: 15000 });
		await expect(playerPage.getByText("Stepped Decay")).toBeVisible();
	});
});

test.describe("Scoring Rules — Position Race", () => {
	test.describe.configure({ timeout: 120_000 });
	test.use({ lobbyOptions: { scoringRule: "Position Race" } });

	test("host selects Position Race and player sees label on question screen", async ({
		lobby: { hostPage, playerPage },
	}) => {
		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(playerPage.getByText("Q1/")).toBeVisible({ timeout: 15000 });
		await expect(playerPage.getByText("Position Race")).toBeVisible();
	});
});
