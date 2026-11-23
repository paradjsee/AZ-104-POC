import { useMemo, useState } from "react";
import questionData from "./questions.json";
import type { Attempt, Question } from "./types";

const questions = questionData as Question[];

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function sameAnswers(selected: string[], correct: string[]): boolean {
  return (
    selected.length === correct.length &&
    selected.every((answer) => correct.includes(answer))
  );
}

function App() {
  const [mode, setMode] = useState<"all" | "50" | "wrong">("all");
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(() =>
    shuffled(questions),
  );
  const [randomPool, setRandomPool] = useState<Question[]>(() =>
    shuffled(questions),
  );
  const [batchSize, setBatchSize] = useState(50);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [reviewAttempts, setReviewAttempts] = useState<Record<number, Attempt>>(
    {},
  );

  const effectiveAttempts = useMemo(
    () => ({ ...attempts, ...reviewAttempts }),
    [attempts, reviewAttempts],
  );
  const wrongQuestions = useMemo(
    () =>
      questions.filter(
        (question) => effectiveAttempts[question.id]?.isCorrect === false,
      ),
    [effectiveAttempts],
  );
  const visibleQuestions =
    mode === "wrong" ? wrongQuestions : activeQuestions;
  const boundedIndex = Math.min(
    questionIndex,
    Math.max(visibleQuestions.length - 1, 0),
  );
  const currentQuestion = visibleQuestions[boundedIndex];
  const currentAttempt = currentQuestion
    ? (mode === "wrong"
        ? reviewAttempts[currentQuestion.id]
        : effectiveAttempts[currentQuestion.id]) ?? null
    : null;
  const currentSelection = currentQuestion
    ? (currentAttempt?.selectedAnswers ??
      selections[currentQuestion.id] ??
      [])
    : [];
  const activeAttemptCount = activeQuestions.filter(
    (question) => effectiveAttempts[question.id] !== undefined,
  ).length;
  const activeCorrectCount = activeQuestions.filter(
    (question) => effectiveAttempts[question.id]?.isCorrect === true,
  ).length;
  const activeIncorrectCount = activeQuestions.filter(
    (question) => effectiveAttempts[question.id]?.isCorrect === false,
  ).length;
  const correctCount =
    mode === "wrong"
      ? Object.values(effectiveAttempts).filter((attempt) => attempt.isCorrect).length
      : activeCorrectCount;
  const incorrectCount =
    mode === "wrong" ? wrongQuestions.length : activeIncorrectCount;
  const unansweredCount =
    mode === "wrong"
      ? 0
      : activeQuestions.length - activeAttemptCount;
  const isComplete =
    mode !== "wrong" &&
    activeQuestions.length > 0 &&
    activeAttemptCount === activeQuestions.length;

  function chooseAnswer(optionId: string) {
    if (!currentQuestion || currentAttempt) return;

    setSelections((previous) => {
      const selected = previous[currentQuestion.id] ?? [];
      const updated =
        currentQuestion.questionType === "single"
          ? [optionId]
          : selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId];

      return { ...previous, [currentQuestion.id]: updated };
    });
  }

  function checkAnswer() {
    if (!currentQuestion || currentAttempt || currentSelection.length === 0) {
      return;
    }

    const attempt: Attempt = {
      selectedAnswers: currentSelection,
      isCorrect: sameAnswers(
        currentSelection,
        currentQuestion.correctAnswers,
      ),
    };

    if (mode === "wrong") {
      setReviewAttempts((previous) => ({
        ...previous,
        [currentQuestion.id]: attempt,
      }));
    } else {
      setAttempts((previous) => ({
        ...previous,
        [currentQuestion.id]: attempt,
      }));
    }
  }

  function enterWrongQuestions() {
    if (wrongQuestions.length === 0) return;

    setReviewAttempts((previous) => {
      const updated = { ...previous };
      for (const question of wrongQuestions) {
        delete updated[question.id];
      }
      return updated;
    });
    setMode("wrong");
    setQuestionIndex(0);
  }

  function returnToAllQuestions() {
    setMode("all");
    setQuestionIndex(0);
    setActiveQuestions(shuffled(questions));
  }

  function startRandom50() {
    const randomQuestions = shuffled(questions);
    const selected = randomQuestions.slice(0, 50);
    setRandomPool(randomQuestions);
    setBatchSize(selected.length);
    setMode("50");
    setQuestionIndex(0);
    setActiveQuestions(selected);
    setAttempts((previous) => {
      const updated = { ...previous };
      for (const question of selected) delete updated[question.id];
      return updated;
    });
    setSelections((previous) => {
      const updated = { ...previous };
      for (const question of selected) delete updated[question.id];
      return updated;
    });
  }

  function startNewRandom50() {
    let selected: Question[];
    if (batchSize === 50) {
      selected = randomPool.slice(50, 90);
    } else {
      const randomQuestions = shuffled(questions);
      setRandomPool(randomQuestions);
      selected = randomQuestions.slice(0, 50);
    }
    if (selected.length === 0) return;
    setBatchSize(selected.length);
    setActiveQuestions(selected);
    setQuestionIndex(0);
    setAttempts((previous) => {
      const updated = { ...previous };
      for (const question of selected) delete updated[question.id];
      return updated;
    });
    setSelections((previous) => {
      const updated = { ...previous };
      for (const question of selected) delete updated[question.id];
      return updated;
    });
  }

  function goToQuestion(index: number) {
    setQuestionIndex(
      Math.max(0, Math.min(index, visibleQuestions.length - 1)),
    );
  }

  if (questions.length === 0) {
    return (
      <main className="app-shell">
        <section className="empty-state">
          <h1>AZ-104 Practice Test</h1>
          <p>No questions are available. Add questions to the question data file to get started.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">PERSONAL STUDY SESSION</p>
          <h1>AZ-104 Practice Test</h1>
          <p className="subtitle">Work through the questions at your own pace.</p>
        </div>
        <div className="mode-actions">
          <button
            className={`mode-button ${mode === "all" ? "mode-button-active" : ""}`}
            onClick={returnToAllQuestions}
            type="button"
          >
            All Questions
          </button>
          <button
            className={`mode-button ${mode === "50" ? "mode-button-active" : ""}`}
            onClick={startRandom50}
            type="button"
          >
            50 Câu / Lượt
          </button>
          <button
            className={`mode-button ${mode === "wrong" ? "mode-button-active" : ""}`}
            onClick={
              mode === "wrong" ? returnToAllQuestions : enterWrongQuestions
            }
            disabled={mode === "all" && wrongQuestions.length === 0}
            type="button"
          >
            {mode === "wrong"
              ? "Return to All Questions"
              : `Review Wrong Questions (${wrongQuestions.length})`}
          </button>
        </div>
      </header>

      <section className="stats-grid" aria-label="Session statistics">
        <Stat
          label="Total questions"
          value={mode === "wrong" ? wrongQuestions.length : activeQuestions.length}
        />
        <Stat
          label="Current question"
          value={
            visibleQuestions.length === 0
              ? "— / 0"
              : `${boundedIndex + 1} / ${visibleQuestions.length}`
          }
        />
        <Stat label="Correct" value={correctCount} tone="correct" />
        <Stat label="Incorrect" value={incorrectCount} tone="incorrect" />
        <Stat label="Unanswered" value={unansweredCount} />
      </section>

      {isComplete && mode === "all" && (
        <section className="completion-card" aria-live="polite">
          <div>
            <p className="eyebrow">SESSION COMPLETE</p>
            <h2>Practice session summary</h2>
          </div>
          <div className="summary-grid">
            <SummaryItem label="Total questions" value={activeQuestions.length} />
            <SummaryItem label="Correct" value={correctCount} />
            <SummaryItem label="Incorrect" value={incorrectCount} />
            <SummaryItem
              label="Accuracy"
              value={`${Math.round((correctCount / activeQuestions.length) * 100)}%`}
            />
          </div>
          {incorrectCount > 0 && (
            <button
              className="text-button"
              onClick={enterWrongQuestions}
              type="button"
            >
              Review {incorrectCount} wrong{" "}
              {incorrectCount === 1 ? "question" : "questions"}
            </button>
          )}
        </section>
      )}

      {isComplete && mode === "50" && (
        <section className="completion-card" aria-live="polite">
          <div>
            <p className="eyebrow">{batchSize}-QUESTION SET COMPLETE</p>
            <h2>Practice session summary</h2>
          </div>
          <div className="summary-grid">
            <SummaryItem label="Total questions" value={batchSize} />
            <SummaryItem label="Correct" value={activeCorrectCount} />
            <SummaryItem label="Incorrect" value={activeIncorrectCount} />
            <SummaryItem
              label="Accuracy"
              value={`${Math.round((activeCorrectCount / batchSize) * 100)}%`}
            />
          </div>
          <div className="completion-actions">
            {activeIncorrectCount > 0 && (
              <button
                className="text-button"
                onClick={enterWrongQuestions}
                type="button"
              >
                Review {activeIncorrectCount} wrong{" "}
                {activeIncorrectCount === 1 ? "question" : "questions"}
              </button>
            )}
            <button
              className="primary-button"
              onClick={startNewRandom50}
              type="button"
            >
              {batchSize === 50 ? "Start Remaining 40" : "Start 50 Again"}
            </button>
          </div>
        </section>
      )}

      {mode === "wrong" && wrongQuestions.length === 0 ? (
        <section className="empty-state">
          <h2>No wrong questions to review</h2>
          <p>You have answered every question in this review correctly.</p>
          <button className="primary-button" onClick={returnToAllQuestions} type="button">
            Return to All Questions
          </button>
        </section>
      ) : currentQuestion ? (
        <section className="question-card">
          <div className="question-meta">
            <span>
              {mode === "wrong"
                ? "Wrong questions"
                : mode === "50"
                  ? "50 random questions"
                  : "All random questions"} ·{" "}
              {currentQuestion.topic ?? "General"}
            </span>
            <span>
              Question {boundedIndex + 1} of {visibleQuestions.length}
            </span>
          </div>

          <h2 className="question-text">{currentQuestion.question}</h2>
          <p className="answer-hint">
            {currentQuestion.questionType === "multiple"
              ? "Select all that apply."
              : "Select one answer."}
          </p>

          {currentQuestion.answerNeedsReview && (
            <p className="review-note">
              This question’s source answer has not been independently verified.
            </p>
          )}

          <div className="options-list">
            {currentQuestion.options.map((option) => {
              const isSelected = currentSelection.includes(option.id);
              const isCorrect = currentQuestion.correctAnswers.includes(
                option.id,
              );
              const isIncorrectSelection =
                currentAttempt !== null && isSelected && !isCorrect;
              const classNames = [
                "option",
                isSelected ? "option-selected" : "",
                currentAttempt && isCorrect ? "option-correct" : "",
                isIncorrectSelection ? "option-incorrect" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <label className={classNames} key={option.id}>
                  <input
                    checked={isSelected}
                    disabled={currentAttempt !== null}
                    name={`question-${currentQuestion.id}`}
                    onChange={() => chooseAnswer(option.id)}
                    type={
                      currentQuestion.questionType === "multiple"
                        ? "checkbox"
                        : "radio"
                    }
                  />
                  <span className="option-id">{option.id}</span>
                  <span className="option-text">{option.text}</span>
                  {currentAttempt && isCorrect && (
                    <span className="option-status">Correct answer</span>
                  )}
                  {isIncorrectSelection && (
                    <span className="option-status">Your selection</span>
                  )}
                </label>
              );
            })}
          </div>

          {!currentAttempt ? (
            <button
              className="primary-button"
              disabled={currentSelection.length === 0}
              onClick={checkAnswer}
              type="button"
            >
              Check Answer
            </button>
          ) : (
            <section
              className={`feedback ${
                currentAttempt.isCorrect ? "feedback-correct" : "feedback-incorrect"
              }`}
              aria-live="polite"
            >
              <h3>
                {currentAttempt.isCorrect ? "Correct!" : "Incorrect"}
              </h3>
              <p>
                <strong>Explanation</strong>
                <br />
                {currentQuestion.explanation ||
                  "No explanation is available for this question."}
              </p>
            </section>
          )}

          <nav className="question-navigation" aria-label="Question navigation">
            <button
              className="secondary-button"
              disabled={boundedIndex === 0}
              onClick={() => goToQuestion(boundedIndex - 1)}
              type="button"
            >
              Previous Question
            </button>
            <button
              className="secondary-button"
              disabled={boundedIndex >= visibleQuestions.length - 1}
              onClick={() => goToQuestion(boundedIndex + 1)}
              type="button"
            >
              Next Question
            </button>
          </nav>
        </section>
      ) : null}
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "correct" | "incorrect";
}) {
  return (
    <div className={`stat-card ${tone ? `stat-${tone}` : ""}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
