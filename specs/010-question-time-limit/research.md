# Research: Question Time Limit

**Branch**: `010-question-time-limit` | **Phase**: 0

## Findings

### Decision 1: Where to store `time_limit_sec`

**Decision**: Add `time_limit_sec: u64` field to `GameSession` (mirrors the existing `scoring_rule` field pattern).

**Rationale**: Session-level configuration (both scoring rule and time limit) belongs on the session, not on a global config struct. The existing `AppConfig.question_time_sec` was a placeholder that pre-dated per-session configuration. Storing it on `GameSession` allows each session to have an independent time limit and follows the exact pattern already proven with `scoring_rule`.

**Alternatives considered**:
- Keep on `AppConfig` and make it mutable per-session via a `HashMap` — rejected: unnecessary indirection when `GameSession` already exists for this purpose.
- Per-question override (use `Question.time_limit_sec` at runtime) — out of scope per spec; uniform per-session limit required.

---

### Decision 2: Parameter threading in `game_engine`

**Decision**: Remove the `question_time_sec: u64` parameter from `start_game`, `do_advance_question`, `do_end_question`, and `handle_answer`. All functions already hold an `Arc<RwLock<GameSession>>` and can read `session.time_limit_sec` directly.

**Rationale**: The parameter was introduced before session-level config existed. Now that `time_limit_sec` lives on the session, passing it as a parameter is redundant and creates a divergence risk (caller might pass a stale value). Reading from the session at point-of-use is the established pattern in the codebase.

**Alternatives considered**:
- Keep parameter, pass `session.time_limit_sec` at call sites — rejected: misleading redundancy, two sources of truth.

---

### Decision 3: New WebSocket messages — naming and payload shape

**Decision**: Follow the exact naming convention of `set_scoring_rule` / `scoring_rule_set`:

| Direction | Message type | Payload |
|-----------|-------------|---------|
| Client → Server | `set_time_limit` | `{ "seconds": <u64> }` |
| Server → Client | `time_limit_set` | `{ "seconds": <u64> }` |
| Client → Server | `end_question`   | `{}` |

**Rationale**: Consistency with the existing WS protocol is the highest priority for maintainability. `set_scoring_rule` / `scoring_rule_set` is already a reliable pattern, and the same verb-noun convention makes the protocol self-documenting.

**Alternatives considered**:
- `configure_timer` / `timer_configured` — rejected: less consistent with established naming.
- Embedding time limit in the `start_game` payload — rejected: requires host to commit before seeing validation; live preview is not possible.

---

### Decision 4: Backend validation of `set_time_limit`

**Decision**: Validate on the backend WS handler: accept only integers in `[10, 60]`. Return a `type: "error"` message to the host with `code: "invalid_time_limit"` if the value is out of range. Silently ignore if session is not in Lobby.

**Rationale**: Frontend validation is UX-only. Backend must enforce correctness since WS messages can be sent by any client. The existing `handle_set_scoring_rule` silently ignores non-Lobby messages — same pattern for time limit. The error response for invalid values matches the existing error payload shape (`code` + `message`).

---

### Decision 5: `question` broadcast payload — which `time_limit_sec` to send

**Decision**: Change `do_advance_question` to send `session.time_limit_sec` (not `q.time_limit_sec`) in the `question` broadcast payload.

**Rationale**: `q.time_limit_sec` was populated from the global config and was coincidentally the same value. Now that the session controls the time limit, the authoritative value is `session.time_limit_sec`. The frontend `Timer` component reads from `currentQuestion.time_limit_sec`, so this single change propagates to all clients with no further frontend adjustments needed for the timer display.

---

### Decision 6: Scoring — which `time_limit_sec` for `calculate_points`

**Decision**: Pass `session.time_limit_sec` (not `question.time_limit_sec`) to `calculate_points` in `handle_answer`.

**Rationale**: Scoring algorithms (SteppedDecay, LinearDecay) decay relative to the time limit the player actually experienced. Since the session's time limit is now canonical, it must be used. Using `question.time_limit_sec` (which equals the historical config default) would diverge once the host changes the time limit.

---

### Decision 7: Host early close — idempotency

**Decision**: The `end_question` WS message causes the server to call `do_end_question(session, tx, current_question_index)`. The existing idempotency guard (`if s.current_question as usize != question_index { return; }`) handles race conditions between early close and timer expiry with no additional logic.

**Rationale**: The guard already covers the case where two close signals arrive in quick succession. The first signal advances `current_question` (via `do_advance_question`); the second sees a mismatched index and returns immediately.

---

### Decision 8: Frontend validation UX — inline error, not toast

**Decision**: Display validation errors inline below the time limit input field (same visual pattern as the fieldset containing scoring rules). Error text uses the `colors.error` token. No toast or modal.

**Rationale**: The scoring rules fieldset pattern uses inline text for descriptions. Inline errors below the input are the standard HTML form pattern, require no new components, and are consistent with WCAG 2.1 AA (error message associated with input via `aria-describedby`).

---

### Decision 9: `AppConfig.question_time_sec` retention

**Decision**: Keep `AppConfig.question_time_sec` as the server-side default seeded into `GameSession.time_limit_sec` at session creation. Remove its direct use in `ws.rs` and `game_engine.rs`.

**Rationale**: The env-var `QUESTION_TIME_SEC=20` becomes the session default. This preserves backwards compatibility for deployments that rely on the env-var to control default behavior while allowing per-session override. The `parse_quiz` call continues to use it as `default_time_limit` for the `Question.time_limit_sec` field (kept for potential future per-question override).
