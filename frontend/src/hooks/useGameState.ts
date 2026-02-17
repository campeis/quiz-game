import { useCallback, useReducer } from "react";
import {
	MSG,
	type AnswerCountPayload,
	type AnswerResultPayload,
	type GameFinishedPayload,
	type GameStartingPayload,
	type LeaderboardEntryPayload,
	type PlayerJoinedPayload,
	type PlayerLeftPayload,
	type QuestionEndedPayload,
	type QuestionPayload,
	type WsMessage,
} from "../services/messages";

export type GamePhase = "lobby" | "starting" | "question" | "question_ended" | "finished" | "paused";

export interface GameState {
	phase: GamePhase;
	players: { id: string; name: string }[];
	playerCount: number;
	totalQuestions: number;
	currentQuestion: QuestionPayload | null;
	answerResult: AnswerResultPayload | null;
	answerCount: AnswerCountPayload | null;
	leaderboard: LeaderboardEntryPayload[];
	countdown: number;
}

const initialState: GameState = {
	phase: "lobby",
	players: [],
	playerCount: 0,
	totalQuestions: 0,
	currentQuestion: null,
	answerResult: null,
	answerCount: null,
	leaderboard: [],
	countdown: 0,
};

type Action = { type: "WS_MESSAGE"; message: WsMessage } | { type: "RESET" };

function reducer(state: GameState, action: Action): GameState {
	if (action.type === "RESET") return initialState;

	const { message } = action;
	switch (message.type) {
		case MSG.PLAYER_JOINED: {
			const p = message.payload as PlayerJoinedPayload;
			return {
				...state,
				players: [...state.players, { id: p.player_id, name: p.display_name }],
				playerCount: p.player_count,
			};
		}
		case MSG.PLAYER_LEFT: {
			const p = message.payload as PlayerLeftPayload;
			return {
				...state,
				players: state.players.filter((pl) => pl.id !== p.player_id),
				playerCount: p.player_count,
			};
		}
		case MSG.GAME_STARTING: {
			const p = message.payload as GameStartingPayload;
			return { ...state, phase: "starting", totalQuestions: p.total_questions, countdown: p.countdown_sec };
		}
		case MSG.QUESTION: {
			const p = message.payload as QuestionPayload;
			return { ...state, phase: "question", currentQuestion: p, answerResult: null, answerCount: null };
		}
		case MSG.ANSWER_COUNT:
			return { ...state, answerCount: message.payload as AnswerCountPayload };
		case MSG.ANSWER_RESULT:
			return { ...state, answerResult: message.payload as AnswerResultPayload };
		case MSG.QUESTION_ENDED: {
			const p = message.payload as QuestionEndedPayload;
			return { ...state, phase: "question_ended", leaderboard: p.leaderboard };
		}
		case MSG.GAME_FINISHED: {
			const p = message.payload as GameFinishedPayload;
			return { ...state, phase: "finished", leaderboard: p.leaderboard };
		}
		case MSG.GAME_PAUSED:
			return { ...state, phase: "paused" };
		case MSG.GAME_RESUMED:
			return { ...state, phase: state.currentQuestion ? "question" : "lobby" };
		default:
			return state;
	}
}

export function useGameState() {
	const [state, dispatch] = useReducer(reducer, initialState);

	const handleMessage = useCallback((message: WsMessage) => {
		dispatch({ type: "WS_MESSAGE", message });
	}, []);

	const reset = useCallback(() => {
		dispatch({ type: "RESET" });
	}, []);

	return { gameState: state, handleMessage, reset };
}
