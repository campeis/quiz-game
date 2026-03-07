import { useState } from "react";
import type { GameState } from "../hooks/useGameState";
import type { ScoringRuleName } from "../services/messages";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { colors, spacing, typography } from "./ui/tokens";

interface LobbyProps {
	joinCode: string;
	gameState: GameState;
	isHost: boolean;
	onStartGame?: () => void;
	onScoringRuleChange?: (rule: ScoringRuleName) => void;
	timeLimitSec?: number;
	onTimeLimitChange?: (seconds: number) => void;
}

const SCORING_RULES: { value: ScoringRuleName; label: string; description: string }[] = [
	{ value: "stepped_decay", label: "Stepped Decay", description: "Score drops every 5 seconds" },
	{ value: "linear_decay", label: "Linear Decay", description: "Score drops every second" },
	{ value: "fixed_score", label: "Fixed Score", description: "Full points regardless of time" },
	{
		value: "streak_bonus",
		label: "Streak Bonus",
		description: "Multiplier grows with consecutive correct answers",
	},
];

export function Lobby({
	joinCode,
	gameState,
	isHost,
	onStartGame,
	onScoringRuleChange,
	timeLimitSec = 20,
	onTimeLimitChange,
}: LobbyProps) {
	const [localTimeLimit, setLocalTimeLimit] = useState<string>(String(timeLimitSec));

	const timeLimitNum = Number(localTimeLimit);
	const timeLimitError =
		localTimeLimit === "" || Number.isNaN(timeLimitNum)
			? "Please enter a valid number."
			: timeLimitNum < 10
				? "Time must be at least 10 seconds."
				: timeLimitNum > 60
					? "Time must be no more than 60 seconds."
					: null;

	const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value;
		setLocalTimeLimit(raw);
		const num = Number(raw);
		if (raw !== "" && !Number.isNaN(num) && num >= 10 && num <= 60) {
			onTimeLimitChange?.(num);
		}
	};

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
				<fieldset
					aria-label="Scoring Rule"
					style={{
						border: `1px solid ${colors.border}`,
						borderRadius: "8px",
						padding: spacing.md,
						marginBottom: spacing.md,
						textAlign: "left",
					}}
				>
					<legend
						style={{
							color: colors.textSecondary,
							fontSize: typography.sizes.sm,
							padding: `0 ${spacing.xs}`,
						}}
					>
						Scoring Rule
					</legend>
					{SCORING_RULES.map((rule) => (
						<label
							key={rule.value}
							style={{
								display: "flex",
								alignItems: "center",
								gap: spacing.sm,
								padding: `${spacing.xs} 0`,
								cursor: "pointer",
								color: colors.text,
								fontSize: typography.sizes.md,
							}}
						>
							<input
								type="radio"
								name="scoring_rule"
								value={rule.value}
								checked={gameState.scoringRule === rule.value}
								onChange={() => onScoringRuleChange?.(rule.value)}
							/>
							<span>
								<strong>{rule.label}</strong>
								<span
									style={{
										color: colors.textSecondary,
										fontSize: typography.sizes.sm,
										marginLeft: spacing.xs,
									}}
								>
									— {rule.description}
								</span>
							</span>
						</label>
					))}
				</fieldset>
			)}
			{isHost && (
				<fieldset
					aria-label="Question Time Limit"
					style={{
						border: `1px solid ${colors.border}`,
						borderRadius: "8px",
						padding: spacing.md,
						marginBottom: spacing.md,
						textAlign: "left",
					}}
				>
					<legend
						style={{
							color: colors.textSecondary,
							fontSize: typography.sizes.sm,
							padding: `0 ${spacing.xs}`,
						}}
					>
						Question Time Limit
					</legend>
					<div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
						<input
							type="number"
							min={10}
							max={60}
							value={localTimeLimit}
							onChange={handleTimeLimitChange}
							aria-describedby={timeLimitError ? "time-limit-error" : undefined}
							style={{
								width: "80px",
								padding: `${spacing.xs} ${spacing.sm}`,
								border: `1px solid ${timeLimitError ? colors.error : colors.border}`,
								borderRadius: "4px",
								backgroundColor: colors.surface,
								color: colors.text,
								fontSize: typography.sizes.md,
								fontFamily: typography.fontFamily,
							}}
						/>
						<span style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>
							seconds
						</span>
					</div>
					{timeLimitError && (
						<p
							id="time-limit-error"
							style={{
								color: colors.error,
								fontSize: typography.sizes.sm,
								marginTop: spacing.xs,
								marginBottom: 0,
							}}
						>
							{timeLimitError}
						</p>
					)}
				</fieldset>
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
