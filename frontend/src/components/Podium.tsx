import type { LeaderboardEntryPayload } from "../services/messages";
import { borderRadius, colors, spacing, typography } from "./ui/tokens";

interface PodiumProps {
	entries: LeaderboardEntryPayload[];
}

const PODIUM_COLORS = {
	1: colors.winner,
	2: "#94a3b8",
	3: "#c2773a",
} as const;

const PODIUM_HEIGHTS = {
	1: "80px",
	2: "56px",
	3: "40px",
} as const;

const LABELS = {
	1: "1st place",
	2: "2nd place",
	3: "3rd place",
} as const;

function PodiumSlot({ rank, players }: { rank: 1 | 2 | 3; players: LeaderboardEntryPayload[] }) {
	const color = PODIUM_COLORS[rank];
	const height = PODIUM_HEIGHTS[rank];

	return (
		<section
			aria-label={LABELS[rank]}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				flex: 1,
			}}
		>
			{/* Players above the block */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: spacing.xs,
					marginBottom: spacing.sm,
					minHeight: "60px",
					justifyContent: "flex-end",
				}}
			>
				{players.length > 0 ? (
					players.map((p) => (
						<div
							key={`${p.rank}-${p.display_name}`}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: "2px",
							}}
						>
							<span style={{ fontSize: typography.sizes.xl }}>{p.avatar}</span>
							<span
								style={{
									color: colors.text,
									fontSize: typography.sizes.sm,
									fontWeight: typography.weights.semibold,
									textAlign: "center",
								}}
							>
								{p.display_name}
							</span>
						</div>
					))
				) : (
					<div
						style={{
							width: "40px",
							height: "40px",
							borderRadius: borderRadius.full,
							backgroundColor: colors.surface,
							border: `2px dashed ${colors.border}`,
						}}
					/>
				)}
			</div>

			{/* Podium block */}
			<div
				style={{
					width: "100%",
					height,
					backgroundColor: players.length > 0 ? color : colors.surface,
					borderRadius: `${borderRadius.sm} ${borderRadius.sm} 0 0`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					opacity: players.length > 0 ? 1 : 0.4,
				}}
			>
				<span
					style={{
						fontSize: typography.sizes.xl,
						fontWeight: typography.weights.bold,
						color: players.length > 0 ? colors.background : colors.textSecondary,
					}}
				>
					{rank}
				</span>
			</div>
		</section>
	);
}

export function Podium({ entries }: PodiumProps) {
	const byRank: Record<number, LeaderboardEntryPayload[]> = { 1: [], 2: [], 3: [] };
	for (const entry of entries) {
		if (entry.rank >= 1 && entry.rank <= 3) {
			byRank[entry.rank].push(entry);
		}
	}

	return (
		<div
			style={{
				display: "flex",
				alignItems: "flex-end",
				gap: spacing.sm,
				width: "100%",
				marginBottom: spacing.xl,
			}}
		>
			<PodiumSlot rank={2} players={byRank[2]} />
			<PodiumSlot rank={1} players={byRank[1]} />
			<PodiumSlot rank={3} players={byRank[3]} />
		</div>
	);
}
