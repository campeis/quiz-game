import type { HTMLAttributes } from "react";
import { borderRadius, colors, spacing } from "./tokens";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	padding?: string;
}

export function Card({ padding = spacing.lg, style, children, ...props }: CardProps) {
	return (
		<div
			style={{
				backgroundColor: colors.surface,
				borderRadius: borderRadius.lg,
				border: `1px solid ${colors.border}`,
				padding,
				...style,
			}}
			{...props}
		>
			{children}
		</div>
	);
}
