import type { LeaderboardEntryPayload } from "../services/messages";
import { Card } from "./ui/Card";
import { colors, spacing, typography } from "./ui/tokens";

interface LeaderboardProps {
	entries: LeaderboardEntryPayload[];
	isFinal: boolean;
}

export function Leaderboard({ entries, isFinal }: LeaderboardProps) {
	return (
		<Card
			style={{ maxWidth: "500px", width: "100%" }}
			aria-label={isFinal ? "Final results" : "Leaderboard"}
		>
			<h2
				style={{
					color: colors.text,
					fontSize: typography.sizes.xl,
					marginBottom: spacing.lg,
					textAlign: "center",
				}}
			>
				{isFinal ? "Final Results" : "Leaderboard"}
			</h2>
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
							borderBottom: `1px solid ${colors.border}`,
							backgroundColor: entry.is_winner ? `${colors.primary}15` : "transparent",
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
							<span
								style={{
									fontSize: typography.sizes.xl,
									fontWeight: typography.weights.bold,
									color: entry.rank === 1 ? colors.primary : colors.textSecondary,
									minWidth: "32px",
								}}
							>
								#{entry.rank}
							</span>
							<div>
								<p style={{ color: colors.text, fontWeight: typography.weights.semibold }}>
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
								fontSize: typography.sizes.lg,
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
