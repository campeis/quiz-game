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

    // ── T006: apply_streak_multiplier ─────────────────────────────────────────

    #[test]
    fn streak_bonus_multiplier_streak_0_returns_base() {
        assert_eq!(
            ScoringRule::StreakBonus.apply_streak_multiplier(1000, 0),
            1000
        );
    }

    #[test]
    fn streak_bonus_multiplier_streak_1_returns_1_5x() {
        assert_eq!(
            ScoringRule::StreakBonus.apply_streak_multiplier(1000, 1),
            1500
        );
    }

    #[test]
    fn streak_bonus_multiplier_streak_2_returns_2_0x() {
        assert_eq!(
            ScoringRule::StreakBonus.apply_streak_multiplier(1000, 2),
            2000
        );
    }

    #[test]
    fn streak_bonus_multiplier_streak_3_returns_2_5x() {
        assert_eq!(
            ScoringRule::StreakBonus.apply_streak_multiplier(1000, 3),
            2500
        );
    }

    #[test]
    fn non_streak_rules_are_unaffected_by_apply_streak_multiplier() {
        assert_eq!(
            ScoringRule::FixedScore.apply_streak_multiplier(1000, 5),
            1000
        );
        assert_eq!(
            ScoringRule::SteppedDecay.apply_streak_multiplier(850, 3),
            850
        );
        assert_eq!(
            ScoringRule::LinearDecay.apply_streak_multiplier(750, 2),
            750
        );
    }

    #[test]
    fn streak_bonus_base_score_is_1000_for_correct_answer() {
        let points = ScoringRule::StreakBonus.calculate_points(true, 0, 20);
        assert_eq!(points, 1000);
    }

    #[test]
    fn streak_bonus_awards_zero_for_incorrect_answer() {
        let points = ScoringRule::StreakBonus.calculate_points(false, 0, 20);
        assert_eq!(points, 0);
    }
}
