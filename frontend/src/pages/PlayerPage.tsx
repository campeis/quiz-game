import { useCallback, useState } from "react";
import { JoinForm } from "../components/JoinForm";
import { Leaderboard } from "../components/Leaderboard";
import { Lobby } from "../components/Lobby";
import { Question } from "../components/Question";
import { colors, spacing, typography } from "../components/ui/tokens";
import { useGameState } from "../hooks/useGameState";
import { useWebSocket } from "../hooks/useWebSocket";
import type { SessionInfo } from "../services/api";
import { MSG } from "../services/messages";
import { buildWsUrl } from "../services/ws-url";

type PlayerPhase = "join" | "lobby" | "starting" | "question" | "question_ended" | "finished";

export function PlayerPage() {
	const [phase, setPhase] = useState<PlayerPhase>("join");
	const [wsUrl, setWsUrl] = useState<string | null>(null);
	const [joinCode, setJoinCode] = useState("");

	const { gameState, handleMessage } = useGameState();

	const onMessage = useCallback(
		(msg: Parameters<typeof handleMessage>[0]) => {
			handleMessage(msg);

			switch (msg.type) {
				case MSG.GAME_STARTING:
					setPhase("starting");
					break;
				case MSG.QUESTION:
					setPhase("question");
					break;
				case MSG.QUESTION_ENDED:
					setPhase("question_ended");
					break;
				case MSG.GAME_FINISHED:
					setPhase("finished");
					break;
			}
		},
		[handleMessage],
	);

	const { send, connectionState } = useWebSocket({
		url: wsUrl,
		onMessage,
	});

	const handleJoined = (info: SessionInfo, displayName: string) => {
		setJoinCode(info.join_code);
		setWsUrl(buildWsUrl(`${info.ws_url}?name=${encodeURIComponent(displayName)}`));
		setPhase("lobby");
	};

	const handleAnswer = (selectedIndex: number) => {
		if (gameState.currentQuestion) {
			send({
				type: MSG.SUBMIT_ANSWER,
				payload: {
					question_index: gameState.currentQuestion.question_index,
					selected_index: selectedIndex,
				},
			});
		}
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
			{connectionState === "connecting" && phase !== "join" && (
				<p style={{ color: colors.textSecondary, marginBottom: spacing.md }}>Connecting...</p>
			)}

			{phase === "join" && <JoinForm onJoined={handleJoined} />}

			{phase === "lobby" && <Lobby joinCode={joinCode} gameState={gameState} isHost={false} />}

			{phase === "starting" && (
				<div style={{ textAlign: "center" }}>
					<h2 style={{ color: colors.text, fontSize: typography.sizes.display }}>Get Ready!</h2>
					<p style={{ color: colors.textSecondary, fontSize: typography.sizes.lg }}>
						The quiz is about to begin...
					</p>
				</div>
			)}

			{(phase === "question" || phase === "question_ended") && gameState.currentQuestion && (
				<Question
					questionIndex={gameState.currentQuestion.question_index}
					totalQuestions={gameState.currentQuestion.total_questions}
					text={gameState.currentQuestion.text}
					options={gameState.currentQuestion.options}
					timeLimitSec={gameState.currentQuestion.time_limit_sec}
					onAnswer={handleAnswer}
					answerResult={gameState.answerResult}
					phase={phase}
				/>
			)}

			{phase === "finished" && <Leaderboard entries={gameState.leaderboard} isFinal={true} />}
		</main>
	);
}
