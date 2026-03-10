import { useEffect, useState } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { neonBoxShadow, neonTextShadow } from "./neon";
import { borderRadius, colors, spacing, typography } from "./tokens";

interface TimerProps {
	totalSeconds: number;
	onExpired?: () => void;
	running: boolean;
}

export function Timer({ totalSeconds, onExpired, running }: TimerProps) {
	const [remaining, setRemaining] = useState(totalSeconds);
	const prefersReducedMotion = useReducedMotion();

	useEffect(() => {
		setRemaining(totalSeconds);
	}, [totalSeconds]);

	useEffect(() => {
		if (!running || remaining <= 0) return;

		const interval = setInterval(() => {
			setRemaining((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					onExpired?.();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [running, remaining, onExpired]);

	const ratio = remaining / totalSeconds;
	const urgencyColor = ratio > 0.33 ? colors.primary : ratio > 0.15 ? colors.warning : colors.error;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: spacing.xs,
			}}
		>
			<span
				style={{
					fontSize: typography.sizes.xxl,
					fontWeight: typography.weights.bold,
					fontFamily: typography.fontDisplay,
					color: urgencyColor,
					textShadow: neonTextShadow(urgencyColor, "medium"),
				}}
				role="timer"
				aria-label={`${remaining} seconds remaining`}
			>
				{remaining}
			</span>
			<div
				style={{
					width: "100%",
					maxWidth: "200px",
					height: "6px",
					backgroundColor: colors.borderDim,
					borderRadius: borderRadius.full,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						width: `${ratio * 100}%`,
						height: "100%",
						backgroundColor: urgencyColor,
						borderRadius: borderRadius.full,
						boxShadow: neonBoxShadow(urgencyColor, "low"),
						transition: prefersReducedMotion
							? "none"
							: "width 1s linear, background-color 0.3s ease",
					}}
				/>
			</div>
		</div>
	);
}
