import { useRef, useState } from "react";
import type { ApiError, SessionInfo } from "../services/api";
import { getSession } from "../services/api";
import { AvatarPickerModal } from "./AvatarPickerModal";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { borderRadius, colors, spacing, typography } from "./ui/tokens";

const DEFAULT_AVATAR = "🙂";

interface JoinFormProps {
	onJoined: (info: SessionInfo, displayName: string, avatar: string) => void;
}

export function JoinForm({ onJoined }: JoinFormProps) {
	const [joinCode, setJoinCode] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const avatarPreviewRef = useRef<HTMLButtonElement>(null);

	const handleAvatarSelect = (emoji: string) => {
		setAvatar(emoji);
		setIsModalOpen(false);
		avatarPreviewRef.current?.focus();
	};

	const handleModalClose = () => {
		setIsModalOpen(false);
		avatarPreviewRef.current?.focus();
	};

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
			onJoined(info, displayName.trim(), avatar);
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
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: spacing.sm,
						marginBottom: spacing.lg,
					}}
				>
					<button
						ref={avatarPreviewRef}
						type="button"
						aria-label="Choose avatar"
						onClick={() => setIsModalOpen(true)}
						style={{
							fontSize: typography.sizes.xxl,
							minWidth: "48px",
							minHeight: "48px",
							backgroundColor: colors.surface,
							border: `2px solid ${colors.border}`,
							borderRadius: borderRadius.md,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
						}}
					>
						{avatar}
					</button>
					<input
						id="display-name"
						type="text"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						placeholder="Your name"
						autoComplete="off"
						maxLength={20}
						style={{
							flex: 1,
							padding: spacing.md,
							fontSize: typography.sizes.md,
							border: `2px solid ${colors.border}`,
							borderRadius: "8px",
							backgroundColor: colors.background,
							color: colors.text,
							fontFamily: typography.fontFamily,
							boxSizing: "border-box",
						}}
					/>
				</div>
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
			<AvatarPickerModal
				open={isModalOpen}
				selected={avatar}
				onSelect={handleAvatarSelect}
				onClose={handleModalClose}
			/>
		</Card>
	);
}
