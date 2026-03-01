# Data Model: Configurable Scoring Rules

**Branch**: `009-scoring-rules` | **Date**: 2026-03-01 | **Phase**: 1

## New: ScoringRule Enum

**Location**: `backend/src/models/scoring_rule.rs` (new file)

```
ScoringRule
├── SteppedDecay    — equal-parts decay every 5 seconds (default)
├── LinearDecay     — equal-parts decay every 1 second
└── FixedScore      — always MAX_SCORE regardless of time
```

**Attributes**:

| Field / Method | Type | Description |
|---|---|---|
| `(variant)` | enum | One of the three rule variants |
| `calculate_points(correct, time_taken_ms, time_limit_sec)` | `fn → u32` | Core scoring logic; returns 0 for incorrect, ≥1 for correct |
| `display_name()` | `fn → &str` | Human-readable name sent to frontend |
| `Default` | impl | Returns `SteppedDecay` |

**Validation rules**:
- `correct = false` → always returns `0`
- Result for correct answer is always in range `[1, MAX_SCORE]`
- `num_steps == 0` guard: if `time_limit_sec < interval`, treat as `MAX_SCORE` (no decay possible)
- All arithmetic uses integer division and floor (no floating point)

**Constant**: `MAX_SCORE: u32 = 1000` (module-level, matches existing ceiling)

---

## Modified: GameSession

**Location**: `backend/src/models/session.rs` (existing file, new field added)

```
GameSession
├── join_code: String
├── quiz: Quiz
├── players: HashMap<String, Player>
├── host_id: Option<String>
├── current_question: i32
├── status: SessionStatus
├── question_started: Option<Instant>
├── created_at: Instant
└── scoring_rule: ScoringRule          ← NEW (default: SteppedDecay)
```

**State transitions for `scoring_rule`**:

```
[Lobby] host sends set_scoring_rule  →  scoring_rule updated
[Active] game starts                 →  scoring_rule locked (writes rejected)
[Finished]                           →  scoring_rule read-only in leaderboard context
```

**Validation rules**:
- `set_scoring_rule` messages MUST be rejected if `status != Lobby`
- `scoring_rule` is not persisted beyond the session lifetime

---

## Modified: QuestionPayload (WebSocket message)

**Location**: `frontend/src/services/messages.ts` (existing file, new field added)

```
QuestionPayload
├── index: number
├── question: string
├── options: string[]
├── time_limit_sec: number
└── scoring_rule: ScoringRuleName      ← NEW
```

Where `ScoringRuleName = "stepped_decay" | "linear_decay" | "fixed_score"`.

---

## New: SetScoringRulePayload (WebSocket message)

**Location**: `frontend/src/services/messages.ts` (new interface)

```
SetScoringRulePayload
└── rule: ScoringRuleName
```

---

## Entity Relationships

```
GameSession  1──────1  ScoringRule     (session owns one rule for its lifetime)
GameSession  1──────*  Player          (unchanged)
GameSession  1──────1  Quiz            (unchanged)
Quiz         1──────*  Question        (unchanged; Question.time_limit_sec feeds formula)
```

---

## Frontend State Extension

**Location**: `frontend/src/hooks/useGameState.ts` (existing hook, new field)

New state field: `scoringRule: ScoringRuleName | null`

Populated from: `QuestionPayload.scoring_rule` on each `question` message.

Displayed in: `Question.tsx` as a visible label.
