use quiz_server::services::scoring::calculate_points;

// Time limit: 20 seconds (20000ms)
// First third: 0-6666ms → 1000 points
// Second third: 6667-13333ms → 500 points
// Last third: 13334-20000ms → 250 points

#[test]
fn correct_answer_first_third_gets_1000() {
    assert_eq!(calculate_points(true, 0, 20), 1000);
    assert_eq!(calculate_points(true, 1000, 20), 1000);
    assert_eq!(calculate_points(true, 6666, 20), 1000);
}

#[test]
fn correct_answer_second_third_gets_500() {
    assert_eq!(calculate_points(true, 6667, 20), 500);
    assert_eq!(calculate_points(true, 10000, 20), 500);
    assert_eq!(calculate_points(true, 13332, 20), 500);
}

#[test]
fn correct_answer_last_third_gets_250() {
    assert_eq!(calculate_points(true, 13334, 20), 250);
    assert_eq!(calculate_points(true, 18000, 20), 250);
    assert_eq!(calculate_points(true, 20000, 20), 250);
}

#[test]
fn correct_answer_after_time_limit_gets_0() {
    assert_eq!(calculate_points(true, 20001, 20), 0);
    assert_eq!(calculate_points(true, 30000, 20), 0);
}

#[test]
fn incorrect_answer_always_gets_0() {
    assert_eq!(calculate_points(false, 0, 20), 0);
    assert_eq!(calculate_points(false, 5000, 20), 0);
    assert_eq!(calculate_points(false, 15000, 20), 0);
}

#[test]
fn boundary_at_exact_third_boundaries() {
    // 30 second limit: thirds at 10000, 20000, 30000
    assert_eq!(calculate_points(true, 10000, 30), 1000); // exactly at first third boundary
    assert_eq!(calculate_points(true, 10001, 30), 500);   // just past first third
    assert_eq!(calculate_points(true, 20000, 30), 500);   // exactly at second third boundary
    assert_eq!(calculate_points(true, 20001, 30), 250);   // just past second third
    assert_eq!(calculate_points(true, 30000, 30), 250);   // exactly at time limit
    assert_eq!(calculate_points(true, 30001, 30), 0);     // just past time limit
}

#[test]
fn zero_time_taken_gets_max_points() {
    assert_eq!(calculate_points(true, 0, 20), 1000);
}
