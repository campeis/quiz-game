import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { Leaderboard } from "./Leaderboard";

// Canonical mock dataset — shared with Podium.stories.tsx (see data-model.md)
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
	title: "Feature/Leaderboard",
	component: Leaderboard,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div style={{ width: 520 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Leaderboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Midgame: Story = {
	args: {
		entries: mockPlayers,
		isFinal: false,
	},
};

export const FinalResults: Story = {
	args: {
		entries: mockPlayers,
		isFinal: true,
	},
};

export const Empty: Story = {
	args: {
		entries: [],
		isFinal: true,
	},
};
