import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	timeout: 30_000,
	retries: 0,
	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
	},
	webServer: [
		{
			command: "cd ../backend && cargo run",
			url: "http://localhost:3000/api/sessions/health",
			reuseExistingServer: true,
			timeout: 120_000,
		},
		{
			command: "cd ../frontend && npm run dev",
			url: "http://localhost:5173",
			reuseExistingServer: true,
			timeout: 30_000,
		},
	],
	projects: [
		{
			name: "chromium",
			use: { browserName: "chromium" },
		},
	],
});
