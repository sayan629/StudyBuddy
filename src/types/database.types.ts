export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SourceType = 'pdf' | 'txt' | 'md' | 'paste';

export interface DocumentRow {
  id: string;
  user_id: string;
  title: string;
  source_type: SourceType;
  raw_text: string;
  summary: string | null;
  key_points: string[] | null;
  created_at: string;
}

export interface FlashcardRow {
  id: string;
  user_id: string;
  document_id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  times_correct: number;
  times_wrong: number;
  next_review_date: string;
}

export interface QuizRow {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  created_at: string;
}

export interface QuizQuestionRow {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface QuizAttemptRow {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total: number;
  taken_at: string;
}

export interface UserAiUsageRow {
  id: string;
  user_id: string;
  action: 'summary' | 'flashcards' | 'quiz';
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: DocumentRow;
        Insert: Omit<DocumentRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<DocumentRow, 'id' | 'user_id' | 'created_at'>>;
      };
      flashcards: {
        Row: FlashcardRow;
        Insert: Omit<FlashcardRow, 'id'> & {
          id?: string;
        };
        Update: Partial<Omit<FlashcardRow, 'id' | 'user_id' | 'document_id'>>;
      };
      quizzes: {
        Row: QuizRow;
        Insert: Omit<QuizRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<QuizRow, 'id' | 'user_id' | 'document_id'>>;
      };
      quiz_questions: {
        Row: QuizQuestionRow;
        Insert: Omit<QuizQuestionRow, 'id'> & {
          id?: string;
        };
        Update: Partial<Omit<QuizQuestionRow, 'id' | 'quiz_id'>>;
      };
      quiz_attempts: {
        Row: QuizAttemptRow;
        Insert: Omit<QuizAttemptRow, 'id' | 'taken_at'> & {
          id?: string;
          taken_at?: string;
        };
        Update: Partial<Omit<QuizAttemptRow, 'id' | 'user_id' | 'quiz_id'>>;
      };
      user_ai_usage: {
        Row: UserAiUsageRow;
        Insert: Omit<UserAiUsageRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<UserAiUsageRow, 'id'>>;
      };
    };
  };
}

