use quiz_server::models::quiz::parse_quiz;

#[test]
fn parse_valid_quiz() {
    let content = "\
# My Quiz
? What is 1+1?
- 1
* 2
- 3

? Capital of France?
- London
* Paris
- Berlin
- Madrid
";

    let quiz = parse_quiz(content, 20).unwrap();
    assert_eq!(quiz.title, "My Quiz");
    assert_eq!(quiz.questions.len(), 2);

    assert_eq!(quiz.questions[0].text, "What is 1+1?");
    assert_eq!(quiz.questions[0].options.len(), 3);
    assert_eq!(quiz.questions[0].correct_index, 1);
    assert_eq!(quiz.questions[0].time_limit_sec, 20);

    assert_eq!(quiz.questions[1].text, "Capital of France?");
    assert_eq!(quiz.questions[1].options.len(), 4);
    assert_eq!(quiz.questions[1].correct_index, 1); // Paris is index 1
}

#[test]
fn parse_quiz_with_comments_and_blank_lines() {
    let content = "\
# Quiz With Comments
// This is a comment

? First question
- Wrong
* Correct

// Another comment

? Second question
* Right
- Wrong
";

    let quiz = parse_quiz(content, 15).unwrap();
    assert_eq!(quiz.questions.len(), 2);
    assert_eq!(quiz.questions[0].time_limit_sec, 15);
}

#[test]
fn parse_quiz_single_question() {
    let content = "\
# Single
? Only question
- A
* B
";

    let quiz = parse_quiz(content, 20).unwrap();
    assert_eq!(quiz.questions.len(), 1);
}

#[test]
fn parse_quiz_preserves_option_text() {
    let content = "\
# Text Quiz
? Question
- First option
* Second option (correct)
- Third option
";

    let quiz = parse_quiz(content, 20).unwrap();
    assert_eq!(quiz.questions[0].options[0].text, "First option");
    assert_eq!(quiz.questions[0].options[1].text, "Second option (correct)");
    assert_eq!(quiz.questions[0].options[2].text, "Third option");
}

#[test]
fn parse_quiz_two_options_minimum() {
    let content = "\
# Min Options
? Two options
- Wrong
* Right
";

    let quiz = parse_quiz(content, 20).unwrap();
    assert_eq!(quiz.questions[0].options.len(), 2);
}

#[test]
fn parse_quiz_four_options_maximum() {
    let content = "\
# Max Options
? Four options
- A
- B
* C
- D
";

    let quiz = parse_quiz(content, 20).unwrap();
    assert_eq!(quiz.questions[0].options.len(), 4);
    assert_eq!(quiz.questions[0].correct_index, 2);
}

// === Validation error tests ===

#[test]
fn parse_quiz_missing_correct_answer() {
    let content = "\
# No Correct
? Missing star
- A
- B
";
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|e| e.message.contains("no correct answer"))
    );
}

#[test]
fn parse_quiz_multiple_correct_answers() {
    let content = "\
# Multi Correct
? Two stars
* A
* B
- C
";
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|e| e.message.contains("multiple correct answers"))
    );
}

#[test]
fn parse_quiz_too_many_options() {
    let content = "\
# Too Many
? Five options
- A
- B
- C
- D
* E
";
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(errors.iter().any(|e| e.message.contains("maximum is 4")));
}

#[test]
fn parse_quiz_too_few_options() {
    let content = "\
# Too Few
? Only one option
* A
";
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(errors.iter().any(|e| e.message.contains("minimum is 2")));
}

#[test]
fn parse_quiz_empty_option_text() {
    let content = "\
# Empty Option
? Question
-
* B
";
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|e| e.message.contains("Option text is empty"))
    );
}

#[test]
fn parse_quiz_no_title() {
    let content = "\
? No title quiz
- A
* B
";
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(errors.iter().any(|e| e.message.contains("no title")));
}

#[test]
fn parse_quiz_empty_file() {
    let content = "";
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(!errors.is_empty());
}

#[test]
fn parse_quiz_comments_only() {
    let content = "\
// Just a comment
// Another one
";
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(!errors.is_empty());
}

#[test]
fn parse_quiz_error_includes_line_numbers() {
    let content = "\
# Quiz
? Q1
- A
- B
? Q2
* X
";
    // Q1 has no correct answer - error should reference its line
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(errors.iter().any(|e| e.line > 0));
}

#[test]
fn parse_quiz_option_before_question() {
    let content = "\
# Quiz
- Orphan option
? Q1
- A
* B
";
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|e| e.message.contains("before any question"))
    );
}

#[test]
fn parse_quiz_unrecognized_line() {
    let content = "\
# Quiz
? Q1
- A
* B
This line is unrecognized
";
    let errors = parse_quiz(content, 20).unwrap_err();
    assert!(errors.iter().any(|e| e.message.contains("Unrecognized")));
}
