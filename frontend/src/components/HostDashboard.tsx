import type { GameState } from "../hooks/useGameState";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { neonBoxShadow } from "./ui/neon";
import { Timer } from "./ui/Timer";
import { borderRadius, colors, spacing, typography } from "./ui/tokens";

interface HostDashboardProps {
	gameState: GameState;
	onEndQuestion?: () => void;
}

export function HostDashboard({ gameState, onEndQuestion }: HostDashboardProps) {
	const { currentQuestion, answerCount, leaderboard } = gameState;

	if (!currentQuestion) return null;

	const answeredRatio = answerCount ? answerCount.answered / answerCount.total : 0;

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
					Question {currentQuestion.question_index + 1} of {currentQuestion.total_questions}
				</span>
				<Timer
					key={currentQuestion.question_index}
					totalSeconds={currentQuestion.time_limit_sec}
					running={gameState.phase === "question"}
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
				{currentQuestion.text}
			</h2>
			<div style={{ marginBottom: spacing.lg }}>
				{currentQuestion.options.map((option) => (
					<div
						key={option}
						style={{
							padding: spacing.md,
							marginBottom: spacing.sm,
							backgroundColor: colors.surface,
							borderRadius: borderRadius.md,
							color: colors.text,
							fontFamily: typography.fontBody,
							fontSize: typography.sizes.xl,
							border: `1px solid ${colors.borderDim}`,
						}}
					>
						{option}
					</div>
				))}
			</div>
			{answerCount && (
				<div style={{ marginBottom: spacing.lg }}>
					<p style={{ color: colors.textSecondary, marginBottom: spacing.xs }}>
						Answers: {answerCount.answered} / {answerCount.total}
					</p>
					<div
						role="progressbar"
						aria-valuenow={answerCount?.answered ?? 0}
						aria-valuemin={0}
						aria-valuemax={answerCount?.total ?? 0}
						aria-label="Answer progress"
						style={{
							height: "8px",
							backgroundColor: colors.border,
							borderRadius: borderRadius.full,
							overflow: "hidden",
						}}
					>
						<div
							style={{
								width: `${answeredRatio * 100}%`,
								height: "100%",
								backgroundColor: colors.primary,
								boxShadow: neonBoxShadow(colors.primary, "low"),
								borderRadius: borderRadius.full,
								transition: "width 0.3s ease",
							}}
						/>
					</div>
				</div>
			)}
			{leaderboard.length > 0 && (
				<div>
					<h3
						style={{
							color: colors.text,
							fontSize: typography.sizes.lg,
							fontFamily: typography.fontDisplay,
							marginBottom: spacing.sm,
						}}
					>
						Standings
					</h3>
					{leaderboard.slice(0, 5).map((entry) => (
						<div
							key={`${entry.rank}-${entry.display_name}`}
							style={{
								display: "flex",
								justifyContent: "space-between",
								padding: spacing.sm,
								borderBottom: `1px solid ${colors.borderDim}`,
								color: colors.text,
							}}
						>
							<span>
								#{entry.rank} {entry.avatar} {entry.display_name}
							</span>
							<span
								style={{
									fontWeight: typography.weights.semibold,
									fontFamily: typography.fontDisplay,
									fontSize: typography.sizes.sm,
								}}
							>
								{entry.score} pts
							</span>
						</div>
					))}
				</div>
			)}
			{gameState.phase === "question" && (
				<Button onClick={onEndQuestion} style={{ width: "100%", marginTop: spacing.md }}>
					End Question
				</Button>
			)}
		</Card>
	);
}
