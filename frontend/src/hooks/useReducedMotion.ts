import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Returns true when the user has opted into reduced motion via OS settings.
 * Subscribes to media query changes so it reflects live preference updates.
 */
export function useReducedMotion(): boolean {
	const [prefersReduced, setPrefersReduced] = useState(() => window.matchMedia(QUERY).matches);

	useEffect(() => {
		const mql = window.matchMedia(QUERY);
		const handler = (e: { matches: boolean }) => {
			setPrefersReduced(e.matches);
		};
		mql.addEventListener("change", handler);
		return () => {
			mql.removeEventListener("change", handler);
		};
	}, []);

	return prefersReduced;
}
