import type { HTMLAttributes } from "react";
import { colors, spacing } from "./tokens";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	padding?: string;
}

export function Card({ padding = spacing.lg, style, children, ...props }: CardProps) {
	return (
		<div
			style={{
				backgroundColor: colors.surface,
				borderRadius: "4px",
				borderTop: `2px solid ${colors.primary}`,
				borderRight: `1px solid ${colors.border}`,
				borderBottom: `1px solid ${colors.border}`,
				borderLeft: `1px solid ${colors.border}`,
				padding,
				boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
				animation: "enterUp 0.22s ease-out both",
				...style,
			}}
			{...props}
		>
			{children}
		</div>
	);
}
