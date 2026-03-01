use quiz_server::models::scoring_rule::{MAX_SCORE, ScoringRule};

// ── Wrong answer ──────────────────────────────────────────────────────────────

#[test]
fn wrong_answer_is_always_zero_stepped() {
    assert_eq!(ScoringRule::SteppedDecay.calculate_points(false, 0, 20), 0);
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(false, 5000, 20),
        0
    );
}

#[test]
fn wrong_answer_is_always_zero_linear() {
    assert_eq!(ScoringRule::LinearDecay.calculate_points(false, 0, 20), 0);
    assert_eq!(
        ScoringRule::LinearDecay.calculate_points(false, 10000, 20),
        0
    );
}

#[test]
fn wrong_answer_is_always_zero_fixed() {
    assert_eq!(ScoringRule::FixedScore.calculate_points(false, 0, 20), 0);
    assert_eq!(
        ScoringRule::FixedScore.calculate_points(false, 99999, 20),
        0
    );
}

// ── SteppedDecay (20s limit, 1000 max → 4 steps of 250) ──────────────────────

#[test]
fn stepped_decay_first_step_gives_max() {
    // 0–4 999ms → step 0 → 1000 pts
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(true, 0, 20),
        MAX_SCORE
    );
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(true, 4999, 20),
        MAX_SCORE
    );
}

#[test]
fn stepped_decay_second_step_deducts_one_step() {
    // 5 000–9 999ms → step 1 → 750 pts
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(true, 5000, 20),
        750
    );
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(true, 9999, 20),
        750
    );
}

#[test]
fn stepped_decay_third_step_deducts_two_steps() {
    // 10 000–14 999ms → step 2 → 500 pts
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(true, 10000, 20),
        500
    );
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(true, 14999, 20),
        500
    );
}

#[test]
fn stepped_decay_fourth_step_deducts_three_steps() {
    // 15 000–19 999ms → step 3 → 250 pts
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(true, 15000, 20),
        250
    );
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(true, 19999, 20),
        250
    );
}

#[test]
fn stepped_decay_minimum_correct_score_is_one() {
    // Beyond all steps → clamped to 1, not 0
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(true, 20000, 20),
        1
    );
    assert_eq!(
        ScoringRule::SteppedDecay.calculate_points(true, 99999, 20),
        1
    );
}

// ── LinearDecay (20s limit, 1000 max → step_size = 50 per second) ─────────────

#[test]
fn linear_decay_at_zero_seconds_gives_max() {
    assert_eq!(
        ScoringRule::LinearDecay.calculate_points(true, 0, 20),
        MAX_SCORE
    );
}

#[test]
fn linear_decay_at_three_seconds_gives_850() {
    // step_size = 1000 / 20 = 50; 3 steps → 1000 - 150 = 850
    assert_eq!(
        ScoringRule::LinearDecay.calculate_points(true, 3000, 20),
        850
    );
}

#[test]
fn linear_decay_at_ten_seconds_gives_500() {
    // 10 steps → 1000 - 500 = 500
    assert_eq!(
        ScoringRule::LinearDecay.calculate_points(true, 10000, 20),
        500
    );
}

#[test]
fn linear_decay_at_nineteen_seconds_gives_50() {
    // 19 steps → 1000 - 950 = 50
    assert_eq!(
        ScoringRule::LinearDecay.calculate_points(true, 19000, 20),
        50
    );
}

#[test]
fn linear_decay_minimum_correct_score_is_one() {
    // At or past time limit → clamped to 1
    assert_eq!(
        ScoringRule::LinearDecay.calculate_points(true, 20000, 20),
        1
    );
    assert_eq!(
        ScoringRule::LinearDecay.calculate_points(true, 99999, 20),
        1
    );
}

// ── FixedScore ────────────────────────────────────────────────────────────────

#[test]
fn fixed_score_always_gives_max_regardless_of_time() {
    assert_eq!(
        ScoringRule::FixedScore.calculate_points(true, 0, 20),
        MAX_SCORE
    );
    assert_eq!(
        ScoringRule::FixedScore.calculate_points(true, 19999, 20),
        MAX_SCORE
    );
    assert_eq!(
        ScoringRule::FixedScore.calculate_points(true, 99999, 20),
        MAX_SCORE
    );
}

// ── Display names ─────────────────────────────────────────────────────────────

#[test]
fn display_names_are_correct() {
    assert_eq!(ScoringRule::SteppedDecay.display_name(), "Stepped Decay");
    assert_eq!(ScoringRule::LinearDecay.display_name(), "Linear Decay");
    assert_eq!(ScoringRule::FixedScore.display_name(), "Fixed Score");
}

// ── Default ───────────────────────────────────────────────────────────────────

#[test]
fn default_rule_is_stepped_decay() {
    assert_eq!(ScoringRule::default(), ScoringRule::SteppedDecay);
}
