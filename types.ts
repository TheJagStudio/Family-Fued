export interface Answer {
  text: string;
  points: number;
  revealed: boolean;
}

export interface Question {
  text: string;
  answers: Answer[];
}

export interface QuizData {
  title: string;
  questions: Question[];
}

export interface GameState {
  status: 'IDLE' | 'WAITING' | 'ACTIVE' | 'FINISHED';
  currentQuestionIndex: number;
  questions: Question[];
  wrongAnswerCount: number; // For the current round (0, 1, 2, 3)
  showWrongOverlay: boolean; // Triggers the visual "X"
}

export type PeerMessage = 
  | { type: 'SYNC_STATE'; payload: GameState }
  | { type: 'SHOW_WRONG'; payload: boolean } // Only used to trigger animation momentarily
  | { type: 'RESET' };

export const INITIAL_STATE: GameState = {
  status: 'IDLE',
  currentQuestionIndex: 0,
  questions: [],
  wrongAnswerCount: 0,
  showWrongOverlay: false,
};
