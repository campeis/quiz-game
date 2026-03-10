import { describe, expect, it } from "vitest";
import { neonBoxShadow, neonTextShadow, neonPulseStyle } from "../../../src/components/ui/neon";

describe("neonBoxShadow", () => {
	const color = "#00ffff";

	it("returns a 2-layer box-shadow string for intensity 'low'", () => {
		const result = neonBoxShadow(color, "low");
		const layers = result.split(",").map((s) => s.trim());
		expect(layers).toHaveLength(2);
		for (const layer of layers) {
			expect(layer).toContain("#00ffff");
		}
	});

	it("returns a 3-layer box-shadow string for intensity 'medium' (default)", () => {
		const result = neonBoxShadow(color);
		const layers = result.split(",").map((s) => s.trim());
		expect(layers).toHaveLength(3);
	});

	it("returns a 4-layer box-shadow string for intensity 'high'", () => {
		const result = neonBoxShadow(color, "high");
		const layers = result.split(",").map((s) => s.trim());
		expect(layers).toHaveLength(4);
	});

	it("includes the provided hex color in every layer", () => {
		for (const intensity of ["low", "medium", "high"] as const) {
			const result = neonBoxShadow("#ff00ff", intensity);
			const layers = result.split(",").map((s) => s.trim());
			for (const layer of layers) {
				expect(layer).toContain("#ff00ff");
			}
		}
	});
});

describe("neonTextShadow", () => {
	const color = "#39ff14";

	it("returns a 2-layer text-shadow string for intensity 'low'", () => {
		const result = neonTextShadow(color, "low");
		const layers = result.split(",").map((s) => s.trim());
		expect(layers).toHaveLength(2);
	});

	it("returns a 3-layer text-shadow string for intensity 'medium' (default)", () => {
		const result = neonTextShadow(color);
		const layers = result.split(",").map((s) => s.trim());
		expect(layers).toHaveLength(3);
	});

	it("returns a 4-layer text-shadow string for intensity 'high'", () => {
		const result = neonTextShadow(color, "high");
		const layers = result.split(",").map((s) => s.trim());
		expect(layers).toHaveLength(4);
	});

	it("uses smaller blur radii than neonBoxShadow for the same intensity", () => {
		for (const intensity of ["low", "medium", "high"] as const) {
			const boxShadow = neonBoxShadow(color, intensity);
			const textShadow = neonTextShadow(color, intensity);
			// Extract max blur value from each (last layer has largest blur)
			const getMaxBlur = (shadow: string) => {
				const blurs = shadow
					.split(",")
					.map((layer) => {
						const match = layer.trim().match(/0 0 (\d+)px/);
						return match ? Number.parseInt(match[1]) : 0;
					});
				return Math.max(...blurs);
			};
			expect(getMaxBlur(textShadow)).toBeLessThan(getMaxBlur(boxShadow));
		}
	});
});

describe("neonPulseStyle", () => {
	it("returns a React.CSSProperties-compatible object", () => {
		const result = neonPulseStyle("#00ffff");
		expect(typeof result).toBe("object");
		expect(result).not.toBeNull();
	});

	it("includes an 'animation' key containing 'neonPulse'", () => {
		const result = neonPulseStyle("#00ffff");
		expect(result).toHaveProperty("animation");
		expect(result.animation).toContain("neonPulse");
	});

	it("includes a 'boxShadow' key containing the provided color", () => {
		const result = neonPulseStyle("#ff00ff");
		expect(result).toHaveProperty("boxShadow");
		expect(result.boxShadow).toContain("#ff00ff");
	});
});
