import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./storybook-tests",
	timeout: 30_000,
	retries: 0,
	use: {
		baseURL: "http://localhost:6007",
		// Disable CSS animations and transitions for stable screenshots
		animations: "disabled",
	},
	webServer: {
		command: "node serve-storybook.mjs ../frontend/storybook-static",
		url: "http://localhost:6007",
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{
			name: "chromium",
			use: { browserName: "chromium" },
		},
	],
});
