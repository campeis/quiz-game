use quiz_server::models::leaderboard::compute_leaderboard;
use quiz_server::models::player::Player;

#[test]
fn leaderboard_sorts_by_score_descending() {
    let p1 = make_player("Alice", 300, 3, "🦁");
    let p2 = make_player("Bob", 500, 4, "🤖");
    let p3 = make_player("Charlie", 100, 1, "🐸");

    let board = compute_leaderboard(&[&p1, &p2, &p3], false);

    assert_eq!(board.len(), 3);
    assert_eq!(board[0].display_name, "Bob");
    assert_eq!(board[0].avatar, "🤖");
    assert_eq!(board[0].rank, 1);
    assert_eq!(board[0].score, 500);
    assert_eq!(board[1].display_name, "Alice");
    assert_eq!(board[1].avatar, "🦁");
    assert_eq!(board[1].rank, 2);
    assert_eq!(board[2].display_name, "Charlie");
    assert_eq!(board[2].avatar, "🐸");
    assert_eq!(board[2].rank, 3);
}

#[test]
fn leaderboard_ties_share_rank() {
    let p1 = make_player("Alice", 500, 3, "🙂");
    let p2 = make_player("Bob", 500, 4, "🙂");
    let p3 = make_player("Charlie", 100, 1, "🙂");

    let board = compute_leaderboard(&[&p1, &p2, &p3], false);

    // Alice and Bob tie at 500, alphabetical: Alice first
    assert_eq!(board[0].display_name, "Alice");
    assert_eq!(board[0].rank, 1);
    assert_eq!(board[1].display_name, "Bob");
    assert_eq!(board[1].rank, 1); // shared rank
    assert_eq!(board[2].display_name, "Charlie");
    assert_eq!(board[2].rank, 3); // rank 3 (not 2)
}

#[test]
fn leaderboard_alphabetical_tiebreak() {
    let p1 = make_player("Zara", 500, 3, "🙂");
    let p2 = make_player("Alice", 500, 3, "🙂");

    let board = compute_leaderboard(&[&p1, &p2], false);

    assert_eq!(board[0].display_name, "Alice");
    assert_eq!(board[1].display_name, "Zara");
}

#[test]
fn leaderboard_mark_winner() {
    let p1 = make_player("Alice", 300, 3, "🙂");
    let p2 = make_player("Bob", 500, 4, "🙂");

    let board = compute_leaderboard(&[&p1, &p2], true);

    assert!(board[0].is_winner);
    assert_eq!(board[0].display_name, "Bob");
    assert!(!board[1].is_winner);
}

#[test]
fn leaderboard_mark_winner_false_when_not_requested() {
    let p1 = make_player("Bob", 500, 4, "🙂");

    let board = compute_leaderboard(&[&p1], false);

    assert!(!board[0].is_winner);
}

#[test]
fn leaderboard_multiple_winners_when_tied() {
    let p1 = make_player("Alice", 500, 3, "🙂");
    let p2 = make_player("Bob", 500, 3, "🙂");

    let board = compute_leaderboard(&[&p1, &p2], true);

    // Both tied at rank 1, both are winners
    assert!(board[0].is_winner);
    assert!(board[1].is_winner);
}

#[test]
fn leaderboard_empty_players() {
    let board = compute_leaderboard(&[], true);
    assert!(board.is_empty());
}

#[test]
fn leaderboard_single_player() {
    let p1 = make_player("Solo", 1000, 5, "🙂");
    let board = compute_leaderboard(&[&p1], true);

    assert_eq!(board.len(), 1);
    assert_eq!(board[0].rank, 1);
    assert!(board[0].is_winner);
    assert_eq!(board[0].correct_count, 5);
}

fn make_player(name: &str, score: u32, correct_count: u32, avatar: &str) -> Player {
    let mut p = Player::new(format!("id-{name}"), name.to_string(), avatar.to_string());
    p.score = score;
    p.correct_count = correct_count;
    p
}
