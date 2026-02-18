import { useCallback, useEffect, useRef, useState } from "react";
import type { WsMessage } from "../services/messages";

export type ConnectionState = "connecting" | "connected" | "disconnected" | "reconnecting";

interface UseWebSocketOptions {
	url: string | null;
	onMessage?: (message: WsMessage) => void;
	reconnect?: boolean;
	maxRetries?: number;
}

export function useWebSocket({
	url,
	onMessage,
	reconnect = true,
	maxRetries = 5,
}: UseWebSocketOptions) {
	const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
	const wsRef = useRef<WebSocket | null>(null);
	const retriesRef = useRef(0);
	const onMessageRef = useRef(onMessage);
	onMessageRef.current = onMessage;

	const connect = useCallback(() => {
		if (!url) return;

		setConnectionState("connecting");
		const ws = new WebSocket(url);
		wsRef.current = ws;

		ws.onopen = () => {
			setConnectionState("connected");
			retriesRef.current = 0;
		};

		ws.onmessage = (event) => {
			try {
				const message: WsMessage = JSON.parse(event.data);
				onMessageRef.current?.(message);
			} catch {
				console.error("Failed to parse WebSocket message:", event.data);
			}
		};

		ws.onclose = () => {
			wsRef.current = null;
			setConnectionState("disconnected");

			if (reconnect && retriesRef.current < maxRetries) {
				retriesRef.current++;
				const delay = Math.min(1000 * 2 ** retriesRef.current, 30000);
				setConnectionState("reconnecting");
				setTimeout(connect, delay);
			}
		};

		ws.onerror = () => {
			ws.close();
		};
	}, [url, reconnect, maxRetries]);

	useEffect(() => {
		connect();
		return () => {
			wsRef.current?.close();
		};
	}, [connect]);

	const send = useCallback((message: WsMessage) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(message));
		}
	}, []);

	const close = useCallback(() => {
		retriesRef.current = maxRetries; // prevent reconnection
		wsRef.current?.close();
	}, [maxRetries]);

	return { connectionState, send, close };
}
