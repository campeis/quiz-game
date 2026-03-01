import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JoinForm } from "../../../src/components/JoinForm";
import type { SessionInfo } from "../../../src/services/api";

// Mock the API module
vi.mock("../../../src/services/api", () => ({
	getSession: vi.fn(),
}));

import { getSession } from "../../../src/services/api";

const mockGetSession = vi.mocked(getSession);

describe("JoinForm", () => {
	const mockOnJoined = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders join code and display name inputs", () => {
		render(<JoinForm onJoined={mockOnJoined} />);

		expect(screen.getByPlaceholderText("Enter 6-character code")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Join Game" })).toBeInTheDocument();
	});

	it("shows error when join code is empty", async () => {
		render(<JoinForm onJoined={mockOnJoined} />);

		fireEvent.click(screen.getByRole("button", { name: "Join Game" }));

		expect(screen.getByText("Please enter a join code")).toBeInTheDocument();
		expect(mockOnJoined).not.toHaveBeenCalled();
	});

	it("shows error when display name is empty", async () => {
		render(<JoinForm onJoined={mockOnJoined} />);

		fireEvent.change(screen.getByPlaceholderText("Enter 6-character code"), {
			target: { value: "ABC123" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Join Game" }));

		expect(screen.getByText("Please enter a display name")).toBeInTheDocument();
		expect(mockOnJoined).not.toHaveBeenCalled();
	});

	it("converts join code to uppercase", () => {
		render(<JoinForm onJoined={mockOnJoined} />);

		const input = screen.getByPlaceholderText("Enter 6-character code");
		fireEvent.change(input, { target: { value: "abc123" } });

		expect(input).toHaveValue("ABC123");
	});

	it("renders avatar preview button to the left of the name input", () => {
		render(<JoinForm onJoined={mockOnJoined} />);

		// Avatar preview button present
		const previewBtn = screen.getByRole("button", { name: "Choose avatar" });
		expect(previewBtn).toBeInTheDocument();

		// No inline emoji grid on the page
		const emojiButtons = screen
			.getAllByRole("button")
			.filter(
				(btn) =>
					btn.getAttribute("aria-label") !== "Choose avatar" && btn.textContent !== "Join Game",
			);
		expect(emojiButtons).toHaveLength(0);
	});

	it("shows default avatar 🙂 in the preview button", () => {
		render(<JoinForm onJoined={mockOnJoined} />);
		const previewBtn = screen.getByRole("button", { name: "Choose avatar" });
		expect(previewBtn).toHaveTextContent("🙂");
	});

	it("opens avatar picker modal when preview button is clicked", () => {
		render(<JoinForm onJoined={mockOnJoined} />);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Choose avatar" }));

		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});

	it("closes modal and updates preview after emoji selection in modal", () => {
		render(<JoinForm onJoined={mockOnJoined} />);

		// Open modal
		fireEvent.click(screen.getByRole("button", { name: "Choose avatar" }));
		expect(screen.getByRole("dialog")).toBeInTheDocument();

		// Select lion in modal
		fireEvent.click(screen.getByText("🦁"));

		// Modal closed, preview updated
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Choose avatar" })).toHaveTextContent("🦁");
	});

	it("closes modal without changing avatar when ✕ is clicked", () => {
		render(<JoinForm onJoined={mockOnJoined} />);

		// Open modal
		fireEvent.click(screen.getByRole("button", { name: "Choose avatar" }));

		// Close via ✕
		fireEvent.click(screen.getByRole("button", { name: "Close avatar picker" }));

		// Modal closed, avatar unchanged
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Choose avatar" })).toHaveTextContent("🙂");
	});

	it("calls onJoined with default avatar when no emoji is selected", async () => {
		const mockSession: SessionInfo = {
			join_code: "ABC123",
			ws_url: "/ws/player/ABC123",
			session_status: "lobby",
			player_count: 0,
			quiz_title: "Test Quiz",
		};
		mockGetSession.mockResolvedValueOnce(mockSession);

		render(<JoinForm onJoined={mockOnJoined} />);

		fireEvent.change(screen.getByPlaceholderText("Enter 6-character code"), {
			target: { value: "ABC123" },
		});
		fireEvent.change(screen.getByPlaceholderText("Your name"), {
			target: { value: "Alice" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Join Game" }));

		await waitFor(() => {
			expect(mockOnJoined).toHaveBeenCalledWith(mockSession, "Alice", "🙂");
		});
	});

	it("calls onJoined with selected avatar emoji after modal selection", async () => {
		const mockSession: SessionInfo = {
			join_code: "ABC123",
			ws_url: "/ws/player/ABC123",
			session_status: "lobby",
			player_count: 0,
			quiz_title: "Test Quiz",
		};
		mockGetSession.mockResolvedValueOnce(mockSession);

		render(<JoinForm onJoined={mockOnJoined} />);

		fireEvent.change(screen.getByPlaceholderText("Enter 6-character code"), {
			target: { value: "ABC123" },
		});
		fireEvent.change(screen.getByPlaceholderText("Your name"), {
			target: { value: "Alice" },
		});

		// Select lion via modal
		fireEvent.click(screen.getByRole("button", { name: "Choose avatar" }));
		fireEvent.click(screen.getByText("🦁"));

		fireEvent.click(screen.getByRole("button", { name: "Join Game" }));

		await waitFor(() => {
			expect(mockOnJoined).toHaveBeenCalledWith(mockSession, "Alice", "🦁");
		});
	});

	it("shows error on API failure", async () => {
		mockGetSession.mockRejectedValueOnce({ message: "Session not found" });

		render(<JoinForm onJoined={mockOnJoined} />);

		fireEvent.change(screen.getByPlaceholderText("Enter 6-character code"), {
			target: { value: "XXXXXX" },
		});
		fireEvent.change(screen.getByPlaceholderText("Your name"), {
			target: { value: "Alice" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Join Game" }));

		await waitFor(() => {
			expect(screen.getByText("Session not found")).toBeInTheDocument();
		});
	});
});
