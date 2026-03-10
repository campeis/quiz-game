import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useReducedMotion } from "../../../src/hooks/useReducedMotion";

describe("useReducedMotion", () => {
	let mockMatchMedia: ReturnType<typeof vi.fn>;
	let listeners: Array<(e: { matches: boolean }) => void>;

	beforeEach(() => {
		listeners = [];
		mockMatchMedia = vi.fn((query: string) => {
			const mql = {
				matches: false,
				media: query,
				onchange: null,
				addEventListener: vi.fn(
					(_event: string, cb: (e: { matches: boolean }) => void) => {
						listeners.push(cb);
					},
				),
				removeEventListener: vi.fn(
					(_event: string, cb: (e: { matches: boolean }) => void) => {
						listeners = listeners.filter((l) => l !== cb);
					},
				),
				dispatchEvent: vi.fn(),
			};
			return mql;
		});
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: mockMatchMedia,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns false when prefers-reduced-motion is not set", () => {
		mockMatchMedia.mockReturnValue({
			matches: false,
			media: "(prefers-reduced-motion: reduce)",
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});
		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(false);
	});

	it("returns true when prefers-reduced-motion: reduce is active", () => {
		mockMatchMedia.mockReturnValue({
			matches: true,
			media: "(prefers-reduced-motion: reduce)",
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});
		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(true);
	});

	it("updates when the media query match changes", () => {
		const mql = {
			matches: false,
			media: "(prefers-reduced-motion: reduce)",
			addEventListener: vi.fn(
				(_event: string, cb: (e: { matches: boolean }) => void) => {
					listeners.push(cb);
				},
			),
			removeEventListener: vi.fn(),
		};
		mockMatchMedia.mockReturnValue(mql);

		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(false);

		act(() => {
			for (const cb of listeners) {
				cb({ matches: true });
			}
		});

		expect(result.current).toBe(true);
	});

	it("removes the event listener on unmount", () => {
		const removeEventListener = vi.fn();
		mockMatchMedia.mockReturnValue({
			matches: false,
			media: "(prefers-reduced-motion: reduce)",
			addEventListener: vi.fn(),
			removeEventListener,
		});

		const { unmount } = renderHook(() => useReducedMotion());
		unmount();

		expect(removeEventListener).toHaveBeenCalledOnce();
	});
});
