import type { Preview } from "storybook-react-rsbuild";

// Apply global arcade styles to every story iframe so stories
// render with the same appearance as the main application.
import "../src/styles/arcade.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
