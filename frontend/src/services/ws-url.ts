/**
 * Build a full WebSocket URL from a path like `/ws/host/ABC123`.
 *
 * In production the WS endpoint lives on the same host as the page.
 * In development the rspack dev-server runs on :5173 but the backend
 * (and its WS endpoints) listens on :3000, so we connect directly to
 * avoid the dev-server HTTP proxy which has a known ws close-frame
 * race condition (ERR_STREAM_WRITE_AFTER_END).
 */
export function buildWsUrl(path: string): string {
	const isDev = window.location.port === "5173";
	if (isDev) {
		return `ws://localhost:3000${path}`;
	}
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}${path}`;
}
