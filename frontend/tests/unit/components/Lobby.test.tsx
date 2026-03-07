import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Lobby } from "../../../src/components/Lobby";
import type { GameState } from "../../../src/hooks/useGameState";

const emptyGameState: GameState = {
	phase: "lobby",
	players: [],
	playerCount: 0,
	totalQuestions: 0,
	currentQuestion: null,
	answerResult: null,
	answerCount: null,
	leaderboard: [],
	countdown: 0,
	scoringRule: "stepped_decay",
	timeLimitSec: 20,
};

describe("Lobby — scoring rule selector", () => {
	it("renders scoring rule selector when isHost is true", () => {
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				onStartGame={vi.fn()}
				onScoringRuleChange={vi.fn()}
			/>,
		);

		expect(screen.getByRole("group", { name: /scoring rule/i })).toBeInTheDocument();
	});

	it("does NOT render scoring rule selector when isHost is false", () => {
		render(<Lobby joinCode="ABCD" gameState={emptyGameState} isHost={false} />);

		expect(screen.queryByRole("group", { name: /scoring rule/i })).not.toBeInTheDocument();
	});

	it("Stepped Decay option is selected by default", () => {
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				onScoringRuleChange={vi.fn()}
			/>,
		);

		const steppedDecay = screen.getByRole("radio", { name: /stepped decay/i });
		expect(steppedDecay).toBeChecked();
	});

	it("calls onScoringRuleChange with correct rule when Linear Decay is selected", () => {
		const onScoringRuleChange = vi.fn();
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				onScoringRuleChange={onScoringRuleChange}
			/>,
		);

		fireEvent.click(screen.getByRole("radio", { name: /linear decay/i }));

		expect(onScoringRuleChange).toHaveBeenCalledWith("linear_decay");
	});

	it("calls onScoringRuleChange with correct rule when Fixed Score is selected", () => {
		const onScoringRuleChange = vi.fn();
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				onScoringRuleChange={onScoringRuleChange}
			/>,
		);

		fireEvent.click(screen.getByRole("radio", { name: /fixed score/i }));

		expect(onScoringRuleChange).toHaveBeenCalledWith("fixed_score");
	});

	it("renders Streak Bonus option in scoring rule selector", () => {
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				onScoringRuleChange={vi.fn()}
			/>,
		);

		expect(screen.getByRole("radio", { name: /streak bonus/i })).toBeInTheDocument();
	});

	it("calls onScoringRuleChange with 'streak_bonus' when Streak Bonus is selected", () => {
		const onScoringRuleChange = vi.fn();
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				onScoringRuleChange={onScoringRuleChange}
			/>,
		);

		fireEvent.click(screen.getByRole("radio", { name: /streak bonus/i }));

		expect(onScoringRuleChange).toHaveBeenCalledWith("streak_bonus");
	});
});

describe("Lobby — question time limit", () => {
	it("renders time limit input with default value 20 when isHost is true", () => {
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				timeLimitSec={20}
				onTimeLimitChange={vi.fn()}
			/>,
		);

		expect(screen.getByRole("group", { name: /question time limit/i })).toBeInTheDocument();
		const input = screen.getByRole("spinbutton");
		expect(input).toHaveValue(20);
	});

	it("does NOT render time limit input when isHost is false", () => {
		render(<Lobby joinCode="ABCD" gameState={emptyGameState} isHost={false} />);

		expect(
			screen.queryByRole("group", { name: /question time limit/i }),
		).not.toBeInTheDocument();
	});

	it("shows error message when value is below minimum (9)", () => {
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				timeLimitSec={20}
				onTimeLimitChange={vi.fn()}
			/>,
		);

		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "9" } });

		expect(screen.getByText("Time must be at least 10 seconds.")).toBeInTheDocument();
	});

	it("shows error message when value is above maximum (61)", () => {
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				timeLimitSec={20}
				onTimeLimitChange={vi.fn()}
			/>,
		);

		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "61" } });

		expect(screen.getByText("Time must be no more than 60 seconds.")).toBeInTheDocument();
	});

	it("shows error message when value is empty", () => {
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				timeLimitSec={20}
				onTimeLimitChange={vi.fn()}
			/>,
		);

		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "" } });

		expect(screen.getByText("Please enter a valid number.")).toBeInTheDocument();
	});

	it("calls onTimeLimitChange with valid value 30", () => {
		const onTimeLimitChange = vi.fn();
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				timeLimitSec={20}
				onTimeLimitChange={onTimeLimitChange}
			/>,
		);

		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "30" } });

		expect(onTimeLimitChange).toHaveBeenCalledWith(30);
	});

	it("does NOT call onTimeLimitChange for invalid value 9", () => {
		const onTimeLimitChange = vi.fn();
		render(
			<Lobby
				joinCode="ABCD"
				gameState={emptyGameState}
				isHost={true}
				timeLimitSec={20}
				onTimeLimitChange={onTimeLimitChange}
			/>,
		);

		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "9" } });

		expect(onTimeLimitChange).not.toHaveBeenCalled();
	});
});
