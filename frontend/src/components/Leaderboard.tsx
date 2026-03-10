import { useReducedMotion } from "../hooks/useReducedMotion";
import type { LeaderboardEntryPayload } from "../services/messages";
import { Podium } from "./Podium";
import { Card } from "./ui/Card";
import { neonBoxShadow, neonTextShadow } from "./ui/neon";
import { colors, spacing, typography } from "./ui/tokens";

interface LeaderboardProps {
	entries: LeaderboardEntryPayload[];
	isFinal: boolean;
}

export function Leaderboard({ entries, isFinal }: LeaderboardProps) {
	const prefersReducedMotion = useReducedMotion();
	return (
		<Card
			style={{ maxWidth: "500px", width: "100%" }}
			aria-label={isFinal ? "Final results" : "Leaderboard"}
		>
			<h2
				style={{
					color: colors.primary,
					fontSize: typography.sizes.xl,
					fontFamily: typography.fontDisplay,
					marginBottom: spacing.lg,
					textAlign: "center",
					animation: isFinal && !prefersReducedMotion ? "neonShimmer 1.5s infinite" : "none",
				}}
			>
				{isFinal ? "Final Results" : "Leaderboard"}
			</h2>
			{isFinal && <Podium entries={entries} />}
			<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
				{entries.map((entry) => (
					<li
						key={`${entry.rank}-${entry.display_name}`}
						aria-label={`Rank ${entry.rank}: ${entry.display_name}, ${entry.score} points`}
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: spacing.md,
							borderBottom:
								entry.rank === 1 ? `1px solid ${colors.winner}` : `1px solid ${colors.borderDim}`,
							backgroundColor:
								entry.rank === 1
									? `${colors.winner}15`
									: entry.is_winner
										? `${colors.primary}15`
										: "transparent",
							boxShadow: entry.rank === 1 ? neonBoxShadow(colors.winner, "high") : undefined,
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
							<span
								style={{
									fontSize: typography.sizes.xl,
									fontFamily: typography.fontDisplay,
									fontWeight: typography.weights.bold,
									color: entry.rank === 1 ? colors.winner : colors.textSecondary,
									minWidth: "32px",
								}}
							>
								#{entry.rank}
							</span>
							<div>
								<p
									style={{
										color: entry.rank === 1 ? colors.winner : colors.text,
										fontFamily: typography.fontBody,
										fontSize: typography.sizes.xl,
										fontWeight: typography.weights.semibold,
										textShadow:
											entry.rank === 1 ? neonTextShadow(colors.winner, "medium") : undefined,
									}}
								>
									{entry.avatar} {entry.display_name}
									{entry.is_winner && " (Winner)"}
								</p>
								<p style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>
									{entry.correct_count} correct
								</p>
							</div>
						</div>
						<span
							style={{
								fontSize: typography.sizes.xl,
								fontFamily: typography.fontDisplay,
								fontWeight: typography.weights.bold,
								color: colors.text,
							}}
						>
							{entry.score}
						</span>
					</li>
				))}
			</ul>
		</Card>
	);
}
