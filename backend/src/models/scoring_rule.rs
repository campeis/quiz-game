use serde::{Deserialize, Serialize};

pub const MAX_SCORE: u32 = 1000;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ScoringRule {
    #[default]
    SteppedDecay,
    LinearDecay,
    FixedScore,
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
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            ScoringRule::SteppedDecay => "Stepped Decay",
            ScoringRule::LinearDecay => "Linear Decay",
            ScoringRule::FixedScore => "Fixed Score",
        }
    }
}
