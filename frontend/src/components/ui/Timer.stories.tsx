import { action } from "storybook/actions";
import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { Timer } from "./Timer";

const meta = {
	title: "UI/Timer",
	component: Timer,
	parameters: {
		layout: "centered",
	},
	args: {
		onExpired: action("onExpired"),
	},
} satisfies Meta<typeof Timer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {
	args: {
		totalSeconds: 30,
		running: true,
	},
};

export const Paused: Story = {
	args: {
		totalSeconds: 30,
		running: false,
	},
};

// totalSeconds: 5 so the urgency threshold (≤15% = ≤0.75s) is crossed
// within a few seconds of the story loading. No internal state manipulation needed.
export const LowTime: Story = {
	args: {
		totalSeconds: 5,
		running: true,
	},
};
