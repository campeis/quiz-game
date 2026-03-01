import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Leaderboard } from "../../../src/components/Leaderboard";

const mockEntries = [
	{ rank: 1, display_name: "Alice", avatar: "🦁", score: 2500, correct_count: 3, is_winner: true },
	{ rank: 2, display_name: "Bob", avatar: "🤖", score: 1500, correct_count: 2, is_winner: false },
	{
		rank: 3,
		display_name: "Charlie",
		avatar: "🐸",
		score: 500,
		correct_count: 1,
		is_winner: false,
	},
];

describe("Leaderboard", () => {
	it("renders final results heading", () => {
		render(<Leaderboard entries={mockEntries} isFinal={true} />);

		expect(screen.getByText("Final Results")).toBeInTheDocument();
	});

	it("renders running leaderboard heading", () => {
		render(<Leaderboard entries={mockEntries} isFinal={false} />);

		expect(screen.getByText("Leaderboard")).toBeInTheDocument();
	});

	it("displays all player entries with avatars", () => {
		render(<Leaderboard entries={mockEntries} isFinal={true} />);

		expect(screen.getByText(/🦁.*Alice|Alice.*🦁/)).toBeInTheDocument();
		expect(screen.getByText(/🤖.*Bob|Bob.*🤖/)).toBeInTheDocument();
		expect(screen.getByText(/🐸.*Charlie|Charlie.*🐸/)).toBeInTheDocument();
	});

	it("displays scores", () => {
		render(<Leaderboard entries={mockEntries} isFinal={true} />);

		expect(screen.getByText("2500")).toBeInTheDocument();
		expect(screen.getByText("1500")).toBeInTheDocument();
		expect(screen.getByText("500")).toBeInTheDocument();
	});

	it("displays ranks", () => {
		render(<Leaderboard entries={mockEntries} isFinal={true} />);

		expect(screen.getByText("#1")).toBeInTheDocument();
		expect(screen.getByText("#2")).toBeInTheDocument();
		expect(screen.getByText("#3")).toBeInTheDocument();
	});

	it("marks winner with label", () => {
		render(<Leaderboard entries={mockEntries} isFinal={true} />);

		expect(screen.getByText(/Alice.*\(Winner\)/)).toBeInTheDocument();
	});

	it("shows correct count", () => {
		render(<Leaderboard entries={mockEntries} isFinal={true} />);

		expect(screen.getByText("3 correct")).toBeInTheDocument();
		expect(screen.getByText("2 correct")).toBeInTheDocument();
		expect(screen.getByText("1 correct")).toBeInTheDocument();
	});

	it("handles empty entries", () => {
		render(<Leaderboard entries={[]} isFinal={true} />);

		expect(screen.getByText("Final Results")).toBeInTheDocument();
	});
});
