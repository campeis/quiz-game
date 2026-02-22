import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmojiPicker } from "../../../src/components/EmojiPicker";

describe("EmojiPicker", () => {
	it("renders all 30 curated emojis as buttons", () => {
		render(<EmojiPicker onSelect={vi.fn()} selected="" />);
		const buttons = screen.getAllByRole("button");
		expect(buttons).toHaveLength(30);
	});

	it("calls onSelect with the emoji when a button is clicked", () => {
		const onSelect = vi.fn();
		render(<EmojiPicker onSelect={onSelect} selected="" />);

		// Click the lion emoji
		fireEvent.click(screen.getByText("🦁"));
		expect(onSelect).toHaveBeenCalledWith("🦁");
	});

	it("highlights the selected emoji with aria-pressed", () => {
		render(<EmojiPicker onSelect={vi.fn()} selected="🦁" />);

		const lionButton = screen.getByText("🦁").closest("button");
		expect(lionButton).toHaveAttribute("aria-pressed", "true");

		const robotButton = screen.getByText("🤖").closest("button");
		expect(robotButton).toHaveAttribute("aria-pressed", "false");
	});
});
