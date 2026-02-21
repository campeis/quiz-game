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

	it("calls onJoined with session info on successful join", async () => {
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
			expect(mockOnJoined).toHaveBeenCalledWith(mockSession, "Alice");
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
