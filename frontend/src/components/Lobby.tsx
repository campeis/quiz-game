import type { GameState } from "../hooks/useGameState";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { colors, spacing, typography } from "./ui/tokens";

interface LobbyProps {
	joinCode: string;
	gameState: GameState;
	isHost: boolean;
	onStartGame?: () => void;
}

export function Lobby({ joinCode, gameState, isHost, onStartGame }: LobbyProps) {
	return (
		<Card style={{ maxWidth: "500px", width: "100%", textAlign: "center" }}>
			<h2 style={{ color: colors.text, fontSize: typography.sizes.xl, marginBottom: spacing.md }}>
				Waiting for Players
			</h2>
			<div
				style={{
					backgroundColor: colors.background,
					padding: spacing.lg,
					borderRadius: "8px",
					marginBottom: spacing.lg,
				}}
			>
				<p
					style={{
						color: colors.textSecondary,
						fontSize: typography.sizes.sm,
						marginBottom: spacing.xs,
					}}
				>
					Join Code
				</p>
				<p
					style={{
						color: colors.primary,
						fontSize: typography.sizes.display,
						fontWeight: typography.weights.bold,
						letterSpacing: "0.1em",
					}}
				>
					{joinCode}
				</p>
			</div>
			<p aria-live="polite" style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
				{gameState.playerCount} player{gameState.playerCount !== 1 ? "s" : ""} connected
			</p>
			{gameState.players.length > 0 && (
				<ul
					aria-label="Connected players"
					style={{
						marginBottom: spacing.lg,
						textAlign: "left",
						listStyle: "none",
						padding: 0,
						margin: 0,
					}}
				>
					{gameState.players.map((p) => (
						<li
							key={p.id}
							style={{
								padding: spacing.sm,
								borderBottom: `1px solid ${colors.border}`,
								color: colors.text,
							}}
						>
							{p.avatar} {p.name}
						</li>
					))}
				</ul>
			)}
			{isHost && (
				<Button
					onClick={onStartGame}
					disabled={gameState.playerCount === 0}
					style={{ width: "100%" }}
				>
					Start Quiz
				</Button>
			)}
			{!isHost && (
				<p style={{ color: colors.textSecondary, fontStyle: "italic" }}>
					Waiting for host to start the quiz...
				</p>
			)}
		</Card>
	);
}
