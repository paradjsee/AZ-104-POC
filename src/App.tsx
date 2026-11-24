import { useMemo, useState } from "react";
import scenarioGroups from "../raw/scenario_groups.json";
import questionData from "./questions.json";
import type { Attempt, Question } from "./types";

const questions = (questionData as Question[]).slice().sort((a, b) => a.id - b.id);
const exams = [questions.slice(0, 50), questions.slice(50, 100), questions.slice(100)];
const scenarioByQuestion = new Map<number, string>();
for (const [scenario, ids] of Object.entries(scenarioGroups)) {
  for (const id of ids) scenarioByQuestion.set(id, scenario);
}

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
  const [mode, setMode] = useState<"choose" | "exam" | "wrong">("choose");
  const [examIndex, setExamIndex] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [reviewSelections, setReviewSelections] = useState<Record<number, string[]>>({});
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
      (mode === "wrong" ? reviewSelections : selections)[currentQuestion.id] ??
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
    mode === "exam" &&
    activeQuestions.length > 0 &&
    activeAttemptCount === activeQuestions.length;

  function chooseAnswer(optionId: string) {
    if (!currentQuestion || currentAttempt) return;

    const updateSelections = mode === "wrong" ? setReviewSelections : setSelections;
    updateSelections((previous) => {
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

    setReviewSelections({});
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

  function startExam(order: "id" | "random") {
    const exam = exams[examIndex];
    setActiveQuestions(order === "random" ? shuffled(exam) : exam);
    setMode("exam");
    setQuestionIndex(0);
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
          {mode !== "choose" && (
            <button className="mode-button" onClick={() => setMode("choose")} type="button">
              Practice Tests
            </button>
          )}
          {mode !== "wrong" && (
            <button
              className="mode-button"
              onClick={enterWrongQuestions}
              disabled={wrongQuestions.length === 0}
              type="button"
            >
              Review Wrong Questions ({wrongQuestions.length})
            </button>
          )}
        </div>
      </header>

      {mode === "choose" ? (
        <section className="question-card" aria-labelledby="exam-heading">
          <h2 id="exam-heading">Choose a practice test</h2>
          <div className="exam-grid" role="group" aria-label="Practice tests">
            {exams.map((exam, index) => (
              <button
                aria-pressed={examIndex === index}
                className="exam-button"
                key={index}
                onClick={() => setExamIndex(index)}
                type="button"
              >
                <strong>Test {index + 1}</strong>
                <span>{exam.length} questions</span>
              </button>
            ))}
          </div>
          <div className="order-picker">
            <h3>Test {examIndex + 1} question order</h3>
            <div className="order-actions">
              <button className="primary-button" onClick={() => startExam("id")} type="button">
                Start in ID Order
              </button>
              <button className="secondary-button" onClick={() => startExam("random")} type="button">
                Start in Random Order
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
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

          {isComplete && (
            <section className="completion-card" aria-live="polite">
              <h2>Test {examIndex + 1} summary</h2>
              <div className="summary-grid">
                <SummaryItem label="Total questions" value={activeQuestions.length} />
                <SummaryItem label="Correct" value={correctCount} />
                <SummaryItem label="Incorrect" value={incorrectCount} />
                <SummaryItem
                  label="Accuracy"
                  value={Math.round((correctCount / activeQuestions.length) * 100) + "%"}
                />
              </div>
              {wrongQuestions.length > 0 && (
                <button className="text-button" onClick={enterWrongQuestions} type="button">
                  Review Wrong Questions ({wrongQuestions.length})
                </button>
              )}
            </section>
          )}

          {mode === "wrong" && wrongQuestions.length === 0 ? (
            <section className="empty-state">
              <h2>No wrong questions to review</h2>
              <p>You have answered every question in this review correctly.</p>
              <button className="primary-button" onClick={() => setMode("choose")} type="button">
                Return to Practice Tests
              </button>
            </section>
          ) : currentQuestion ? (
            <section className="question-card">
              <div className="question-meta">
                <span>
                  {mode === "wrong" ? "Wrong questions" : "Test " + (examIndex + 1)} ?{" "}
                  {currentQuestion.topic ?? "General"}
                </span>
                <span>
                  Question {boundedIndex + 1} of {visibleQuestions.length} ?{" "}
                  {currentQuestion.hasLocalId ? "Local ID" : "ID"} {currentQuestion.id}
                </span>
              </div>
              {scenarioByQuestion.has(currentQuestion.id) && (
                <p className="scenario-label">Scenario group ? {scenarioByQuestion.get(currentQuestion.id)}</p>
              )}

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
        </>
      )}
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
