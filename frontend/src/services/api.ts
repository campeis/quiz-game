export interface QuizPreview {
	title: string;
	question_count: number;
	preview: { text: string; option_count: number }[];
	quiz_id: string;
}

export interface SessionInfo {
	join_code: string;
	session_status: string;
	player_count: number;
	quiz_title: string;
	ws_url: string;
}

export interface CreateSessionResponse {
	join_code: string;
	session_status: string;
	ws_url: string;
}

export interface ApiError {
	error: string;
	message: string;
	messages?: { line: number; message: string }[];
}

export async function uploadQuiz(file: File): Promise<QuizPreview> {
	const formData = new FormData();
	formData.append("quiz_file", file);

	const response = await fetch("/api/quiz", {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		const error: ApiError = await response.json();
		throw error;
	}

	return response.json();
}

export async function createSession(quizId: string): Promise<CreateSessionResponse> {
	const response = await fetch("/api/sessions", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ quiz_id: quizId }),
	});

	if (!response.ok) {
		const error: ApiError = await response.json();
		throw error;
	}

	return response.json();
}

export async function getSession(joinCode: string): Promise<SessionInfo> {
	const response = await fetch(`/api/sessions/${joinCode}`);

	if (!response.ok) {
		const error: ApiError = await response.json();
		throw error;
	}

	return response.json();
}
