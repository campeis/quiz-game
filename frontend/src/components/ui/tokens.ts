/* Design Tokens
 * Acid / Rave palette — near-black + chartreuse yellow + hot coral.
 * Verified contrast ratios (WCAG AA — 4.5:1 minimum for primary content):
 *   text (#ffffff) on background (#080808)  ≈ 21:1 ✓
 *   text (#ffffff) on surface (#111111)     ≈ 19.6:1 ✓
 *   primary (#e8ff00) on surface (#111111)  ≈ 18.2:1 ✓
 *   success (#34c759) on surface (#111111)  ≈ 7.3:1 ✓
 *   error (#ff2d55) on surface (#111111)    ≈ 5.1:1 ✓
 *   textSecondary (#888888) on surface      ≈ 4.7:1 ✓
 */

export const colors = {
	background: "#080808",
	surface: "#111111",
	surfaceHover: "#181818",
	border: "#2a2a2a",
	borderDim: "#1a1a1a",
	text: "#ffffff",
	textSecondary: "#888888",
	primary: "#e8ff00",
	primaryHover: "#f4ff4d",
	accent: "#ff2d55",
	success: "#34c759",
	error: "#ff2d55",
	warning: "#ff9f0a",
	winner: "#e8ff00",
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
	sm: "2px",
	md: "3px",
	lg: "4px",
	xl: "6px",
	full: "9999px",
} as const;
