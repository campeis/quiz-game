import type { ButtonHTMLAttributes } from "react";
import { useState } from "react";
import { borderRadius, colors, spacing, typography } from "./tokens";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	loading?: boolean;
}

export function Button({
	variant = "primary",
	loading = false,
	disabled,
	style,
	children,
	onMouseEnter,
	onMouseLeave,
	...props
}: ButtonProps) {
	const [pressed, setPressed] = useState(false);

	const variantBase: React.CSSProperties =
		variant === "primary"
			? {
					backgroundColor: disabled || loading ? "#555500" : colors.primary,
					color: "#000000",
					border: "none",
					transform: pressed ? "scale(0.96)" : "scale(1)",
				}
			: {
					backgroundColor: "transparent",
					color: colors.textSecondary,
					border: `1px solid ${colors.border}`,
					transform: pressed ? "scale(0.96)" : "scale(1)",
				};

	return (
		<button
			disabled={disabled || loading}
			onMouseDown={() => setPressed(true)}
			onMouseUp={() => setPressed(false)}
			onMouseLeave={(e) => {
				setPressed(false);
				onMouseLeave?.(e);
			}}
			onMouseEnter={(e) => {
				onMouseEnter?.(e);
			}}
			style={{
				padding: `${spacing.sm} ${spacing.lg}`,
				borderRadius: borderRadius.md,
				fontSize: typography.sizes.base,
				fontWeight: typography.weights.bold,
				fontFamily: typography.fontDisplay,
				cursor: disabled || loading ? "not-allowed" : "pointer",
				opacity: disabled || loading ? 0.5 : 1,
				transition: "transform 0.08s ease, background-color 0.1s ease, opacity 0.1s ease",
				letterSpacing: "0.02em",
				...variantBase,
				...style,
			}}
			{...props}
		>
			{loading ? "Loading..." : children}
		</button>
	);
}
