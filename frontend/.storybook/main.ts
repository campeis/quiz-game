import type { StorybookConfig } from "storybook-react-rsbuild";

const config: StorybookConfig = {
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
