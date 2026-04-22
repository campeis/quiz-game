import type { StorybookConfig } from "storybook-react-rsbuild";

const config: StorybookConfig = {
	rsbuildFinal: (config) => ({
		...config,
		output: {
			...config.output,
			// Rsbuild 2.x generates relative font URLs in CSS that resolve
			// incorrectly when the CSS is in /static/css/ and fonts are in
			// /static/font/. Forcing an absolute asset prefix fixes the paths.
			assetPrefix: "/",
		},
	}),
	stories: ["../src/**/*.stories.@(ts|tsx)"],
	framework: {
		name: "storybook-react-rsbuild",
		options: {
			// Use react-docgen-typescript for full prop inference on components
			// that extend HTML attribute types (e.g. ButtonHTMLAttributes).
			reactDocgen: "react-docgen-typescript",
		},
	},
	docs: {
		autodocs: "tag",
	},
	core: {
		disableTelemetry: true,
	},
};

export default config;
