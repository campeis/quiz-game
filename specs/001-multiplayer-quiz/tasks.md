# Tasks: Multiplayer Online Quiz

**Input**: Design documents from `/specs/001-multiplayer-quiz/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included per constitution principle II (Testing Standards) and TDD workflow. Backend: `cargo test`. Frontend: Vitest. E2E: Playwright.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `e2e/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and basic structure

- [ ] T001 Create project directory structure per plan.md (backend/, frontend/, e2e/, Justfile)
- [ ] T002 Initialize Rust project with Cargo.toml in backend/ (dependencies: axum, tokio, serde, serde_json, dashmap, tower-http, uuid, tracing, tracing-subscriber)
- [ ] T003 [P] Initialize frontend React project with package.json in frontend/ (dependencies: react, react-dom, react-router-dom; devDependencies: @rspack/cli, @rspack/core, @rspack/plugin-react-refresh, typescript, @types/react, @types/react-dom)
- [ ] T004 [P] Initialize Playwright E2E project with package.json in e2e/ and e2e/playwright.config.ts
- [ ] T005 [P] Configure Rspack with TypeScript + React + HMR + dev server proxy to backend in frontend/rspack.config.ts
- [ ] T006 [P] Configure Biome for TypeScript/React linting and formatting in frontend/biome.json
- [ ] T007 [P] Configure TypeScript compiler options in frontend/tsconfig.json
- [ ] T008 [P] Configure Vitest for frontend unit tests in frontend/vitest.config.ts and frontend/package.json scripts
- [ ] T009 Create Justfile at repo root with recipes: setup, dev, build, start, test, test-backend, test-frontend, test-e2e, lint, lint-fix
- [ ] T010 Create sample quiz file at fixtures/sample.txt per research.md format specification

