/**
 * Minimal static server for Storybook visual regression tests.
 *
 * Storybook's static build sets the preview iframe src to /iframe (no extension).
 * Standard static servers either redirect this or return 404. This server maps
 * /iframe → iframe.html so the preview loads correctly alongside the manager.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const port = Number(process.env.PORT ?? 6007);
const root = path.resolve(process.argv[2] ?? ".");

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "application/javascript",
	".mjs": "application/javascript",
	".css": "text/css",
	".json": "application/json",
	".woff2": "font/woff2",
	".woff": "font/woff",
	".svg": "image/svg+xml",
	".png": "image/png",
	".ico": "image/x-icon",
};

function serve(req, res) {
	const urlPath = req.url.split("?")[0];

	// Map /iframe (no extension) to iframe.html — Storybook's static build uses
	// this path for the preview iframe src.
	const resolved =
		urlPath === "/iframe"
			? path.join(root, "iframe.html")
			: path.join(root, urlPath === "/" ? "index.html" : urlPath);

	// Prevent directory traversal
	if (!resolved.startsWith(root)) {
		res.writeHead(403);
		res.end();
		return;
	}

	let filePath = resolved;
	if (!fs.existsSync(filePath)) {
		// SPA fallback: serve index.html for unknown routes
		filePath = path.join(root, "index.html");
	}

	const ext = path.extname(filePath);
	res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
	res.end(fs.readFileSync(filePath));
}

http.createServer(serve).listen(port, () => {
	console.log(`Storybook served at http://localhost:${port}`);
});
