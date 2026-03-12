import { useEffect, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { ScoringRuleName } from "../services/messages";
import { Card } from "./ui/Card";
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
		let borderLeftColor = colors.border;
		let borderLeftWidth = "2px";
		let backgroundColor = colors.background;
		let color = colors.text;

		if (answerResult) {
			if (index === answerResult.correct_index) {
				borderLeftColor = colors.success;
				borderLeftWidth = "4px";
				backgroundColor = `${colors.success}12`;
				color = colors.success;
			} else if (index === selectedIndex && !answerResult.correct) {
				borderLeftColor = colors.error;
				borderLeftWidth = "4px";
				backgroundColor = `${colors.error}12`;
				color = colors.error;
			} else {
				color = colors.textSecondary;
			}
		} else if (index === selectedIndex) {
			borderLeftColor = colors.primary;
			borderLeftWidth = "4px";
			backgroundColor = `${colors.primary}10`;
			color = colors.primary;
		}

		return {
			padding: spacing.md,
			marginBottom: spacing.sm,
			borderRadius: borderRadius.md,
			borderTop: `1px solid ${colors.border}`,
			borderRight: `1px solid ${colors.border}`,
			borderBottom: `1px solid ${colors.border}`,
			borderLeft: `${borderLeftWidth} solid ${borderLeftColor}`,
			backgroundColor,
			color,
			fontSize: typography.sizes.xl,
			cursor: hasAnswered ? "default" : "pointer",
			transition: "border-left-color 0.15s ease, background-color 0.15s ease, color 0.15s ease",
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
					Q{questionIndex + 1}/{totalQuestions}
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
						borderLeft: `4px solid ${answerResult.correct ? colors.success : colors.error}`,
						backgroundColor: answerResult.correct ? `${colors.success}10` : `${colors.error}10`,
						textAlign: "center",
						animation: prefersReducedMotion
							? "none"
							: answerResult.correct
								? "correctBurst 0.4s ease-out both"
								: "incorrectFlash 0.5s ease-out both",
					}}
				>
					<p
						style={{
							color: answerResult.correct ? colors.success : colors.error,
							fontSize: typography.sizes.lg,
							fontWeight: typography.weights.bold,
							margin: 0,
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
									margin: `${spacing.xs} 0 0`,
								}}
							>
								×{answerResult.streak_multiplier.toFixed(1)} streak
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
									margin: `${spacing.xs} 0 0`,
								}}
							>
								{toOrdinal(answerResult.position)} place
							</p>
						)}
					<p
						style={{
							color: colors.textSecondary,
							fontSize: typography.sizes.md,
							margin: `${spacing.xs} 0 0`,
						}}
					>
						+{answerResult.points_awarded} pts
					</p>
				</div>
			)}
		</Card>
	);
}
