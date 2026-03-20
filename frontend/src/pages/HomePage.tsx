import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { colors, spacing, typography } from "../components/ui/tokens";

export function HomePage() {
	const navigate = useNavigate();

	return (
		<main
			style={{
				minHeight: "100vh",
				backgroundColor: colors.background,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: spacing.lg,
				fontFamily: typography.fontBody,
			}}
		>
			<h1
				style={{
					color: colors.primary,
					fontSize: typography.sizes.display,
					fontFamily: typography.fontDisplay,
					fontWeight: typography.weights.bold,
					marginBottom: spacing.xl,
					textAlign: "center",
				}}
			>
				Quiz Game
			</h1>
			<p
				style={{
					color: colors.textSecondary,
					fontSize: typography.sizes.xl,
					fontFamily: typography.fontBody,
					marginBottom: spacing.xxl,
					textAlign: "center",
				}}
			>
				Host a quiz or join a game
			</p>
			<div style={{ display: "flex", gap: spacing.lg, flexWrap: "wrap", justifyContent: "center" }}>
				<Card style={{ textAlign: "center", width: "280px" }}>
					<h2
						style={{
							color: colors.text,
							fontSize: typography.sizes.lg,
							fontFamily: typography.fontDisplay,
							marginBottom: spacing.sm,
						}}
					>
						Host a Quiz
					</h2>
					<p
						style={{
							color: colors.textSecondary,
							fontFamily: typography.fontBody,
							fontSize: typography.sizes.xl,
							marginBottom: spacing.lg,
						}}
					>
						Upload a quiz file and invite players
					</p>
					<Button onClick={() => navigate("/host")} style={{ width: "100%" }}>
						Host a Quiz
					</Button>
				</Card>
				<Card style={{ textAlign: "center", width: "280px" }}>
					<h2
						style={{
							color: colors.text,
							fontSize: typography.sizes.lg,
							fontFamily: typography.fontDisplay,
							marginBottom: spacing.sm,
						}}
					>
						Join a Game
					</h2>
					<p
						style={{
							color: colors.textSecondary,
							fontFamily: typography.fontBody,
							fontSize: typography.sizes.xl,
							marginBottom: spacing.lg,
						}}
					>
						Enter a join code to play
					</p>
					<Button variant="secondary" onClick={() => navigate("/play")} style={{ width: "100%" }}>
						Join a Game
					</Button>
				</Card>
			</div>
		</main>
	);
}
