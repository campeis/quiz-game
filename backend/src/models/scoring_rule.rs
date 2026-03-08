use serde::{Deserialize, Serialize};

pub const MAX_SCORE: u32 = 1000;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ScoringRule {
    #[default]
    SteppedDecay,
    LinearDecay,
    FixedScore,
    StreakBonus,
    PositionRace,
}

/// All inputs a scoring rule needs to compute an outcome.
pub struct ScoringContext {
    pub correct: bool,
    pub time_taken_ms: u64,
    pub time_limit_sec: u64,
    /// Consecutive correct answers before this one (used by StreakBonus).
    pub streak: u32,
    /// Number of players who answered correctly before this answer (used by PositionRace).
    pub correct_answer_count: u32,
}

/// The result returned by every scoring rule.
pub struct ScoringOutcome {
    pub points: u32,
    /// 1-based arrival rank among correct responders. `Some` only for PositionRace + correct.
    pub position: Option<u32>,
    /// Multiplier shown to the player. Always 1.0 except for StreakBonus.
    pub streak_multiplier: f64,
}

impl ScoringRule {
    /// Compute the scoring outcome for an answer.
    /// Each rule delegates to its own private function with the same signature.
    pub fn score(&self, ctx: &ScoringContext) -> ScoringOutcome {
        match self {
            ScoringRule::SteppedDecay => score_stepped_decay(ctx),
            ScoringRule::LinearDecay => score_linear_decay(ctx),
            ScoringRule::FixedScore => score_fixed(ctx),
            ScoringRule::StreakBonus => score_streak_bonus(ctx),
            ScoringRule::PositionRace => score_position_race(ctx),
        }
    }

    /// Points awarded for a given arrival position under the PositionRace rule.
    /// 1st → MAX_SCORE, 2nd → ¾, 3rd → ½, 4th+ → ¼ (integer division, rounds down).
    pub fn position_points(pos: u32) -> u32 {
        match pos {
            1 => MAX_SCORE,
            2 => MAX_SCORE * 3 / 4,
            3 => MAX_SCORE / 2,
            _ => MAX_SCORE / 4,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            ScoringRule::SteppedDecay => "Stepped Decay",
            ScoringRule::LinearDecay => "Linear Decay",
            ScoringRule::FixedScore => "Fixed Score",
            ScoringRule::StreakBonus => "Streak Bonus",
            ScoringRule::PositionRace => "Position Race",
        }
    }
}

fn score_stepped_decay(ctx: &ScoringContext) -> ScoringOutcome {
    let points = if ctx.correct {
        let num_steps = (ctx.time_limit_sec / 5).max(1);
        let step_size = MAX_SCORE / num_steps as u32;
        let steps_elapsed = ctx.time_taken_ms / 5000;
        MAX_SCORE
            .saturating_sub(steps_elapsed as u32 * step_size)
            .max(1)
    } else {
        0
    };
    ScoringOutcome {
        points,
        position: None,
        streak_multiplier: 1.0,
    }
}

fn score_linear_decay(ctx: &ScoringContext) -> ScoringOutcome {
    let points = if ctx.correct {
        let step_size = (MAX_SCORE / ctx.time_limit_sec as u32).max(1);
        let secs_elapsed = ctx.time_taken_ms / 1000;
        MAX_SCORE
            .saturating_sub(secs_elapsed as u32 * step_size)
            .max(1)
    } else {
        0
    };
    ScoringOutcome {
        points,
        position: None,
        streak_multiplier: 1.0,
    }
}

fn score_fixed(ctx: &ScoringContext) -> ScoringOutcome {
    let points = if ctx.correct { MAX_SCORE } else { 0 };
    ScoringOutcome {
        points,
        position: None,
        streak_multiplier: 1.0,
    }
}

fn score_streak_bonus(ctx: &ScoringContext) -> ScoringOutcome {
    let streak_multiplier = 1.0 + ctx.streak as f64 * 0.5;
    let points = if ctx.correct {
        (MAX_SCORE as f64 * streak_multiplier) as u32
    } else {
        0
    };
    ScoringOutcome {
        points,
        position: None,
        streak_multiplier,
    }
}

fn score_position_race(ctx: &ScoringContext) -> ScoringOutcome {
    if !ctx.correct {
        return ScoringOutcome {
            points: 0,
            position: None,
            streak_multiplier: 1.0,
        };
    }
    let pos = ctx.correct_answer_count + 1;
    ScoringOutcome {
        points: ScoringRule::position_points(pos),
        position: Some(pos),
        streak_multiplier: 1.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    fn ctx(correct: bool) -> ScoringContext {
        ScoringContext {
            correct,
            time_taken_ms: 0,
            time_limit_sec: 20,
            streak: 0,
            correct_answer_count: 0,
        }
    }

    // ── StreakBonus ───────────────────────────────────────────────────────────

    #[rstest]
    #[case(0, 1000, 1.0)]
    #[case(1, 1500, 1.5)]
    #[case(2, 2000, 2.0)]
    #[case(3, 2500, 2.5)]
    fn streak_bonus_multiplier(
        #[case] streak: u32,
        #[case] expected_pts: u32,
        #[case] expected_mult: f64,
    ) {
        let ctx = ScoringContext {
            streak,
            ..ctx(true)
        };
        let out = ScoringRule::StreakBonus.score(&ctx);
        assert_eq!(out.points, expected_pts);
        assert!((out.streak_multiplier - expected_mult).abs() < f64::EPSILON);
    }

    #[rstest]
    #[case(true, 1000)]
    #[case(false, 0)]
    fn streak_bonus_correct_vs_wrong(#[case] correct: bool, #[case] expected: u32) {
        assert_eq!(
            ScoringRule::StreakBonus.score(&ctx(correct)).points,
            expected
        );
    }

    #[rstest]
    #[case(ScoringRule::FixedScore)]
    #[case(ScoringRule::SteppedDecay)]
    #[case(ScoringRule::LinearDecay)]
    fn non_streak_rules_always_report_multiplier_1_0(#[case] rule: ScoringRule) {
        let ctx = ScoringContext {
            streak: 5,
            ..ctx(true)
        };
        assert!((rule.score(&ctx).streak_multiplier - 1.0).abs() < f64::EPSILON);
    }

    // ── PositionRace ──────────────────────────────────────────────────────────

    #[rstest]
    #[case(1, 1000)]
    #[case(2, 750)]
    #[case(3, 500)]
    #[case(4, 250)]
    #[case(10, 250)]
    fn position_race_point_schedule(#[case] pos: u32, #[case] expected: u32) {
        assert_eq!(ScoringRule::position_points(pos), expected);
    }

    #[rstest]
    #[case(0, 1000)] // first correct → pos 1
    #[case(1, 750)] // second correct → pos 2
    #[case(2, 500)] // third correct → pos 3
    #[case(3, 250)] // fourth+ correct → pos 4
    fn position_race_score_by_count(#[case] prior_count: u32, #[case] expected_pts: u32) {
        let ctx = ScoringContext {
            correct_answer_count: prior_count,
            ..ctx(true)
        };
        let out = ScoringRule::PositionRace.score(&ctx);
        assert_eq!(out.points, expected_pts);
        assert_eq!(out.position, Some(prior_count + 1));
    }

    #[test]
    fn position_race_wrong_answer_yields_zero_and_no_position() {
        let out = ScoringRule::PositionRace.score(&ctx(false));
        assert_eq!(out.points, 0);
        assert_eq!(out.position, None);
    }
}
