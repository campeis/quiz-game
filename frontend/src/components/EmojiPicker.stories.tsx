import { action } from "storybook/actions";
import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { EmojiPicker } from "./EmojiPicker";

const meta = {
	title: "Feature/EmojiPicker",
	component: EmojiPicker,
	parameters: {
		layout: "centered",
	},
	args: {
		onSelect: action("onSelect"),
	},
} satisfies Meta<typeof EmojiPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultSelection: Story = {
	args: {
		selected: "🦁",
	},
};

export const NoSelection: Story = {
	args: {
		selected: "",
	},
};
