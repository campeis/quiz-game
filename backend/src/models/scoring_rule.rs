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
}

impl ScoringRule {
    pub fn calculate_points(&self, correct: bool, time_taken_ms: u64, time_limit_sec: u64) -> u32 {
        if !correct {
            return 0;
        }
        match self {
            ScoringRule::SteppedDecay => {
                let num_steps = (time_limit_sec / 5).max(1);
                let step_size = MAX_SCORE / num_steps as u32;
                let steps_elapsed = time_taken_ms / 5000;
                let raw = MAX_SCORE.saturating_sub(steps_elapsed as u32 * step_size);
                raw.max(1)
            }
            ScoringRule::LinearDecay => {
                let step_size = (MAX_SCORE / time_limit_sec as u32).max(1);
                let secs_elapsed = time_taken_ms / 1000;
                let raw = MAX_SCORE.saturating_sub(secs_elapsed as u32 * step_size);
                raw.max(1)
            }
            ScoringRule::FixedScore => MAX_SCORE,
            ScoringRule::StreakBonus => MAX_SCORE,
        }
    }

    /// Applies the streak multiplier for StreakBonus rule.
    /// For all other rules, returns `base` unchanged.
    /// Multiplier: ×(1.0 + streak × 0.5) — so streak=0→×1.0, streak=1→×1.5, streak=2→×2.0.
    pub fn apply_streak_multiplier(&self, base: u32, streak: u32) -> u32 {
        match self {
            ScoringRule::StreakBonus => (base as f64 * (1.0 + streak as f64 * 0.5)) as u32,
            _ => base,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            ScoringRule::SteppedDecay => "Stepped Decay",
            ScoringRule::LinearDecay => "Linear Decay",
            ScoringRule::FixedScore => "Fixed Score",
            ScoringRule::StreakBonus => "Streak Bonus",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    // ── T006: apply_streak_multiplier ─────────────────────────────────────────

    #[rstest]
    #[case(0, 1000)]
    #[case(1, 1500)]
    #[case(2, 2000)]
    #[case(3, 2500)]
    fn streak_bonus_multiplier(#[case] streak: u32, #[case] expected: u32) {
        assert_eq!(
            ScoringRule::StreakBonus.apply_streak_multiplier(1000, streak),
            expected
        );
    }

    #[rstest]
    #[case(ScoringRule::FixedScore, 1000, 5, 1000)]
    #[case(ScoringRule::SteppedDecay, 850, 3, 850)]
    #[case(ScoringRule::LinearDecay, 750, 2, 750)]
    fn non_streak_rules_unaffected_by_multiplier(
        #[case] rule: ScoringRule,
        #[case] base: u32,
        #[case] streak: u32,
        #[case] expected: u32,
    ) {
        assert_eq!(rule.apply_streak_multiplier(base, streak), expected);
    }

    #[rstest]
    #[case(true, 1000)]
    #[case(false, 0)]
    fn streak_bonus_calculate_points(#[case] correct: bool, #[case] expected: u32) {
        assert_eq!(
            ScoringRule::StreakBonus.calculate_points(correct, 0, 20),
            expected
        );
    }
}
