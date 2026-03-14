import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { Podium } from "./Podium";

// Canonical mock dataset — shared with Leaderboard.stories.tsx (see data-model.md)
const mockPlayers = [
	{
		rank: 1,
		display_name: "Alice",
		avatar: "🦁",
		score: 2500,
		correct_count: 3,
		is_winner: true,
	},
	{
		rank: 2,
		display_name: "Bob",
		avatar: "🤖",
		score: 1500,
		correct_count: 2,
		is_winner: false,
	},
	{
		rank: 3,
		display_name: "Charlie",
		avatar: "🐸",
		score: 500,
		correct_count: 1,
		is_winner: false,
	},
];

const meta = {
	title: "Feature/Podium",
	component: Podium,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div style={{ width: 400 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Podium>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullPodium: Story = {
	args: {
		entries: mockPlayers,
	},
};

export const SingleWinner: Story = {
	args: {
		entries: [mockPlayers[0]],
	},
};

export const Empty: Story = {
	args: {
		entries: [],
	},
};
