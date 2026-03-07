import { expect, test } from "./fixtures";

test.describe("Question Time Limit", () => {
	test.describe.configure({ timeout: 120_000 });

	test("host sets 15s time limit, player sees 15s on question screen", async ({
		lobby: { hostPage, playerPage },
	}) => {
		await hostPage.getByRole("spinbutton").fill("15");
		await expect(hostPage.locator("#time-limit-error")).not.toBeVisible({ timeout: 3000 });

		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(playerPage.getByText("Question 1 of")).toBeVisible({ timeout: 15000 });
		const timer = playerPage.getByRole("timer");
		await expect(timer).toBeVisible();
		const timerValue = Number((await timer.textContent())?.trim());
		expect(timerValue).toBeGreaterThanOrEqual(1);
		expect(timerValue).toBeLessThanOrEqual(15);
	});

	test("default time limit is 20s when host makes no change", async ({
		lobby: { hostPage, playerPage },
	}) => {
		await expect(hostPage.getByRole("spinbutton")).toHaveValue("20");

		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(playerPage.getByText("Question 1 of")).toBeVisible({ timeout: 15000 });
		const timer = playerPage.getByRole("timer");
		await expect(timer).toBeVisible();
		const timerValue = Number((await timer.textContent())?.trim());
		expect(timerValue).toBeGreaterThanOrEqual(1);
		expect(timerValue).toBeLessThanOrEqual(20);
	});
});

test.describe("Host early close", () => {
	test.describe.configure({ timeout: 120_000 });

	test("host clicks End Question before timer expires, question ends immediately", async ({
		lobby: { hostPage, playerPage },
	}) => {
		// Use a long timer so the early close is clearly what advances the question
		await hostPage.getByRole("spinbutton").fill("60");
		await hostPage.getByRole("button", { name: /Start/i }).click();

		await expect(
			hostPage.getByRole("button", { name: /End Question/i }),
		).toBeVisible({ timeout: 15000 });
		await hostPage.getByRole("button", { name: /End Question/i }).click();

		// Without early close Q2 would not appear for 60 s
		await expect(playerPage.getByText("Question 2 of")).toBeVisible({ timeout: 15000 });
	});
});
