import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AvatarPickerModal } from "../../../src/components/AvatarPickerModal";

describe("AvatarPickerModal", () => {
	it("does not render when open=false", () => {
		render(
			<AvatarPickerModal
				open={false}
				selected="🙂"
				onSelect={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders dialog with aria-modal when open=true", () => {
		render(
			<AvatarPickerModal
				open={true}
				selected="🙂"
				onSelect={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog).toBeInTheDocument();
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(dialog).toHaveAttribute("aria-label", "Choose your avatar");
	});

	it("renders all 30 emoji buttons when open", () => {
		render(
			<AvatarPickerModal
				open={true}
				selected="🙂"
				onSelect={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		// 30 emoji buttons + 1 close button = 31 total
		const emojiButtons = screen
			.getAllByRole("button")
			.filter((btn) => btn.getAttribute("aria-label") !== "Close avatar picker");
		expect(emojiButtons).toHaveLength(30);
	});

	it("calls onSelect and onClose when an emoji is clicked", () => {
		const onSelect = vi.fn();
		const onClose = vi.fn();
		render(
			<AvatarPickerModal
				open={true}
				selected="🙂"
				onSelect={onSelect}
				onClose={onClose}
			/>,
		);
		fireEvent.click(screen.getByText("🦁"));
		expect(onSelect).toHaveBeenCalledWith("🦁");
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose but NOT onSelect when ✕ button is clicked", () => {
		const onSelect = vi.fn();
		const onClose = vi.fn();
		render(
			<AvatarPickerModal
				open={true}
				selected="🙂"
				onSelect={onSelect}
				onClose={onClose}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Close avatar picker" }));
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onSelect).not.toHaveBeenCalled();
	});

	it("calls onClose but NOT onSelect when backdrop is clicked", () => {
		const onSelect = vi.fn();
		const onClose = vi.fn();
		const { container } = render(
			<AvatarPickerModal
				open={true}
				selected="🙂"
				onSelect={onSelect}
				onClose={onClose}
			/>,
		);
		// The backdrop is the outermost div (not the dialog)
		const backdrop = container.firstChild as HTMLElement;
		fireEvent.click(backdrop);
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onSelect).not.toHaveBeenCalled();
	});

	it("calls onClose but NOT onSelect when Escape key is pressed", () => {
		const onSelect = vi.fn();
		const onClose = vi.fn();
		const { container } = render(
			<AvatarPickerModal
				open={true}
				selected="🙂"
				onSelect={onSelect}
				onClose={onClose}
			/>,
		);
		const backdrop = container.firstChild as HTMLElement;
		fireEvent.keyDown(backdrop, { key: "Escape" });
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onSelect).not.toHaveBeenCalled();
	});

	it("highlights the currently selected emoji with aria-pressed=true", () => {
		render(
			<AvatarPickerModal
				open={true}
				selected="🦁"
				onSelect={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		const lionButton = screen.getByText("🦁").closest("button");
		expect(lionButton).toHaveAttribute("aria-pressed", "true");

		const robotButton = screen.getByText("🤖").closest("button");
		expect(robotButton).toHaveAttribute("aria-pressed", "false");
	});
});
