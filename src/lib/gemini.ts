import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

export const summaryOutputSchema = z.object({
  summary: z.string().min(15, 'Summary is too short'),
  key_points: z.array(z.string().min(3)).min(4).max(10),
});

export const flashcardsOutputSchema = z.object({
  flashcards: z
    .array(
      z.object({
        question: z.string().min(3, 'Question too short'),
        answer: z.string().min(1, 'Answer cannot be empty'),
        difficulty: z.enum(['easy', 'medium', 'hard']).catch('medium'),
      })
    )
    .min(5, 'At least 5 flashcards required')
    .max(25),
});

export const quizOutputSchema = z.object({
  title: z.string().default('Practice Quiz'),
  questions: z
    .array(
      z.object({
        question: z.string().min(5, 'Question too short'),
        options: z.array(z.string().min(1)).length(4, 'Must have exactly 4 options'),
        correct_index: z.number().int().min(0).max(3),
        explanation: z.string().min(5, 'Explanation is required'),
      })
    )
    .min(5, 'At least 5 quiz questions required')
    .max(12),
});

export type SummaryOutput = z.infer<typeof summaryOutputSchema>;
export type FlashcardsOutput = z.infer<typeof flashcardsOutputSchema>;
export type QuizOutput = z.infer<typeof quizOutputSchema>;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key-here' || apiKey === 'placeholder-gemini-key') {
    throw new Error('GEMINI_API_KEY is not configured. Please set a valid Gemini API key in your environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}

// Recommended model: gemini-2.5-flash for rapid, accurate structured analysis
const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Summarize long text by breaking into ~12,000 char chunks if necessary, then combining.
 */
export async function generateStudySummary(rawText: string, title?: string): Promise<SummaryOutput> {
  const ai = getGeminiClient();
  const trimmed = rawText.trim();

  let textToSummarize = trimmed;

  // Chunking for long text (> 20,000 chars)
  if (trimmed.length > 20000) {
    const chunkSize = 15000;
    const chunks: string[] = [];
    for (let i = 0; i < trimmed.length; i += chunkSize) {
      chunks.push(trimmed.slice(i, i + chunkSize));
    }

    const chunkSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkPrompt = `You are a study assistant analyzing section ${i + 1} of ${chunks.length} of the document "${title || 'Study Material'}".
Summarize the key concepts, definitions, and takeaways of this section in bullet points.

Content:
${chunks[i]}`;

      const chunkResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: chunkPrompt,
      });

      if (chunkResponse.text) {
        chunkSummaries.push(chunkResponse.text);
      }
    }

    textToSummarize = `Combined Section Notes:\n${chunkSummaries.join('\n\n')}`;
  }

  const finalPrompt = `You are an expert academic study tutor.
Analyze the following notes for "${title || 'Study Material'}" and create a high-yield study summary.
Requirements:
1. Provide a comprehensive yet concise executive summary (2-3 paragraphs).
2. Extract between 5 to 8 high-impact key bullet points highlighting core formulas, concepts, or takeaways.

Document Content:
${textToSummarize}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: finalPrompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Concise, high-yield study summary (2-3 paragraphs).',
          },
          key_points: {
            type: 'array',
            items: { type: 'string' },
            description: 'Between 5 to 8 critical takeaways, concepts, or definitions.',
          },
        },
        required: ['summary', 'key_points'],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    throw new Error('Failed to parse Gemini output as JSON.');
  }

  const validated = summaryOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error(`AI response did not match expected summary schema: ${validated.error.issues[0]?.message}`);
  }

  return validated.data;
}

/**
 * Generate 10-20 high quality flashcards from study notes.
 */
export async function generateFlashcards(rawText: string, title?: string): Promise<FlashcardsOutput> {
  const ai = getGeminiClient();
  const excerpt = rawText.length > 30000 ? rawText.slice(0, 30000) : rawText;

  const prompt = `You are an expert tutor creating study flashcards for "${title || 'Study Material'}".
Generate between 10 to 20 high-yield question-and-answer flashcards that test core understanding, critical definitions, comparisons, and applications.
Avoid trivial facts; focus on active recall.
Assign each card a difficulty: 'easy', 'medium', or 'hard'.

Content:
${excerpt}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          flashcards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string', description: 'Clear, concise active-recall question' },
                answer: { type: 'string', description: 'Accurate, educational answer' },
                difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              },
              required: ['question', 'answer', 'difficulty'],
            },
          },
        },
        required: ['flashcards'],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Gemini returned an empty response for flashcards.');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    throw new Error('Failed to parse Gemini output as JSON.');
  }

  const validated = flashcardsOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error(`AI response did not match flashcard schema: ${validated.error.issues[0]?.message}`);
  }

  return validated.data;
}

/**
 * Generate 5-10 multiple choice quiz questions with explanations.
 */
export async function generateQuiz(rawText: string, title?: string): Promise<QuizOutput> {
  const ai = getGeminiClient();
  const excerpt = rawText.length > 30000 ? rawText.slice(0, 30000) : rawText;

  const prompt = `You are an expert educator building a practice quiz for "${title || 'Study Material'}".
Create between 5 and 10 high-quality multiple choice questions.
For each question:
- Provide 4 distinct options.
- Indicate the correct option with a 0-based index (0, 1, 2, or 3).
- Provide a clear explanation of WHY the correct option is right and why distractors are incorrect.

Content:
${excerpt}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'A descriptive quiz title' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: {
                  type: 'array',
                  items: { type: 'string' },
                },
                correct_index: { type: 'integer', description: '0-based index of correct option (0-3)' },
                explanation: { type: 'string', description: 'Why this answer is correct' },
              },
              required: ['question', 'options', 'correct_index', 'explanation'],
            },
          },
        },
        required: ['title', 'questions'],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Gemini returned an empty response for quiz.');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    throw new Error('Failed to parse Gemini output as JSON.');
  }

  const validated = quizOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error(`AI response did not match quiz schema: ${validated.error.issues[0]?.message}`);
  }

  return validated.data;
}
