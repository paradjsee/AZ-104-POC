export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  question: string;
  questionType: "single" | "multiple";
  options: AnswerOption[];
  correctAnswers: string[];
  explanation: string | null;
  topic?: string;
  answerNeedsReview?: boolean;
}

export interface Attempt {
  selectedAnswers: string[];
  isCorrect: boolean;
}
