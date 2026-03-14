import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Minimal Rsbuild config used exclusively by Storybook.
// The main app uses rspack.config.ts — this file is intentionally separate
// to keep Storybook's build pipeline independent.
export default defineConfig({
	plugins: [pluginReact()],
});
