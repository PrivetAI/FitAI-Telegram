# FitAI — AI Fitness Telegram Mini App

AI-powered fitness companion with calorie tracking, workout programming, progress monitoring, and more — all inside Telegram.

## Features

- **AI Food Scanner** — Snap a photo, get instant calories & macros (OpenAI / Gemini Vision)
- **Nutrition Tracker** — Log meals, track daily macros (P/F/C), 7-day history
- **AI Workout Generator** — Get personalized workout plans based on your goals
- **Active Workout Tracker** — Log sets, reps, weight in real-time
- **Progress Tracking** — Weight chart, body measurements, BMI trends
- **AI Coaching** — Chat with AI nutrition coach and training coach
- **Supplements & Vitamins** — Daily checklist with scheduling
- **Steroid Cycle Tracker** — Compounds, timeline, PCT management
- **Lab Results Analysis** — AI interpretation of blood work
- **Achievements & Streaks** — 23 achievements, daily streaks, bronze/silver/gold tiers
- **Cloud Sync** — Optional Supabase backend with offline-first architecture
- **Bilingual** — English + Russian with auto-detection

## Tech Stack

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Zustand 5 · Supabase · OpenAI · Gemini · Telegram Mini App SDK

## Quick Start

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
# Deploy dist/ to any static hosting
# Set URL in @BotFather → /newapp
```

## Supabase (Optional)

1. Create project at [supabase.com](https://supabase.com)
2. Run SQL migrations from `supabase/migrations/`
3. Enter URL + anon key in app settings

See [PROJECT.md](PROJECT.md) for full documentation.

## License

Private — PrivetAI
