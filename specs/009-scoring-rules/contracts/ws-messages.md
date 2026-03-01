# WebSocket Message Contracts: Configurable Scoring Rules

**Branch**: `009-scoring-rules` | **Date**: 2026-03-01

This document describes the WebSocket message protocol changes introduced by the scoring rules feature. All existing messages are unchanged unless noted.

---

## Shared Type

```typescript
type ScoringRuleName = "stepped_decay" | "linear_decay" | "fixed_score";
```

Canonical display names (used in UI labels):

| Value | Display Name |
|---|---|
| `"stepped_decay"` | `"Stepped Decay"` |
| `"linear_decay"` | `"Linear Decay"` |
| `"fixed_score"` | `"Fixed Score"` |

---

## New: `set_scoring_rule` (Client → Server)

**Sender**: Host only
**When**: While session status is `Lobby` (before game start)
**Effect**: Updates `GameSession.scoring_rule`; server broadcasts confirmation

```typescript
// Message type constant: MSG.SET_SCORING_RULE = "set_scoring_rule"
interface SetScoringRulePayload {
  rule: ScoringRuleName;
}
```

**Rejection conditions** (server responds with no-op or error):
- Sender is not the host
- Session status is not `Lobby`
- `rule` value is not one of the three valid variants

---

## New: `scoring_rule_set` (Server → Client)

**Recipients**: All connected clients (host + players)
**When**: After host successfully changes the rule
**Effect**: Updates `scoringRule` in frontend state (in lobby view for host; ignored by players until question starts)

```typescript
// Message type constant: MSG.SCORING_RULE_SET = "scoring_rule_set"
interface ScoringRuleSetPayload {
  rule: ScoringRuleName;
}
```

---

## Modified: `question` (Server → Client)

**Change**: New `scoring_rule` field added to `QuestionPayload`.

```typescript
// Existing interface extended:
interface QuestionPayload {
  index: number;
  question: string;
  options: string[];
  time_limit_sec: number;
  scoring_rule: ScoringRuleName;   // ← NEW
}
```

**Why on this message**: Players need to see the active rule when a question is displayed (FR-008). Piggybacking on the existing question broadcast avoids an additional message type.

---

## Unchanged Messages

| Message | Direction | Notes |
|---|---|---|
| `submit_answer` | Client → Server | No change |
| `answer_result` | Server → Client | `points_awarded` already carries the computed value |
| `answer_count` | Server → Client | No change |
| `question_ended` | Server → Client | No change |
| `join` | Client → Server | No change |
| `host_join` | Client → Server | No change |

---

## Message Flow: Host Sets Scoring Rule

```
Host (Lobby)           Server                  Players (Lobby)
     │                    │                         │
     │─set_scoring_rule──►│                         │
     │  {rule:"linear"}   │ validate (host? lobby?) │
     │                    │ update session.rule      │
     │◄──scoring_rule_set─│────scoring_rule_set─────►│
     │  {rule:"linear"}   │   {rule:"linear"}        │
```

## Message Flow: Question Start (rule included)

```
Host                   Server                  Players
     │                    │                         │
     │─start_quiz────────►│                         │
     │                    │─question───────────────►│
     │                    │ {index, question,        │
     │                    │  options, time_limit_sec,│
     │                    │  scoring_rule:"linear"}  │
```

## Scoring Calculation Reference (Server-Side)

```
MAX_SCORE = 1000

SteppedDecay:
  num_steps    = time_limit_sec / 5           (integer division; min 1)
  step_size    = MAX_SCORE / num_steps         (integer division)
  steps_elapsed = time_taken_ms / 5000        (integer division)
  raw          = MAX_SCORE - steps_elapsed * step_size
  points       = if correct { max(1, raw) } else { 0 }

LinearDecay:
  step_size    = MAX_SCORE / time_limit_sec   (integer division; min 1)
  secs_elapsed = time_taken_ms / 1000         (integer division)
  raw          = MAX_SCORE - secs_elapsed * step_size
  points       = if correct { max(1, raw) } else { 0 }

FixedScore:
  points       = if correct { MAX_SCORE } else { 0 }
```
