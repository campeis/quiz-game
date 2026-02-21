import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HostDashboard } from "../../../src/components/HostDashboard";
import type { GameState } from "../../../src/hooks/useGameState";

function makeGameState(overrides: Partial<GameState> = {}): GameState {
	return {
		phase: "question",
		players: [],
		playerCount: 2,
		totalQuestions: 5,
		currentQuestion: {
			question_index: 0,
			total_questions: 5,
			text: "What is 2+2?",
			options: ["1", "3", "4", "5"],
			time_limit_sec: 20,
		},
		answerResult: null,
		answerCount: null,
		leaderboard: [],
		countdown: 0,
		...overrides,
	};
}

describe("HostDashboard", () => {
	it("renders question text and options", () => {
		render(<HostDashboard gameState={makeGameState()} />);

		expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
		expect(screen.getByText("Question 1 of 5")).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("renders timer with correct initial value", () => {
		render(<HostDashboard gameState={makeGameState()} />);

		const timer = screen.getByRole("timer");
		expect(timer).toHaveTextContent("20");
	});

	it("renders answer progress bar", () => {
		render(<HostDashboard gameState={makeGameState({ answerCount: { answered: 1, total: 2 } })} />);

		expect(screen.getByText("Answers: 1 / 2")).toBeInTheDocument();
		expect(screen.getByRole("progressbar")).toBeInTheDocument();
	});

	it("renders leaderboard standings", () => {
		render(
			<HostDashboard
				gameState={makeGameState({
					leaderboard: [
						{ display_name: "Alice", score: 1000, rank: 1 },
						{ display_name: "Bob", score: 500, rank: 2 },
					],
				})}
			/>,
		);

		expect(screen.getByText("Standings")).toBeInTheDocument();
		expect(screen.getByText(/Alice/)).toBeInTheDocument();
		expect(screen.getByText(/Bob/)).toBeInTheDocument();
	});

	it("resets timer when question changes", () => {
		vi.useFakeTimers();

		const gameState1 = makeGameState({
			currentQuestion: {
				question_index: 0,
				total_questions: 5,
				text: "What is 2+2?",
				options: ["1", "3", "4", "5"],
				time_limit_sec: 20,
			},
		});

		const { rerender } = render(<HostDashboard gameState={gameState1} />);

		expect(screen.getByRole("timer")).toHaveTextContent("20");

		// Let the timer tick down 5 seconds
		act(() => {
			vi.advanceTimersByTime(5000);
		});
		expect(screen.getByRole("timer")).toHaveTextContent("15");

		// Move to question 2 — same time_limit_sec, different question_index
		const gameState2 = makeGameState({
			currentQuestion: {
				question_index: 1,
				total_questions: 5,
				text: "What is 3+3?",
				options: ["5", "6", "7", "8"],
				time_limit_sec: 20,
			},
		});

		rerender(<HostDashboard gameState={gameState2} />);

		// Timer should reset to 20 (not stay at 15)
		expect(screen.getByRole("timer")).toHaveTextContent("20");

		vi.useRealTimers();
	});

	it("returns null when no current question", () => {
		const { container } = render(
			<HostDashboard gameState={makeGameState({ currentQuestion: null })} />,
		);

		expect(container.innerHTML).toBe("");
	});
});
