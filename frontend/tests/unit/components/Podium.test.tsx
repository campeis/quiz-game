import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Podium } from "../../../src/components/Podium";
import type { LeaderboardEntryPayload } from "../../../src/services/messages";

const make = (
	rank: number,
	name: string,
	avatar: string,
	score: number,
): LeaderboardEntryPayload => ({
	rank,
	display_name: name,
	avatar,
	score,
	correct_count: 1,
});

describe("Podium", () => {
	it("renders all three positions with players", () => {
		const entries = [
			make(1, "Alice", "🦁", 3000),
			make(2, "Bob", "🤖", 2000),
			make(3, "Charlie", "🐸", 1000),
		];
		render(<Podium entries={entries} />);

		expect(screen.getByLabelText("1st place")).toBeInTheDocument();
		expect(screen.getByLabelText("2nd place")).toBeInTheDocument();
		expect(screen.getByLabelText("3rd place")).toBeInTheDocument();
	});

	it("shows avatar and name for each podium player", () => {
		const entries = [
			make(1, "Alice", "🦁", 3000),
			make(2, "Bob", "🤖", 2000),
			make(3, "Charlie", "🐸", 1000),
		];
		render(<Podium entries={entries} />);

		expect(screen.getByText("🦁")).toBeInTheDocument();
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("🤖")).toBeInTheDocument();
		expect(screen.getByText("Bob")).toBeInTheDocument();
		expect(screen.getByText("🐸")).toBeInTheDocument();
		expect(screen.getByText("Charlie")).toBeInTheDocument();
	});

	it("shows empty slot when fewer than 3 players", () => {
		const entries = [make(1, "Alice", "🦁", 3000)];
		render(<Podium entries={entries} />);

		expect(screen.getByText("🦁")).toBeInTheDocument();
		expect(screen.getByLabelText("2nd place")).toBeInTheDocument();
		expect(screen.getByLabelText("3rd place")).toBeInTheDocument();
		// empty slots have no player names
		expect(screen.queryByText("Bob")).not.toBeInTheDocument();
	});

	it("stacks tied players in the same position", () => {
		const entries = [
			make(1, "Alice", "🦁", 3000),
			make(1, "Bob", "🤖", 3000),
			make(3, "Charlie", "🐸", 1000),
		];
		render(<Podium entries={entries} />);

		const firstPlace = screen.getByLabelText("1st place");
		expect(firstPlace).toHaveTextContent("Alice");
		expect(firstPlace).toHaveTextContent("Bob");
	});

	it("does not show players with rank > 3", () => {
		const entries = [
			make(1, "Alice", "🦁", 3000),
			make(2, "Bob", "🤖", 2000),
			make(3, "Charlie", "🐸", 1000),
			make(4, "Dave", "🐯", 500),
		];
		render(<Podium entries={entries} />);

		expect(screen.queryByText("Dave")).not.toBeInTheDocument();
	});

	it("renders with no entries without crashing", () => {
		render(<Podium entries={[]} />);
		expect(screen.getByLabelText("1st place")).toBeInTheDocument();
	});
});
