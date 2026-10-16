export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SourceType = 'pdf' | 'txt' | 'md' | 'paste';

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          source_type: SourceType;
          raw_text: string;
          summary: string | null;
          key_points: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          source_type: SourceType;
          raw_text: string;
          summary?: string | null;
          key_points?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          source_type?: SourceType;
          raw_text?: string;
          summary?: string | null;
          key_points?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      flashcards: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          question: string;
          answer: string;
          difficulty: 'easy' | 'medium' | 'hard';
          times_correct: number;
          times_wrong: number;
          next_review_date: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          question: string;
          answer: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          times_correct?: number;
          times_wrong?: number;
          next_review_date?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          question?: string;
          answer?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          times_correct?: number;
          times_wrong?: number;
          next_review_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'flashcards_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'flashcards_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          }
        ];
      };
      quizzes: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          title?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quizzes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quizzes_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          }
        ];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question: string;
          options: Json;
          correct_index: number;
          explanation: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question: string;
          options: Json;
          correct_index: number;
          explanation: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question?: string;
          options?: Json;
          correct_index?: number;
          explanation?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_questions_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          }
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number;
          total: number;
          taken_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score: number;
          total: number;
          taken_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_id?: string;
          score?: number;
          total?: number;
          taken_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quiz_attempts_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          }
        ];
      };
      user_ai_usage: {
        Row: {
          id: string;
          user_id: string;
          action: 'summary' | 'flashcards' | 'quiz';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: 'summary' | 'flashcards' | 'quiz';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: 'summary' | 'flashcards' | 'quiz';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_ai_usage_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type DocumentRow = Tables<'documents'>;
export type FlashcardRow = Tables<'flashcards'>;
export type QuizRow = Tables<'quizzes'>;
export type QuizQuestionRow = Tables<'quiz_questions'>;
export type QuizAttemptRow = Tables<'quiz_attempts'>;
export type UserAiUsageRow = Tables<'user_ai_usage'>;
