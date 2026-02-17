import { useEffect, useState } from "react";
import { Timer } from "./ui/Timer";
import { Card } from "./ui/Card";
import { colors, spacing, typography, borderRadius } from "./ui/tokens";

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
	} | null;
	phase: "question" | "question_ended";
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
}: QuestionProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

	// Reset selection when moving to a new question
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
		const base: React.CSSProperties = {
			padding: spacing.lg,
			marginBottom: spacing.sm,
			borderRadius: borderRadius.md,
			border: `2px solid ${colors.border}`,
			backgroundColor: colors.surface,
			color: colors.text,
			fontSize: typography.sizes.lg,
			cursor: hasAnswered ? "default" : "pointer",
			transition: "all 0.2s ease",
			textAlign: "left",
			width: "100%",
			fontFamily: typography.fontFamily,
		};

		if (answerResult) {
			if (index === answerResult.correct_index) {
				return { ...base, borderColor: colors.success, backgroundColor: `${colors.success}15` };
			}
			if (index === selectedIndex && !answerResult.correct) {
				return { ...base, borderColor: colors.error, backgroundColor: `${colors.error}15` };
			}
		} else if (index === selectedIndex) {
			return { ...base, borderColor: colors.primary, backgroundColor: `${colors.primary}15` };
		}

		return base;
	};

	return (
		<Card style={{ maxWidth: "600px", width: "100%" }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
				<span style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>
					Question {questionIndex + 1} of {totalQuestions}
				</span>
				<Timer key={questionIndex} totalSeconds={timeLimitSec} running={phase === "question" && !hasAnswered} />
			</div>
			<h2
				style={{
					color: colors.text,
					fontSize: typography.sizes.xl,
					marginBottom: spacing.lg,
					textAlign: "center",
				}}
			>
				{text}
			</h2>
			<div>
				{options.map((option, i) => (
					<button
						key={i}
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
					<p style={{ color: colors.textSecondary, fontSize: typography.sizes.md }}>
						+{answerResult.points_awarded} points
					</p>
				</div>
			)}
		</Card>
	);
}
