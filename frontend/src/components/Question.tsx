import { useEffect, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { ScoringRuleName } from "../services/messages";
import { Card } from "./ui/Card";
import { neonBoxShadow } from "./ui/neon";
import { Timer } from "./ui/Timer";
import { borderRadius, colors, spacing, typography } from "./ui/tokens";

const SCORING_RULE_LABELS: Record<ScoringRuleName, string> = {
	stepped_decay: "Stepped Decay",
	linear_decay: "Linear Decay",
	fixed_score: "Fixed Score",
	streak_bonus: "Streak Bonus",
	position_race: "Position Race",
};

// Handles 1st/2nd/3rd correctly; falls back to "Nth" for N≥4.
// Safe for Position Race which caps the distinct tiers at 4+.
function toOrdinal(n: number): string {
	if (n === 1) return "1st";
	if (n === 2) return "2nd";
	if (n === 3) return "3rd";
	return `${n}th`;
}

interface QuestionProps {
	questionIndex: number;
	totalQuestions: number;
	text: string;
	options: string[];
	timeLimitSec: number;
	onAnswer: (selectedIndex: number) => void;
	answerResult?: {
		correct: boolean;
		points_awarded: number;
		correct_index: number;
		streak_multiplier: number;
		position?: number;
	} | null;
	phase: "question" | "question_ended";
	scoringRule: ScoringRuleName;
}

export function Question({
	questionIndex,
	totalQuestions,
	text,
	options,
	timeLimitSec,
	onAnswer,
	answerResult,
	phase,
	scoringRule,
}: QuestionProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const prefersReducedMotion = useReducedMotion();

	// biome-ignore lint/correctness/useExhaustiveDependencies: questionIndex is intentionally used to reset state on question change
	useEffect(() => {
		setSelectedIndex(null);
	}, [questionIndex]);

	const hasAnswered = selectedIndex !== null;

	const handleSelect = (index: number) => {
		if (hasAnswered) return;
		setSelectedIndex(index);
		onAnswer(index);
	};

	const getOptionStyle = (index: number): React.CSSProperties => {
		let borderColor = colors.border;
		let backgroundColor = colors.surface;
		let boxShadow: string | undefined;

		if (answerResult) {
			if (index === answerResult.correct_index) {
				borderColor = colors.success;
				backgroundColor = `${colors.success}15`;
				boxShadow = neonBoxShadow(colors.success, "high");
			} else if (index === selectedIndex && !answerResult.correct) {
				borderColor = colors.error;
				backgroundColor = `${colors.error}15`;
				boxShadow = neonBoxShadow(colors.error, "medium");
			}
		} else if (index === selectedIndex) {
			borderColor = colors.primary;
			backgroundColor = `${colors.primary}15`;
			boxShadow = neonBoxShadow(colors.primary, "medium");
		}

		return {
			padding: spacing.lg,
			marginBottom: spacing.sm,
			borderRadius: borderRadius.md,
			borderWidth: "2px",
			borderStyle: "solid",
			borderColor,
			backgroundColor,
			boxShadow,
			color: colors.text,
			fontSize: typography.sizes.xl,
			cursor: hasAnswered ? "default" : "pointer",
			transition: "all 0.2s ease",
			textAlign: "left",
			width: "100%",
			fontFamily: typography.fontBody,
		};
	};

	return (
		<Card style={{ maxWidth: "600px", width: "100%" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: spacing.md,
				}}
			>
				<span
					style={{
						color: colors.textSecondary,
						fontSize: typography.sizes.sm,
						fontFamily: typography.fontDisplay,
					}}
				>
					Question {questionIndex + 1} of {totalQuestions}
				</span>
				<span
					style={{
						color: colors.textSecondary,
						fontSize: typography.sizes.sm,
						fontFamily: typography.fontBody,
					}}
				>
					{SCORING_RULE_LABELS[scoringRule]}
				</span>
				<Timer
					key={questionIndex}
					totalSeconds={timeLimitSec}
					running={phase === "question" && !hasAnswered}
				/>
			</div>
			<h2
				style={{
					color: colors.text,
					fontSize: typography.sizes.xl,
					fontFamily: typography.fontBody,
					marginBottom: spacing.lg,
					textAlign: "center",
				}}
			>
				{text}
			</h2>
			<div>
				{options.map((option, i) => (
					<button
						key={option}
						type="button"
						onClick={() => handleSelect(i)}
						disabled={hasAnswered}
						style={getOptionStyle(i)}
						aria-label={`Answer option ${i + 1}: ${option}`}
					>
						{option}
					</button>
				))}
			</div>
			{answerResult && (
				<div
					style={{
						marginTop: spacing.lg,
						padding: spacing.md,
						borderRadius: borderRadius.md,
						backgroundColor: answerResult.correct ? `${colors.success}15` : `${colors.error}15`,
						textAlign: "center",
						animation: prefersReducedMotion
							? "none"
							: answerResult.correct
								? "correctBurst 0.5s ease-out forwards"
								: "incorrectFlash 0.6s ease-out forwards",
					}}
				>
					<p
						style={{
							color: answerResult.correct ? colors.success : colors.error,
							fontSize: typography.sizes.lg,
							fontWeight: typography.weights.bold,
						}}
					>
						{answerResult.correct ? "Correct!" : "Incorrect"}
					</p>
					{scoringRule === "streak_bonus" &&
						answerResult.correct &&
						answerResult.streak_multiplier > 1.0 && (
							<p
								style={{
									color: colors.primary,
									fontSize: typography.sizes.md,
									fontWeight: typography.weights.bold,
								}}
							>
								×{answerResult.streak_multiplier.toFixed(1)}
							</p>
						)}
					{scoringRule === "position_race" &&
						answerResult.correct &&
						answerResult.position != null && (
							<p
								style={{
									color: colors.primary,
									fontSize: typography.sizes.md,
									fontWeight: typography.weights.bold,
								}}
							>
								{toOrdinal(answerResult.position)} place
							</p>
						)}
					<p style={{ color: colors.textSecondary, fontSize: typography.sizes.md }}>
						+{answerResult.points_awarded} points
					</p>
				</div>
			)}
		</Card>
	);
}
