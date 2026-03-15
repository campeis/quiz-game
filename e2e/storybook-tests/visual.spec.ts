import { expect, test } from "@playwright/test";

// Each entry maps a human-readable label to a Storybook story iframe ID.
// Story ID format: <title-kebab>--<story-name-kebab>
// Title "UI/Button" + story "Primary" → "ui-button--primary"
const stories: { label: string; id: string }[] = [
	// UI/Button
	{ label: "Button/Primary", id: "ui-button--primary" },
	{ label: "Button/Secondary", id: "ui-button--secondary" },
	{ label: "Button/Disabled", id: "ui-button--disabled" },
	{ label: "Button/Loading", id: "ui-button--loading" },
	// UI/Card
	{ label: "Card/Default", id: "ui-card--default" },
	{ label: "Card/Empty", id: "ui-card--empty" },
	{ label: "Card/CompactPadding", id: "ui-card--compact-padding" },
	// UI/Timer — "Paused" only; Running/LowTime use a JS countdown and are flaky
	{ label: "Timer/Paused", id: "ui-timer--paused" },
	// Feature/EmojiPicker
	{ label: "EmojiPicker/DefaultSelection", id: "feature-emojipicker--default-selection" },
	{ label: "EmojiPicker/NoSelection", id: "feature-emojipicker--no-selection" },
	// Feature/Leaderboard
	{ label: "Leaderboard/Midgame", id: "feature-leaderboard--midgame" },
	{ label: "Leaderboard/FinalResults", id: "feature-leaderboard--final-results" },
	{ label: "Leaderboard/Empty", id: "feature-leaderboard--empty" },
	// Feature/Podium
	{ label: "Podium/FullPodium", id: "feature-podium--full-podium" },
	{ label: "Podium/SingleWinner", id: "feature-podium--single-winner" },
	{ label: "Podium/Empty", id: "feature-podium--empty" },
];

for (const story of stories) {
	test(story.label, async ({ page }) => {
		// Load the Storybook manager with the story selected. The manager sends a
		// postMessage channel event to the preview iframe which triggers rendering.
		await page.goto(`/?path=/story/${story.id}`);
		// Access the story inside the preview iframe
		const previewFrame = page.frameLocator("iframe");
		// Wait for the story component to render into the storybook root
		await previewFrame.locator("#storybook-root > *").first().waitFor({ state: "visible" });
		// Screenshot just the iframe body (the isolated story content)
		await expect(previewFrame.locator("body")).toHaveScreenshot(`${story.id}.png`);
	});
}
