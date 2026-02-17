import type { ButtonHTMLAttributes } from "react";
import { borderRadius, colors, spacing, typography } from "./tokens";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	loading?: boolean;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
	primary: {
		backgroundColor: colors.primary,
		color: colors.text,
		border: "none",
	},
	secondary: {
		backgroundColor: "transparent",
		color: colors.text,
		border: `2px solid ${colors.border}`,
	},
};

export function Button({
	variant = "primary",
	loading = false,
	disabled,
	style,
	children,
	...props
}: ButtonProps) {
	return (
		<button
			disabled={disabled || loading}
			style={{
				padding: `${spacing.sm} ${spacing.lg}`,
				borderRadius: borderRadius.md,
				fontSize: typography.sizes.base,
				fontWeight: typography.weights.semibold,
				fontFamily: typography.fontFamily,
				cursor: disabled || loading ? "not-allowed" : "pointer",
				opacity: disabled || loading ? 0.6 : 1,
				transition: "all 0.15s ease",
				...variantStyles[variant],
				...style,
			}}
			{...props}
		>
			{loading ? "Loading..." : children}
		</button>
	);
}
