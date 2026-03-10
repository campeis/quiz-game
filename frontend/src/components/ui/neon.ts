import type React from "react";

export type NeonIntensity = "low" | "medium" | "high";

/**
 * Generate a multi-layer CSS box-shadow string for neon glow effects.
 * low → 2 layers, medium → 3 layers, high → 4 layers.
 */
export function neonBoxShadow(color: string, intensity: NeonIntensity = "medium"): string {
	const base = `0 0 4px ${color}`;
	const mid = `0 0 10px ${color}`;
	const outer = `0 0 20px ${color}`;
	const bloom = `0 0 40px ${color}`;

	switch (intensity) {
		case "low":
			return [base, mid].join(", ");
		case "high":
			return [base, mid, outer, bloom].join(", ");
		default:
			return [base, mid, outer].join(", ");
	}
}

/**
 * Generate a multi-layer CSS text-shadow string for neon glow effects.
 * Uses smaller blur radii than neonBoxShadow to suit text rendering.
 * low → 2 layers, medium → 3 layers, high → 4 layers.
 *
 * @param color - Must differ from the element's background-color; applying
 *   glow in the same hue as the background causes text to blend in.
 */
export function neonTextShadow(color: string, intensity: NeonIntensity = "medium"): string {
	const base = `0 0 2px ${color}`;
	const mid = `0 0 6px ${color}`;
	const outer = `0 0 12px ${color}`;
	const bloom = `0 0 24px ${color}`;

	switch (intensity) {
		case "low":
			return [base, mid].join(", ");
		case "high":
			return [base, mid, outer, bloom].join(", ");
		default:
			return [base, mid, outer].join(", ");
	}
}

/**
 * Return a React.CSSProperties object that applies the neonPulse animation
 * with a low-intensity glow in the given color. The keyframe is
 * color-agnostic (opacity only); the color is supplied via boxShadow.
 */
export function neonPulseStyle(color: string): React.CSSProperties {
	return {
		animation: "neonPulse 2s ease-in-out infinite",
		boxShadow: neonBoxShadow(color, "low"),
	};
}
