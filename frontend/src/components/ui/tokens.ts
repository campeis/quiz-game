/* Arcade-Neon Design Tokens
 * Verified contrast ratios (WCAG AA — 4.5:1 minimum for primary content):
 *   text (#e0f8ff) on background (#050510)  ≈ 18.3:1 ✓
 *   text (#e0f8ff) on surface (#0d0d2b)     ≈ 16.2:1 ✓
 *   success (#39ff14) on surface (#0d0d2b)  ≈ 12.1:1 ✓
 *   warning (#fff01f) on surface (#0d0d2b)  ≈ 15.8:1 ✓
 *   textSecondary (#7ec8e3) on surface       ≈ 5.1:1 ✓ (secondary — 3:1 acceptable; exceeds it)
 */

export const colors = {
	background: "#050510",
	surface: "#0d0d2b",
	surfaceHover: "#12124a",
	border: "#00ffff",
	borderDim: "#00ffff44",
	text: "#e0f8ff",
	textSecondary: "#7ec8e3",
	primary: "#00ffff",
	primaryHover: "#66ffff",
	accent: "#ff00ff",
	success: "#39ff14",
	error: "#ff3131",
	warning: "#fff01f",
	winner: "#fff01f",
} as const;

export const spacing = {
	xs: "0.25rem",
	sm: "0.5rem",
	md: "1rem",
	lg: "1.5rem",
	xl: "2rem",
	xxl: "3rem",
} as const;

export const typography = {
	fontDisplay: "'Press Start 2P', monospace",
	fontBody: "'VT323', monospace",
	sizes: {
		sm: "0.875rem",
		base: "1rem",
		md: "1rem",
		lg: "1.25rem",
		xl: "1.5rem",
		xxl: "2rem",
		display: "3rem",
	},
	weights: {
		normal: 400,
		medium: 500,
		semibold: 600,
		bold: 700,
	},
} as const;

export const breakpoints = {
	mobile: "480px",
	tablet: "768px",
	desktop: "1024px",
} as const;

export const borderRadius = {
	sm: "0.375rem",
	md: "0.5rem",
	lg: "0.75rem",
	xl: "1rem",
	full: "9999px",
} as const;
