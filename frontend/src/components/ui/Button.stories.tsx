import { action } from "storybook/actions";
import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { Button } from "./Button";

const meta = {
	title: "UI/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	args: {
		onClick: action("onClick"),
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		variant: "primary",
		children: "Click me",
	},
};

export const Secondary: Story = {
	args: {
		variant: "secondary",
		children: "Click me",
	},
};

export const Disabled: Story = {
	args: {
		variant: "primary",
		disabled: true,
		children: "Disabled",
	},
};

export const Loading: Story = {
	args: {
		variant: "primary",
		loading: true,
		children: "Submit",
	},
};
