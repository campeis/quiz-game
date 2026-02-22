import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGameState } from "../../../src/hooks/useGameState";

describe("useGameState", () => {
	it("adds player with avatar on player_joined message", () => {
		const { result } = renderHook(() => useGameState());

		act(() => {
			result.current.handleMessage({
				type: "player_joined",
				payload: {
					player_id: "id-1",
					display_name: "Alice",
					avatar: "🦁",
					player_count: 1,
				},
			});
		});

		expect(result.current.gameState.players).toHaveLength(1);
		expect(result.current.gameState.players[0]).toEqual({
			id: "id-1",
			name: "Alice",
			avatar: "🦁",
		});
	});

	it("updates player entry with stored avatar on player_reconnected message", () => {
		const { result } = renderHook(() => useGameState());

		// First player joins
		act(() => {
			result.current.handleMessage({
				type: "player_joined",
				payload: {
					player_id: "id-1",
					display_name: "Alice",
					avatar: "🦁",
					player_count: 1,
				},
			});
		});

		// Player reconnects — avatar comes from stored player on backend
		act(() => {
			result.current.handleMessage({
				type: "player_reconnected",
				payload: {
					player_id: "id-1",
					display_name: "Alice",
					avatar: "🦁",
					player_count: 1,
				},
			});
		});

		// Still one player with correct avatar
		expect(result.current.gameState.players).toHaveLength(1);
		expect(result.current.gameState.players[0].avatar).toBe("🦁");
	});
});
