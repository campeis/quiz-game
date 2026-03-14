import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { Card } from "./Card";
import { spacing } from "./tokens";

const meta = {
	title: "UI/Card",
	component: Card,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div style={{ width: 360 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: (
			<p style={{ margin: 0, color: "#fff" }}>This is a Card with some content inside it.</p>
		),
	},
};

export const Empty: Story = {
	args: {},
};

export const CompactPadding: Story = {
	args: {
		padding: spacing.sm,
		children: <p style={{ margin: 0, color: "#fff" }}>Compact padding card.</p>,
	},
};
