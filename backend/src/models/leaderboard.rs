use serde::{Deserialize, Serialize};

use super::player::Player;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaderboardEntry {
    pub rank: u32,
    pub display_name: String,
    pub avatar: String,
    pub score: u32,
    pub correct_count: u32,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub is_winner: bool,
}

/// Compute leaderboard from a collection of players.
/// Sorted by score descending, then display_name ascending for ties.
/// Ties share the same rank.
pub fn compute_leaderboard(players: &[&Player], mark_winner: bool) -> Vec<LeaderboardEntry> {
    let mut entries: Vec<_> = players
        .iter()
        .map(|p| (p.display_name.clone(), p.score, p.correct_count, p.avatar.clone()))
        .collect();

    // Sort by score desc, then name asc
    entries.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    let mut result: Vec<LeaderboardEntry> = Vec::with_capacity(entries.len());
    let mut current_rank = 1u32;

    for (i, (name, score, correct, avatar)) in entries.iter().enumerate() {
        let rank = if i > 0 && *score == entries[i - 1].1 {
            result[i - 1].rank
        } else {
            current_rank
        };
        current_rank = (i as u32) + 2;

        result.push(LeaderboardEntry {
            rank,
            display_name: name.clone(),
            avatar: avatar.clone(),
            score: *score,
            correct_count: *correct,
            is_winner: mark_winner && rank == 1,
        });
    }

    result
}
