// === Message Envelope ===
export interface WsMessage<T = unknown> {
	type: string;
	payload: T;
}

// === Server → Client Payloads ===

export interface PlayerJoinedPayload {
	player_id: string;
	display_name: string;
	avatar: string;
	player_count: number;
}

export interface PlayerLeftPayload {
	player_id: string;
	display_name: string;
	avatar: string;
	player_count: number;
	reason: string;
}

export interface PlayerReconnectedPayload {
	player_id: string;
	display_name: string;
	avatar: string;
	player_count: number;
}

export interface GameStartingPayload {
	countdown_sec: number;
	total_questions: number;
}

export interface QuestionPayload {
	question_index: number;
	total_questions: number;
	text: string;
	options: string[];
	time_limit_sec: number;
}

export interface AnswerCountPayload {
	answered: number;
	total: number;
}

export interface AnswerResultPayload {
	correct: boolean;
	points_awarded: number;
	correct_index: number;
}

export interface LeaderboardEntryPayload {
	rank: number;
	display_name: string;
	avatar: string;
	score: number;
	correct_count: number;
	is_winner?: boolean;
}

export interface QuestionEndedPayload {
	correct_index: number;
	correct_text: string;
	leaderboard: LeaderboardEntryPayload[];
}

export interface GameFinishedPayload {
	leaderboard: LeaderboardEntryPayload[];
	total_questions: number;
}

export interface GamePausedPayload {
	reason: string;
	timeout_sec: number;
}

export interface GameTerminatedPayload {
	reason: string;
	final_leaderboard: LeaderboardEntryPayload[];
}

export interface ErrorPayload {
	code: string;
	message: string;
}

export interface NameAssignedPayload {
	requested_name: string;
	assigned_name: string;
}

// === Client → Server Payloads ===

export interface SubmitAnswerPayload {
	question_index: number;
	selected_index: number;
}

// === Message Type Constants ===
export const MSG = {
	// Server → Client
	PLAYER_JOINED: "player_joined",
	PLAYER_LEFT: "player_left",
	PLAYER_RECONNECTED: "player_reconnected",
	GAME_STARTING: "game_starting",
	QUESTION: "question",
	ANSWER_COUNT: "answer_count",
	ANSWER_RESULT: "answer_result",
	QUESTION_ENDED: "question_ended",
	GAME_FINISHED: "game_finished",
	GAME_PAUSED: "game_paused",
	GAME_RESUMED: "game_resumed",
	GAME_TERMINATED: "game_terminated",
	ERROR: "error",
	NAME_ASSIGNED: "name_assigned",
	// Client → Server
	SUBMIT_ANSWER: "submit_answer",
	START_GAME: "start_game",
	NEXT_QUESTION: "next_question",
	END_GAME: "end_game",
} as const;
