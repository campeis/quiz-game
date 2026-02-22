import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const HostPage = lazy(() => import("./pages/HostPage").then((m) => ({ default: m.HostPage })));
const PlayerPage = lazy(() => import("./pages/PlayerPage").then((m) => ({ default: m.PlayerPage })));

export function App() {
	return (
		<BrowserRouter>
			<Suspense>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/host" element={<HostPage />} />
					<Route path="/play" element={<PlayerPage />} />
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}
