import type { GameState } from "../hooks/useGameState";
import { Timer } from "./ui/Timer";
import { Card } from "./ui/Card";
import { colors, spacing, typography, borderRadius } from "./ui/tokens";

interface HostDashboardProps {
	gameState: GameState;
}

export function HostDashboard({ gameState }: HostDashboardProps) {
	const { currentQuestion, answerCount, leaderboard } = gameState;

	if (!currentQuestion) return null;

	const answeredRatio = answerCount
		? answerCount.answered / answerCount.total
		: 0;

	return (
		<Card style={{ maxWidth: "600px", width: "100%" }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
				<span style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>
					Question {currentQuestion.question_index + 1} of {currentQuestion.total_questions}
				</span>
				<Timer
					totalSeconds={currentQuestion.time_limit_sec}
					running={gameState.phase === "question"}
				/>
			</div>
			<h2
				style={{
					color: colors.text,
					fontSize: typography.sizes.xl,
					marginBottom: spacing.lg,
					textAlign: "center",
				}}
			>
				{currentQuestion.text}
			</h2>
			<div style={{ marginBottom: spacing.lg }}>
				{currentQuestion.options.map((option, i) => (
					<div
						key={i}
						style={{
							padding: spacing.md,
							marginBottom: spacing.sm,
							backgroundColor: colors.surface,
							borderRadius: borderRadius.md,
							color: colors.text,
							border: `1px solid ${colors.border}`,
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
								borderRadius: borderRadius.full,
								transition: "width 0.3s ease",
							}}
						/>
					</div>
				</div>
			)}
			{leaderboard.length > 0 && (
				<div>
					<h3 style={{ color: colors.text, fontSize: typography.sizes.lg, marginBottom: spacing.sm }}>
						Standings
					</h3>
					{leaderboard.slice(0, 5).map((entry, i) => (
						<div
							key={i}
							style={{
								display: "flex",
								justifyContent: "space-between",
								padding: spacing.sm,
								borderBottom: `1px solid ${colors.border}`,
								color: colors.text,
							}}
						>
							<span>
								#{entry.rank} {entry.display_name}
							</span>
							<span style={{ fontWeight: typography.weights.semibold }}>
								{entry.score} pts
							</span>
						</div>
					))}
				</div>
			)}
		</Card>
	);
}
