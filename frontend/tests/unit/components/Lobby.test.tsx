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
});
