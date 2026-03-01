import { useCallback, useState } from "react";
import { HostDashboard } from "../components/HostDashboard";
import { Leaderboard } from "../components/Leaderboard";
import { Lobby } from "../components/Lobby";
import { QuizUpload } from "../components/QuizUpload";
import { colors, spacing, typography } from "../components/ui/tokens";
import { useGameState } from "../hooks/useGameState";
import { useWebSocket } from "../hooks/useWebSocket";
import type { QuizPreview } from "../services/api";
import { createSession } from "../services/api";
import { MSG, type ScoringRuleName } from "../services/messages";
import { buildWsUrl } from "../services/ws-url";

type HostPhase = "upload" | "lobby" | "playing" | "finished";

export function HostPage() {
	const [phase, setPhase] = useState<HostPhase>("upload");
	const [joinCode, setJoinCode] = useState("");
	const [wsUrl, setWsUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const { gameState, handleMessage } = useGameState();

	const onMessage = useCallback(
		(msg: Parameters<typeof handleMessage>[0]) => {
			handleMessage(msg);

			if (msg.type === MSG.GAME_STARTING) {
				setPhase("playing");
			} else if (msg.type === MSG.GAME_FINISHED) {
				setPhase("finished");
			}
		},
		[handleMessage],
	);

	const { send, connectionState } = useWebSocket({
		url: wsUrl,
		onMessage,
	});

	const handleQuizUploaded = async (preview: QuizPreview) => {
		try {
			const session = await createSession(preview.quiz_id);
			setJoinCode(session.join_code);
			setWsUrl(buildWsUrl(session.ws_url));
			setPhase("lobby");
		} catch (_err) {
			setError("Failed to create session");
		}
	};

	const handleStartGame = () => {
		send({ type: MSG.START_GAME, payload: {} });
	};

	const handleScoringRuleChange = (rule: ScoringRuleName) => {
		send({ type: MSG.SET_SCORING_RULE, payload: { rule } });
	};

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
				fontFamily: typography.fontFamily,
			}}
		>
			<h1
				style={{
					color: colors.text,
					fontSize: typography.sizes.xxl,
					marginBottom: spacing.lg,
				}}
			>
				Host a Quiz
			</h1>

			{connectionState === "connecting" && (
				<p style={{ color: colors.textSecondary }}>Connecting...</p>
			)}

			{error && <p style={{ color: colors.error, marginBottom: spacing.md }}>{error}</p>}

			{phase === "upload" && <QuizUpload onQuizUploaded={handleQuizUploaded} />}

			{phase === "lobby" && (
				<Lobby
					joinCode={joinCode}
					gameState={gameState}
					isHost={true}
					onStartGame={handleStartGame}
					onScoringRuleChange={handleScoringRuleChange}
				/>
			)}

			{phase === "playing" && <HostDashboard gameState={gameState} />}

			{phase === "finished" && <Leaderboard entries={gameState.leaderboard} isFinal={true} />}
		</main>
	);
}
