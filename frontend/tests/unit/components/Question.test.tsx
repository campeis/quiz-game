import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Question } from "../../../src/components/Question";

const defaultProps = {
	questionIndex: 0,
	totalQuestions: 5,
	text: "What is 2+2?",
	options: ["1", "3", "4", "5"],
	timeLimitSec: 20,
	onAnswer: vi.fn(),
	answerResult: null,
	phase: "question" as const,
};

describe("Question", () => {
	it("renders question text and options", () => {
		render(<Question {...defaultProps} />);

		expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
		expect(screen.getByText("Question 1 of 5")).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("renders option buttons with aria labels", () => {
		render(<Question {...defaultProps} />);

		expect(screen.getByLabelText("Answer option 1: 1")).toBeInTheDocument();
		expect(screen.getByLabelText("Answer option 2: 3")).toBeInTheDocument();
		expect(screen.getByLabelText("Answer option 3: 4")).toBeInTheDocument();
		expect(screen.getByLabelText("Answer option 4: 5")).toBeInTheDocument();
	});

	it("calls onAnswer when option is clicked", () => {
		const onAnswer = vi.fn();
		render(<Question {...defaultProps} onAnswer={onAnswer} />);

		fireEvent.click(screen.getByText("4"));

		expect(onAnswer).toHaveBeenCalledWith(2);
	});

	it("disables options after answering", () => {
		const onAnswer = vi.fn();
		render(<Question {...defaultProps} onAnswer={onAnswer} />);

		fireEvent.click(screen.getByText("4"));
		fireEvent.click(screen.getByText("1"));

		// Should only have been called once
		expect(onAnswer).toHaveBeenCalledTimes(1);
	});

	it("shows correct result feedback", () => {
		render(
			<Question
				{...defaultProps}
				answerResult={{ correct: true, points_awarded: 1000, correct_index: 2 }}
			/>,
		);

		expect(screen.getByText("Correct!")).toBeInTheDocument();
		expect(screen.getByText("+1000 points")).toBeInTheDocument();
	});

	it("shows incorrect result feedback", () => {
		render(
			<Question
				{...defaultProps}
				answerResult={{ correct: false, points_awarded: 0, correct_index: 2 }}
			/>,
		);

		expect(screen.getByText("Incorrect")).toBeInTheDocument();
		expect(screen.getByText("+0 points")).toBeInTheDocument();
	});

	it("resets selection state when questionIndex changes", () => {
		const onAnswer = vi.fn();
		const { rerender } = render(
			<Question {...defaultProps} questionIndex={0} onAnswer={onAnswer} />,
		);

		// Answer question 0
		fireEvent.click(screen.getByText("4"));
		expect(onAnswer).toHaveBeenCalledTimes(1);

		// Buttons should be disabled after answering
		const buttons = screen.getAllByRole("button");
		for (const btn of buttons) {
			expect(btn).toBeDisabled();
		}

		// Move to question 1 — buttons must be enabled again
		rerender(
			<Question
				{...defaultProps}
				questionIndex={1}
				text="What is 3+3?"
				options={["5", "6", "7", "8"]}
				answerResult={null}
				phase="question"
				onAnswer={onAnswer}
			/>,
		);

		const newButtons = screen.getAllByRole("button");
		for (const btn of newButtons) {
			expect(btn).not.toBeDisabled();
		}

		// Should be able to click an answer on the new question
		fireEvent.click(screen.getByText("6"));
		expect(onAnswer).toHaveBeenCalledTimes(2);
		expect(onAnswer).toHaveBeenLastCalledWith(1);
	});
});
