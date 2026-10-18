import type { Metadata } from 'next';
import {
  Plus_Jakarta_Sans,
  Bricolage_Grotesque,
  Fredoka,
  Caveat,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';

// 1. Primary UI & Body Font: Plus Jakarta Sans
const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

// 2. High-energy Headline Font: Bricolage Grotesque
const bricolage = Bricolage_Grotesque({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

// 3. Playful Display Font for Stat Badges & Celebrations: Fredoka
const fredoka = Fredoka({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

// 4. Authentic Handwritten Font for Study Notes & Sticky Tips: Caveat
const caveat = Caveat({
  variable: '--font-handwritten',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

// 5. Monospace Font for Code, Limits & Shortcuts: JetBrains Mono
const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'StudyBuddy — AI Study Assistant',
  description: 'Upload notes or PDFs and get instant summaries, flashcards, and quizzes powered by Gemini AI.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${bricolage.variable} ${fredoka.variable} ${caveat.variable} ${jetbrains.variable} min-h-screen bg-background font-sans text-foreground antialiased selection:bg-fuchsia-500/20 selection:text-fuchsia-600`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
