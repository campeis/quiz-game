import { describe, expect, it } from "vitest";
import { neonBoxShadow, neonTextShadow, neonPulseStyle } from "../../../src/components/ui/neon";

describe("neonBoxShadow", () => {
	it("returns an empty string (glow disabled)", () => {
		for (const intensity of ["low", "medium", "high"] as const) {
			expect(neonBoxShadow("#00ffff", intensity)).toBe("");
		}
	});
});

describe("neonTextShadow", () => {
	it("returns an empty string (glow disabled)", () => {
		for (const intensity of ["low", "medium", "high"] as const) {
			expect(neonTextShadow("#00ffff", intensity)).toBe("");
		}
	});
});

describe("neonPulseStyle", () => {
	it("returns a React.CSSProperties-compatible object", () => {
		const result = neonPulseStyle("#00ffff");
		expect(typeof result).toBe("object");
		expect(result).not.toBeNull();
	});

	it("returns an empty object (animation disabled)", () => {
		const result = neonPulseStyle("#00ffff");
		expect(result).toEqual({});
	});
});
