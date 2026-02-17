export const colors = {
	primary: "#6366f1",
	primaryHover: "#4f46e5",
	success: "#22c55e",
	error: "#ef4444",
	warning: "#f59e0b",
	background: "#0f172a",
	surface: "#1e293b",
	surfaceHover: "#334155",
	text: "#f8fafc",
	textSecondary: "#94a3b8",
	border: "#334155",
	accent: "#a78bfa",
	winner: "#fbbf24",
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
	fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
	sizes: {
		sm: "0.875rem",
		base: "1rem",
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
