import { useState } from "react";
import type { ApiError, SessionInfo } from "../services/api";
import { getSession } from "../services/api";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { colors, spacing, typography } from "./ui/tokens";

interface JoinFormProps {
	onJoined: (info: SessionInfo, displayName: string) => void;
}

export function JoinForm({ onJoined }: JoinFormProps) {
	const [joinCode, setJoinCode] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!joinCode.trim()) {
			setError("Please enter a join code");
			return;
		}
		if (!displayName.trim()) {
			setError("Please enter a display name");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const info = await getSession(joinCode.trim().toUpperCase());
			onJoined(info, displayName.trim());
		} catch (err) {
			const apiError = err as ApiError;
			setError(apiError.message || "Failed to join game");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card style={{ maxWidth: "400px", width: "100%" }}>
			<form
				aria-label="Join a game"
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<h2 style={{ color: colors.text, fontSize: typography.sizes.xl, marginBottom: spacing.lg }}>
					Join a Game
				</h2>
				<label
					htmlFor="join-code"
					style={{
						display: "block",
						color: colors.textSecondary,
						fontSize: typography.sizes.sm,
						marginBottom: spacing.xs,
					}}
				>
					Join Code
				</label>
				<input
					id="join-code"
					type="text"
					value={joinCode}
					onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
					placeholder="Enter 6-character code"
					autoComplete="off"
					maxLength={6}
					style={{
						display: "block",
						width: "100%",
						padding: spacing.md,
						marginBottom: spacing.lg,
						fontSize: typography.sizes.xl,
						textAlign: "center",
						letterSpacing: "0.15em",
						fontWeight: typography.weights.bold,
						border: `2px solid ${colors.border}`,
						borderRadius: "8px",
						backgroundColor: colors.background,
						color: colors.text,
						fontFamily: typography.fontFamily,
						boxSizing: "border-box",
					}}
				/>
				<label
					htmlFor="display-name"
					style={{
						display: "block",
						color: colors.textSecondary,
						fontSize: typography.sizes.sm,
						marginBottom: spacing.xs,
					}}
				>
					Display Name
				</label>
				<input
					id="display-name"
					type="text"
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
					placeholder="Your name"
					autoComplete="off"
					maxLength={20}
					style={{
						display: "block",
						width: "100%",
						padding: spacing.md,
						marginBottom: spacing.lg,
						fontSize: typography.sizes.md,
						border: `2px solid ${colors.border}`,
						borderRadius: "8px",
						backgroundColor: colors.background,
						color: colors.text,
						fontFamily: typography.fontFamily,
						boxSizing: "border-box",
					}}
				/>
				<Button onClick={handleSubmit} loading={loading} style={{ width: "100%" }}>
					Join Game
				</Button>
				{error && (
					<p
						role="alert"
						style={{ color: colors.error, marginTop: spacing.md, textAlign: "center" }}
					>
						{error}
					</p>
				)}
			</form>
		</Card>
	);
}
