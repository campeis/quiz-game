import { type BrowserContext, type Page, expect, test as base } from "@playwright/test";
import { setupLobby, uploadQuiz, type LobbyOptions, type LobbySetup } from "./helpers";

export { expect };
export type { LobbySetup };

export interface TwoPlayerLobbySetup {
	hostContext: BrowserContext;
	player1Context: BrowserContext;
	player2Context: BrowserContext;
	hostPage: Page;
	player1Page: Page;
	player2Page: Page;
	joinCode: string;
}

export const test = base.extend<{
	/** Override lobby setup behaviour per describe block via test.use({ lobbyOptions: … }). */
	lobbyOptions: LobbyOptions;
	/** Host + one player, fully ready in lobby. Contexts closed automatically. */
	lobby: LobbySetup;
	/** Host + two bare player pages (players must join in the test body). Contexts closed automatically. */
	twoPlayerLobby: TwoPlayerLobbySetup;
}>({
	lobbyOptions: [{}, { option: true }],

	lobby: async ({ browser, lobbyOptions }, use) => {
		const setup = await setupLobby(browser, lobbyOptions);
		await use(setup);
		await setup.hostContext.close();
		await setup.playerContext.close();
	},

	twoPlayerLobby: async ({ browser }, use) => {
		const hostContext = await browser.newContext();
		const player1Context = await browser.newContext();
		const player2Context = await browser.newContext();
		const hostPage = await hostContext.newPage();
		const player1Page = await player1Context.newPage();
		const player2Page = await player2Context.newPage();

		const joinCode = await uploadQuiz(hostPage);

		await use({ hostContext, player1Context, player2Context, hostPage, player1Page, player2Page, joinCode });

		await hostContext.close();
		await player1Context.close();
		await player2Context.close();
	},
});
