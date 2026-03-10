import "@testing-library/jest-dom/vitest";

// jsdom does not implement window.matchMedia — provide a no-op stub so that
// components using useReducedMotion() do not throw in unit tests.
if (typeof window !== "undefined" && !window.matchMedia) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		}),
	});
}