**Checkpoint**: All tooling configured — `just setup` installs dependencies, `just lint` runs checks

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [ ] T011 Create app configuration module in backend/src/config.rs (PORT, MAX_SESSIONS, MAX_PLAYERS, QUESTION_TIME_SEC, RECONNECT_TIMEOUT, STATIC_DIR)
- [ ] T012 [P] Create unified error types in backend/src/errors.rs (AppError enum with IntoResponse impl for JSON error format per rest-api.md)
- [ ] T013 [P] Create Quiz and Question structs in backend/src/models/quiz.rs (per data-model.md: Quiz with title/questions, Question with text/options/correct_index/time_limit_sec, Option with text)
- [ ] T014 [P] Create SessionStatus and ConnectionStatus enums in backend/src/models/session.rs (Lobby/Active/Paused/Finished and Connected/Disconnected/Left)
- [ ] T015 [P] Create Player and Answer structs in backend/src/models/player.rs (per data-model.md fields and validation rules)
- [ ] T016 [P] Create GameSession struct in backend/src/models/session.rs (per data-model.md: join_code, quiz, players, host_id, current_question, status, question_started, created_at)
- [ ] T017 [P] Create LeaderboardEntry struct and leaderboard computation function in backend/src/models/leaderboard.rs (sorted by score desc, ties share rank, alphabetical tiebreak)
- [ ] T018 Create models module barrel file in backend/src/models/mod.rs (re-export all model types)
- [ ] T019 Create SessionManager service in backend/src/services/session_manager.rs (DashMap<String, Arc<RwLock<GameSession>>>, create/get/remove session, join code generation, max sessions enforcement)
- [ ] T020 Create services module barrel file in backend/src/services/mod.rs
- [ ] T021 Create Axum router skeleton in backend/src/main.rs (app state with SessionManager, CORS middleware via tower-http, route placeholders for /api/* and /ws/*, tracing subscriber init, static file serving for production)

### Backend Foundation Tests

- [ ] T022 [P] Write unit tests for LeaderboardEntry computation (ranking, ties, alphabetical tiebreak) in backend/tests/unit/session_test.rs
- [ ] T023 [P] Write unit tests for SessionManager (create session, max sessions enforcement, join code uniqueness) in backend/tests/unit/session_test.rs

### Frontend Foundation

- [ ] T024 Create design tokens in frontend/src/components/ui/tokens.ts (colors, spacing, typography, breakpoints for mobile-first)
- [ ] T025 [P] Create shared Button component in frontend/src/components/ui/Button.tsx (primary/secondary variants, loading state, accessible)
- [ ] T026 [P] Create shared Card component in frontend/src/components/ui/Card.tsx
- [ ] T027 [P] Create shared Timer component in frontend/src/components/ui/Timer.tsx (countdown display with visual urgency states)
- [ ] T028 Create WebSocket message type definitions in frontend/src/services/messages.ts (all types from websocket-messages.md: server→client and client→server envelopes)
- [ ] T029 Create useWebSocket hook in frontend/src/hooks/useWebSocket.ts (connect, send JSON, receive typed messages, reconnection with exponential backoff, connection status)
- [ ] T030 Create useGameState hook in frontend/src/hooks/useGameState.ts (reducer for game state from WS messages: lobby/playing/finished, current question, leaderboard, player list)
- [ ] T031 Create REST API client in frontend/src/services/api.ts (uploadQuiz, createSession, getSession functions per rest-api.md)
- [ ] T032 Create React app entry point and router in frontend/src/main.tsx and frontend/src/App.tsx (routes: / → HomePage, /host → HostPage, /play → PlayerPage)
- [ ] T033 Create HomePage with host/join options in frontend/src/pages/HomePage.tsx (two prominent buttons: "Host a Quiz" and "Join a Game")

**Checkpoint**: Foundation ready — backend compiles and starts, frontend renders homepage, `just dev` runs both

---

## Phase 3: User Story 1 — Host Creates and Runs a Quiz Game (Priority: P1) 🎯 MVP

**Goal**: A host uploads a quiz file, starts a game session with a join code, and runs the quiz to completion with connected players seeing questions in real time.

**Independent Test**: Host uploads a file, gets a join code, starts the quiz. Players connect and see questions appear. Game reaches completion and final leaderboard is shown.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T034 [P] [US1] Write unit tests for quiz file parser (valid file, basic parsing) in backend/tests/unit/quiz_parser_test.rs
- [ ] T035 [P] [US1] Write contract tests for POST /api/quiz (valid upload → 200 with preview) and POST /api/sessions (create → 201 with join code) in backend/tests/contract/api_contract_test.rs
- [ ] T036 [P] [US1] Write integration test for host game flow (upload quiz → create session → WS connect → start game → questions broadcast → game finishes) in backend/tests/integration/game_flow_test.rs

### Implementation for User Story 1

- [ ] T037 [US1] Implement quiz file parser in backend/src/models/quiz.rs (parse lines with # ? - * markers per research.md format, return Quiz struct or basic error)
- [ ] T038 [US1] Implement POST /api/quiz handler in backend/src/handlers/quiz_upload.rs (multipart file upload, parse quiz, store in temporary quiz registry, return preview JSON per rest-api.md)
- [ ] T039 [US1] Implement POST /api/sessions handler in backend/src/handlers/session.rs (accept quiz_id, create GameSession via SessionManager, return join_code and ws_url per rest-api.md)
- [ ] T040 [US1] Implement handlers module barrel file in backend/src/handlers/mod.rs
- [ ] T041 [US1] Implement WebSocket upgrade and message routing in backend/src/handlers/ws.rs (host endpoint /ws/host/:join_code, message envelope parsing, dispatch to game engine)
- [ ] T042 [US1] Implement game engine in backend/src/services/game_engine.rs (start_game → broadcast game_starting + first question, question timer via tokio::time::sleep, auto-advance on timeout or all answered, broadcast question_ended, broadcast game_finished after last question)
- [ ] T043 [US1] Wire all handlers into Axum router in backend/src/main.rs (POST /api/quiz, POST /api/sessions, GET /ws/host/:join_code)
- [ ] T044 [P] [US1] Create QuizUpload component in frontend/src/components/QuizUpload.tsx (file input, upload via api.ts, display preview with title + question count, confirm button)
- [ ] T045 [P] [US1] Create Lobby component (host view) in frontend/src/components/Lobby.tsx (display join code prominently, list connected players, "Start Quiz" button)
- [ ] T046 [P] [US1] Create HostDashboard component in frontend/src/components/HostDashboard.tsx (current question text, answer progress bar showing answered/total, countdown timer, running standings)
- [ ] T047 [US1] Create HostPage in frontend/src/pages/HostPage.tsx (flow: QuizUpload → Lobby → HostDashboard → Leaderboard, driven by useGameState hook via useWebSocket)

**Checkpoint**: Host can upload a quiz, start a game, and run it to completion. Questions broadcast on timer. Basic leaderboard shown at end.

---

## Phase 4: User Story 2 — Player Joins and Plays a Quiz (Priority: P2)

**Goal**: A player enters a join code, chooses a display name, joins the lobby, answers questions with immediate feedback, and sees the final leaderboard.

**Independent Test**: Player joins with a code, enters a name, sees the lobby, answers questions when they appear, sees correct/incorrect feedback, and views final results.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T048 [P] [US2] Write contract tests for GET /api/sessions/:join_code (valid → 200, invalid → 404, started → 409) in backend/tests/contract/api_contract_test.rs
- [ ] T049 [P] [US2] Write integration test for player join and answer flow (WS connect with name → player_joined broadcast → submit_answer → answer_result received) in backend/tests/integration/ws_test.rs

### Implementation for User Story 2

- [ ] T050 [US2] Implement GET /api/sessions/:join_code handler in backend/src/handlers/session.rs (return session info or 404/409 per rest-api.md)
- [ ] T051 [US2] Implement player WebSocket connection in backend/src/handlers/ws.rs (player endpoint /ws/player/:join_code?name=, validate join code + name, add player to session, broadcast player_joined, handle submit_answer messages, send answer_result)
- [ ] T052 [US2] Implement display name uniqueness logic in backend/src/services/session_manager.rs (check existing names in session, append number on conflict, send name_assigned message)
- [ ] T053 [US2] Wire player routes into Axum router in backend/src/main.rs (GET /api/sessions/:join_code, GET /ws/player/:join_code)
- [ ] T054 [P] [US2] Create JoinForm component in frontend/src/components/JoinForm.tsx (join code input, validate via GET /api/sessions/:code, display name input, submit)
- [ ] T055 [P] [US2] Create Question component in frontend/src/components/Question.tsx (question text, answer buttons grid, countdown timer, disabled state after answer, correct/incorrect feedback overlay)
- [ ] T056 [P] [US2] Create Lobby component (player view) in frontend/src/components/Lobby.tsx (show quiz title, list of players in lobby, "Waiting for host to start..." message)
- [ ] T057 [US2] Create PlayerPage in frontend/src/pages/PlayerPage.tsx (flow: JoinForm → Lobby → Question loop → Leaderboard, driven by useGameState hook via useWebSocket)

**Checkpoint**: Players can join, answer questions, see feedback. Host + player flows work together end-to-end.

---

## Phase 5: User Story 3 — Leaderboard and Scoring (Priority: P3)

**Goal**: Players earn tiered speed-based points (1000/500/250). Running leaderboard updates after each question. Final leaderboard highlights the winner.

**Independent Test**: Run a quiz with multiple players answering at different speeds. Verify tiered scoring is correct, running leaderboard updates after each question, and final leaderboard shows accurate rankings with winner highlighted.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T058 [P] [US3] Write unit tests for tiered scoring calculation (first/second/last third, incorrect, unanswered, boundary times) in backend/tests/unit/scoring_test.rs
- [ ] T059 [P] [US3] Write unit tests for frontend scoring display (point values, tier labels) in frontend/tests/unit/scoring.test.ts

### Implementation for User Story 3

- [ ] T060 [US3] Implement scoring service in backend/src/services/scoring.rs (calculate_points function: time_taken_ms vs time_limit, return 1000/500/250/0 per tiered model from data-model.md)
- [ ] T061 [US3] Integrate scoring into game engine in backend/src/services/game_engine.rs (on submit_answer: compute points via scoring service, update player score + correct_count, include answer_result with points_awarded)
- [ ] T062 [US3] Integrate running leaderboard into question_ended broadcast in backend/src/services/game_engine.rs (compute leaderboard after each question, include in question_ended payload per websocket-messages.md)
- [ ] T063 [US3] Integrate final leaderboard into game_finished broadcast in backend/src/services/game_engine.rs (compute final leaderboard with is_winner flag, include in game_finished payload)
- [ ] T064 [US3] Create Leaderboard component in frontend/src/components/Leaderboard.tsx (running mode: compact ranked list after each question; final mode: full display with rank, name, score, correct count, winner highlight with visual emphasis)
- [ ] T065 [US3] Integrate Leaderboard into HostDashboard (running standings panel) and into HostPage/PlayerPage (final results screen) in frontend/src/components/HostDashboard.tsx, frontend/src/pages/HostPage.tsx, frontend/src/pages/PlayerPage.tsx

**Checkpoint**: Full scoring and leaderboard system works. Games have competitive element with speed-based points and real-time rankings.

---

## Phase 6: User Story 4 — Quiz File Loading and Validation (Priority: P4)

**Goal**: Detailed quiz file validation with specific line-number error messages. Support for edge cases: malformed files, empty files, oversized quizzes.

**Independent Test**: Upload various invalid quiz files and verify each produces specific, actionable error messages with line numbers. Upload a file with >100 questions and verify the warning.

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T066 [P] [US4] Write unit tests for detailed quiz validation (missing correct answer, too many options, empty question, duplicate options, >100 questions warning, empty file, comment lines) in backend/tests/unit/quiz_parser_test.rs
- [ ] T067 [P] [US4] Write component test for QuizUpload error display (multiple errors with line numbers rendered) in frontend/tests/unit/components/JoinForm.test.tsx

### Implementation for User Story 4

- [ ] T068 [US4] Enhance quiz parser with line-by-line validation in backend/src/models/quiz.rs (track line numbers during parsing, collect all errors with line references, validate: exactly one * per question, 2-4 options, non-empty text, unique options within question, return Vec<ParseError> with line + message)
- [ ] T069 [US4] Add >100 questions warning to quiz upload handler in backend/src/handlers/quiz_upload.rs (include warning in response JSON when question_count > 100)
- [ ] T070 [US4] Enhance QuizUpload component error display in frontend/src/components/QuizUpload.tsx (render list of validation errors with line numbers, styled as actionable error cards, re-upload button)

**Checkpoint**: Quiz file validation is comprehensive with helpful error messages. All edge cases handled.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T071 Implement player disconnection handling in backend/src/handlers/ws.rs (detect WS close, mark player as Disconnected, set disconnected_at timestamp, broadcast player_left, start 2-min reconnection timer via tokio::spawn)
- [ ] T072 Implement player reconnection in backend/src/handlers/ws.rs (on player WS connect with existing name, check if within 2-min window, restore player state, broadcast player_reconnected)
- [ ] T073 Implement host disconnection and pause/resume in backend/src/services/game_engine.rs (on host WS close: transition to Paused, broadcast game_paused, start 2-min timeout; on reconnect: broadcast game_resumed, resume question timer; on timeout: broadcast game_terminated with final leaderboard)
- [ ] T074 [P] Write Playwright E2E test for host flow (upload → start → run quiz → see final leaderboard) in e2e/tests/host-flow.spec.ts
- [ ] T075 [P] Write Playwright E2E test for player flow (join → answer → see results) in e2e/tests/player-flow.spec.ts
- [ ] T076 Write Playwright E2E test for full multiplayer game (host + 2 players, complete quiz, verify leaderboard accuracy) in e2e/tests/full-game.spec.ts
- [ ] T077 [P] Write frontend component tests for JoinForm, Question, and Leaderboard in frontend/tests/unit/components/JoinForm.test.tsx, frontend/tests/unit/components/Question.test.tsx, frontend/tests/unit/components/Leaderboard.test.tsx
- [ ] T078 Add static file serving for production in backend/src/main.rs (serve frontend/dist/ as fallback for non-API routes)
- [ ] T079 Add WCAG 2.1 AA accessibility to all frontend components (aria labels, keyboard navigation, focus management, color contrast per constitution principle III)
- [ ] T080 Run quickstart.md validation (follow all steps in quickstart.md on a clean checkout and verify they work end-to-end)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (can parallel with US1 but integrates better sequentially)
- **User Story 3 (Phase 5)**: Depends on US1 (game engine exists) and US2 (players submit answers)
- **User Story 4 (Phase 6)**: Depends on US1 (basic parser exists to enhance)
- **Polish (Phase 7)**: Depends on US1 + US2 + US3 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational — Integrates with US1's WebSocket infrastructure and game engine
- **User Story 3 (P3)**: Depends on US1 (game engine) + US2 (answer submission) — adds scoring layer
- **User Story 4 (P4)**: Depends on US1 (basic parser) — enhances validation depth

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before handlers/endpoints
- Backend before frontend (APIs must exist for frontend to consume)
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks T003–T008 marked [P] can run in parallel
- Foundational backend models T012–T017 marked [P] can run in parallel
- Foundational frontend UI components T025–T027 can run in parallel
- Within each user story: test tasks marked [P] can run in parallel
- Within each user story: frontend components marked [P] can run in parallel
- US1 and US2 can run in parallel after Foundational (different handlers, different frontend pages)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit tests for quiz file parser in backend/tests/unit/quiz_parser_test.rs"
Task: "Write contract tests for POST /api/quiz and POST /api/sessions in backend/tests/contract/api_contract_test.rs"
Task: "Write integration test for host game flow in backend/tests/integration/game_flow_test.rs"

# Launch all frontend components for User Story 1 together:
Task: "Create QuizUpload component in frontend/src/components/QuizUpload.tsx"
Task: "Create Lobby component (host view) in frontend/src/components/Lobby.tsx"
Task: "Create HostDashboard component in frontend/src/components/HostDashboard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Host can upload quiz, start game, run to completion
5. Demo with a single browser acting as host

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Host can run a game → Demo (MVP!)
3. Add User Story 2 → Players can join and answer → Demo (playable game!)
4. Add User Story 3 → Speed scoring + live leaderboard → Demo (competitive game!)
5. Add User Story 4 → Detailed validation errors → Demo (polished upload)
6. Polish → Disconnection handling, E2E tests, accessibility → Release candidate

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (backend) + User Story 2 (backend)
   - Developer B: User Story 1 (frontend) + User Story 2 (frontend)
3. After US1+US2: Developer A does US3, Developer B does US4
4. Both contribute to Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
