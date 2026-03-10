import type { ButtonHTMLAttributes } from "react";
import { useState } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { neonBoxShadow, neonPulseStyle } from "./neon";
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
	const [hovered, setHovered] = useState(false);
	const prefersReducedMotion = useReducedMotion();

	const variantBase: React.CSSProperties =
		variant === "primary"
			? {
					backgroundColor: "transparent",
					color: colors.primary,
					border: `2px solid ${colors.primary}`,
					boxShadow: hovered
						? prefersReducedMotion
							? neonBoxShadow(colors.primary, "high")
							: neonPulseStyle(colors.primary).boxShadow
						: neonBoxShadow(colors.primary, "medium"),
					animation:
						hovered && !prefersReducedMotion
							? (neonPulseStyle(colors.primary).animation as string)
							: "none",
				}
			: {
					backgroundColor: "transparent",
					color: colors.textSecondary,
					border: `2px solid ${colors.borderDim}`,
					boxShadow: neonBoxShadow(colors.borderDim, "low"),
				};

	return (
		<button
			disabled={disabled || loading}
			onMouseEnter={(e) => {
				setHovered(true);
				onMouseEnter?.(e);
			}}
			onMouseLeave={(e) => {
				setHovered(false);
				onMouseLeave?.(e);
			}}
			style={{
				padding: `${spacing.sm} ${spacing.lg}`,
				borderRadius: borderRadius.md,
				fontSize: typography.sizes.base,
				fontWeight: typography.weights.semibold,
				fontFamily: typography.fontDisplay,
				cursor: disabled || loading ? "not-allowed" : "pointer",
				opacity: disabled || loading ? 0.6 : 1,
				transition: "box-shadow 0.15s ease, border-color 0.15s ease, color 0.15s ease",
				...variantBase,
				...style,
			}}
			{...props}
		>
			{loading ? "Loading..." : children}
		</button>
	);
}
