# StudyBuddy - AI Study Assistant 🎓

StudyBuddy is a full-stack AI-powered study assistant built with Next.js 15 (App Router), Supabase (Auth + Postgres + RLS), and Google Gemini AI via `@google/genai`.

Users upload lecture notes, Markdown files, or textbook PDFs (parsed 100% in the browser with `pdfjs-dist` to stay well within cloud request limits) and instantly generate structured executive summaries, spaced-repetition flashcards with flip animations, and interactive practice quizzes with answer explanations.

---

## 🚀 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router) + TypeScript
- **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/)
- **Theme:** Dark mode & Light mode support via `next-themes`
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security + `@supabase/ssr` Auth)
- **AI Engine:** Google Gemini API via official `@google/genai` SDK with strict JSON schema output and Zod validation
- **PDF Extraction:** Client-side parsing using `pdfjs-dist` in the browser (raw files never hit server payloads)
- **Charts:** [Recharts](https://recharts.org/) for tracking comprehension and quiz score trajectories over time

---

## 📋 Features

1. **Client-Side Document Parsing & Upload:**
   - Drag-and-drop support for PDF, Markdown (`.md`), and Plain Text (`.txt`), plus a direct paste box.
   - Browser-based PDF parsing with live progress indicator.
   - Automatic detection and friendly warning for scanned image PDFs without text layers.
   - Automatic truncation warning at 150,000 characters to protect Gemini token budgets.
2. **AI Study Summary:**
   - 2-3 paragraph executive summary plus 5-8 high-yield key takeaways.
   - Intelligent chunking and synthesis for documents longer than 20,000 characters.
   - On-demand "Regenerate Summary" option.
3. **Spaced Repetition Flashcards:**
   - Generates 10-20 high-yield active-recall cards.
   - Interactive 3D flip card animation with keyboard navigation (`Space` to flip, `1` for Missed, `2` for Got it).
   - SuperMemo/SM-2 spaced repetition: "Got it" advances review date to 1, 3, then 7 days; "Missed it" resets review to tomorrow.
   - Filter cards by "Due Today".
4. **Interactive Practice Quizzes:**
   - 5-10 multiple-choice questions with 4 distinct options.
   - One question at a time with instant feedback and answer explanations.
   - Comprehensive results screen detailing all missed questions with explanations.
   - Quiz attempts and historical scores saved to Supabase.
5. **Dashboard & Analytics:**
   - Performance metrics: Cards due today, average quiz score, consecutive study streak.
   - Visual score-over-time area chart powered by Recharts.
   - Searchable document library with quick deletion and regeneration.
6. **Authentication & Data Privacy:**
   - Email/password authentication + Google OAuth sign-in.
   - Complete multi-tenant isolation: every table enforces Row Level Security (`auth.uid() = user_id`).
   - Profile menu with logout and a permanent "Delete my account and data" option.
   - Built-in rate limiting per user on AI routes (20 generations/hour) to protect API quotas.

---

## 🛠️ Supabase Database Setup & Migrations

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com/) and create a new project.
2. Note your **Project URL**, **Anon Key**, and **Service Role Key** under **Project Settings > API**.

### 2. Run the Database Migration
In your Supabase dashboard, open the **SQL Editor**, paste the contents of `supabase/migrations/0001_initial_schema.sql`, and click **Run**.

This migration creates:
- `documents` (user notes, raw text, summaries, and key points)
- `flashcards` (study cards with difficulty, review streak, and next review timestamps)
- `quizzes` (quiz headers tied to documents)
- `quiz_questions` (4 options, correct answer index, and explanations)
- `quiz_attempts` (scores, totals, and timestamps)
- `user_ai_usage` (tracks hourly generation limits per user)
- All primary keys, cascade foreign keys, performance indexes on `user_id` and `document_id`, and strict **Row Level Security (RLS)** policies.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Gemini AI API Configuration
GEMINI_API_KEY=your-gemini-api-key
```

> **Note:** Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

---

## 💻 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel

### Step 1: Push Code to GitHub
Ensure all your files are pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: complete StudyBuddy application"
git push origin master
```

### Step 2: Import into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New... > Project** and import your GitHub repository.
3. Framework Preset will automatically detect **Next.js**.

### Step 3: Add Environment Variables
Under the **Environment Variables** section, add:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (kept secret on server)
- `GEMINI_API_KEY`: Your Google Gemini API key

### Step 4: Configure Supabase Auth Redirect URLs
In your Supabase project dashboard:
1. Navigate to **Authentication > URL Configuration**.
2. Set **Site URL** to your Vercel deployment URL (e.g. `https://your-studybuddy.vercel.app`).
3. Add the following to **Redirect URLs**:
   - `https://your-studybuddy.vercel.app/**`
   - `https://your-studybuddy.vercel.app/auth/callback`
   - `http://localhost:3000/**` (for local dev)

### Step 5: Deploy
Click **Deploy**. Vercel will build and deploy the Next.js App Router application.

---

## 🔒 Multi-Tenant Data Isolation Test

To verify data isolation:
1. Open the app in a regular browser window and sign up as `student1@example.com`.
2. Upload a document (e.g. "Biology 101 Notes") and generate a summary, flashcards, and a quiz.
3. Open an Incognito/Private window and sign up as `student2@example.com`.
4. Observe the dashboard: `student2` will see an empty library, 0 cards due, and 0 quiz attempts.
5. All queries enforce Postgres Row Level Security (`auth.uid() = user_id`), ensuring that no user can read, modify, or delete another user's rows.
