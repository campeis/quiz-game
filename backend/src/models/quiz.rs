use serde::{Deserialize, Serialize};

use crate::errors::ParseError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quiz {
    pub title: String,
    pub questions: Vec<Question>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Question {
    pub text: String,
    pub options: Vec<QuizOption>,
    pub correct_index: usize,
    pub time_limit_sec: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuizOption {
    pub text: String,
}

/// Parse a quiz from the line-based text format.
///
/// Format:
/// - `# Title` — quiz title (first occurrence)
/// - `? Question text` — begins a new question
/// - `- Option text` — incorrect answer
/// - `* Option text` — correct answer (exactly one per question)
/// - `//` — comment (ignored)
/// - Blank lines are ignored
pub fn parse_quiz(content: &str, default_time_limit: u64) -> Result<Quiz, Vec<ParseError>> {
    let mut title = String::new();
    let mut questions: Vec<Question> = Vec::new();
    let mut errors: Vec<ParseError> = Vec::new();

    let mut current_question: Option<String> = None;
    let mut current_options: Vec<(String, bool)> = Vec::new();
    let mut question_start_line: usize = 0;

    let finalize_question =
        |questions: &mut Vec<Question>,
         errors: &mut Vec<ParseError>,
         text: &str,
         options: &[(String, bool)],
         start_line: usize,
         default_time: u64| {
            let correct_count = options.iter().filter(|(_, c)| *c).count();
            if correct_count == 0 {
                errors.push(ParseError {
                    line: start_line,
                    message: "Question has no correct answer (no line starting with *)".into(),
                });
            } else if correct_count > 1 {
                errors.push(ParseError {
                    line: start_line,
                    message: "Question has multiple correct answers (only one * allowed)".into(),
                });
            }
            if options.len() < 2 {
                errors.push(ParseError {
                    line: start_line,
                    message: format!(
                        "Question has {} option(s), minimum is 2",
                        options.len()
                    ),
                });
            }
            if options.len() > 4 {
                errors.push(ParseError {
                    line: start_line,
                    message: format!(
                        "Question has {} options, maximum is 4",
                        options.len()
                    ),
                });
            }

            if correct_count == 1 && options.len() >= 2 && options.len() <= 4 {
                let correct_index = options.iter().position(|(_, c)| *c).unwrap();
                questions.push(Question {
                    text: text.to_string(),
                    options: options
                        .iter()
                        .map(|(t, _)| QuizOption { text: t.clone() })
                        .collect(),
                    correct_index,
                    time_limit_sec: default_time,
                });
            }
        };

    for (line_num, line) in content.lines().enumerate() {
        let line_num = line_num + 1; // 1-based
        let trimmed = line.trim();

        if trimmed.is_empty() || trimmed.starts_with("//") {
            continue;
        }

        if trimmed.starts_with('#') {
            if title.is_empty() {
                title = trimmed.trim_start_matches('#').trim().to_string();
            }
            continue;
        }

        if trimmed.starts_with('?') {
            // Finalize previous question if any
            if let Some(ref q_text) = current_question {
                finalize_question(
                    &mut questions,
                    &mut errors,
                    q_text,
                    &current_options,
                    question_start_line,
                    default_time_limit,
                );
            }
            current_question = Some(trimmed.trim_start_matches('?').trim().to_string());
            current_options = Vec::new();
            question_start_line = line_num;
            continue;
        }

        if trimmed.starts_with('-') || trimmed.starts_with('*') {
            let is_correct = trimmed.starts_with('*');
            let text = trimmed[1..].trim().to_string();
            if text.is_empty() {
                errors.push(ParseError {
                    line: line_num,
                    message: "Option text is empty".into(),
                });
            } else if current_question.is_some() {
                current_options.push((text, is_correct));
            } else {
                errors.push(ParseError {
                    line: line_num,
                    message: "Option found before any question".into(),
                });
            }
            continue;
        }

        errors.push(ParseError {
            line: line_num,
            message: "Unrecognized line format: expected #, ?, -, *, or //".to_string(),
        });
    }

    // Finalize last question
    if let Some(ref q_text) = current_question {
        finalize_question(
            &mut questions,
            &mut errors,
            q_text,
            &current_options,
            question_start_line,
            default_time_limit,
        );
    }

    if title.is_empty() {
        errors.push(ParseError {
            line: 1,
            message: "Quiz has no title (expected a line starting with #)".into(),
        });
    }

    if questions.is_empty() && errors.is_empty() {
        errors.push(ParseError {
            line: 1,
            message: "Quiz has no valid questions".into(),
        });
    }

    if errors.is_empty() {
        Ok(Quiz { title, questions })
    } else {
        Err(errors)
    }
}
