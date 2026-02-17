/// Calculate points for a correct answer using tiered speed scoring.
///
/// - First third of time limit: 1000 points
/// - Second third: 500 points
/// - Last third: 250 points
/// - Incorrect or unanswered: 0 points
pub fn calculate_points(correct: bool, time_taken_ms: u64, time_limit_sec: u64) -> u32 {
    if !correct {
        return 0;
    }

    let time_limit_ms = time_limit_sec * 1000;
    let third = time_limit_ms / 3;

    if time_taken_ms <= third {
        1000
    } else if time_taken_ms <= third * 2 {
        500
    } else if time_taken_ms <= time_limit_ms {
        250
    } else {
        0 // answered after time expired
    }
}
