import { type Browser, type BrowserContext, type Page, expect } from "@playwright/test";
import * as path from "node:path";

export const FIXTURE_PATH = path.resolve(__dirname, "../../fixtures/sample.txt");

export interface LobbyOptions {
	playerName?: string;
	/** Scoring rule display name to select, e.g. "Streak Bonus", "Linear Decay" */
	scoringRule?: string;
}

export interface LobbySetup {
	hostContext: BrowserContext;
	playerContext: BrowserContext;
	hostPage: Page;
	playerPage: Page;
	joinCode: string;
}

/** Upload a quiz file from the host page and return the generated join code. */
export async function uploadQuiz(hostPage: Page): Promise<string> {
	await hostPage.goto("/host");
	await hostPage.locator('input[type="file"]').setInputFiles(FIXTURE_PATH);
	await hostPage.getByRole("button", { name: "Upload Quiz" }).click();
	await expect(hostPage.getByText("Join Code")).toBeVisible({ timeout: 10000 });
	const joinCode = await hostPage.locator("text=/[A-Z0-9]{6}/").first().textContent();
	expect(joinCode).toBeTruthy();
	return joinCode!;
}

/** Navigate a player page to /play, fill the join form, and wait for the lobby. */
export async function joinPlayer(
	playerPage: Page,
	joinCode: string,
	name: string,
	emoji?: string,
): Promise<void> {
	await playerPage.goto("/play");
	await playerPage.getByPlaceholder("Enter 6-character code").fill(joinCode);
	await playerPage.getByPlaceholder("Your name").fill(name);
	if (emoji) {
		await playerPage.getByRole("button", { name: "Choose avatar" }).click();
		await playerPage.getByRole("dialog").getByText(emoji).click();
	}
	await playerPage.getByRole("button", { name: "Join Game" }).click();
	await expect(
		playerPage.getByRole("heading", { name: "Waiting for Players" }),
	).toBeVisible({ timeout: 10000 });
}

/**
 * Full lobby setup: host uploads quiz, one player joins, both sides confirm ready.
 * Optionally selects a scoring rule on the host side after the player joins.
 */
export async function setupLobby(
	browser: Browser,
	options: LobbyOptions = {},
): Promise<LobbySetup> {
	const hostContext = await browser.newContext();
	const playerContext = await browser.newContext();
	const hostPage = await hostContext.newPage();
	const playerPage = await playerContext.newPage();

	const joinCode = await uploadQuiz(hostPage);
	await joinPlayer(playerPage, joinCode, options.playerName ?? "Alice");
	await expect(hostPage.getByText("1 player connected")).toBeVisible({ timeout: 5000 });

	if (options.scoringRule) {
		const RULE_VALUES: Record<string, string> = {
			"stepped decay": "stepped_decay",
			"linear decay": "linear_decay",
			"fixed score": "fixed_score",
			"streak bonus": "streak_bonus",
			"position race": "position_race",
		};
		const value = RULE_VALUES[options.scoringRule.toLowerCase()];
		const select = hostPage.getByRole("combobox", { name: /scoring rule/i });
		await select.selectOption({ value });
		await expect(select).toHaveValue(value, { timeout: 5000 });
	}

	return { hostContext, playerContext, hostPage, playerPage, joinCode };
}

/** Click the nth (0-based) enabled answer-option button. */
export async function clickOption(page: Page, index: number): Promise<void> {
	await page
		.locator('button[aria-label^="Answer option"]:not([disabled])')
		.nth(index)
		.click();
}

/** Locator for all currently enabled answer-option buttons. */
export function answerOptions(page: Page) {
	return page.locator('button[aria-label^="Answer option"]:not([disabled])');
}
