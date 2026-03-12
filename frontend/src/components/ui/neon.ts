import type React from "react";

export type NeonIntensity = "low" | "medium" | "high";

/** No-op: neon glow effects are disabled. */
export function neonBoxShadow(_color: string, _intensity: NeonIntensity = "medium"): string {
	return "";
}

/** No-op: neon glow effects are disabled. */
export function neonTextShadow(_color: string, _intensity: NeonIntensity = "medium"): string {
	return "";
}

/** No-op: neon pulse animation is disabled. */
export function neonPulseStyle(_color: string): React.CSSProperties {
	return {};
}
