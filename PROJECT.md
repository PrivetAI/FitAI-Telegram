# FitAI — AI-Powered Fitness Telegram Mini App

## Overview
FitAI is a comprehensive AI-powered fitness companion built as a Telegram Mini App (TWA/PWA). It combines calorie tracking, AI-assisted nutrition analysis, workout programming, progress monitoring, supplement management, steroid cycle tracking, achievements, and cloud sync into a single mobile-first experience.

**GitHub:** `PrivetAI/FitAI-Telegram`
**Type:** Telegram Mini App (TWA/PWA)
**Status:** Feature-complete (all 6 iterations done)
**Codebase:** 56 files, ~7,400 lines TypeScript/React

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | React 19 + TypeScript | Component-based, strict types |
| **Build** | Vite 7 | Fast dev + optimized production builds |
| **Styling** | Tailwind CSS 4 | `@tailwindcss/vite` plugin, custom `@theme` tokens |
| **State** | Zustand 5 + persist | 11 stores, all persisted to localStorage |
| **Telegram** | @twa-dev/sdk 8 | Theme, haptics, back button, user data |
| **AI** | OpenAI + Google Gemini | Multi-provider, user's own API keys |
| **Backend** | Supabase (PostgreSQL) | Auth, database, RLS, optional cloud sync |
| **i18n** | Custom lightweight | EN + RU, auto-detect from Telegram |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0D0D0D` | Main app background |
| Surface | `#1A1A1A` | Cards, inputs |
| Surface Light | `#2A2A2A` | Hover states, secondary cards |
| Accent Green | `#00E676` | Primary actions, progress, active states |
| Text Primary | `#FFFFFF` | Headings, primary text |
| Text Secondary | `#9CA3AF` | Labels, helper text |
| Danger | `#FF5252` | Delete, errors |
| Warning | `#FFC107` | Caution states |
| Gold | `#FFD700` | Gold tier achievements |
| Silver | `#C0C0C0` | Silver tier achievements |
| Bronze | `#CD7F32` | Bronze tier achievements |

**Rules:**
- NO emoji anywhere — custom SVG icons only (25+ icons)
- Dark theme exclusively
- Card-based layout with stagger animations
- Mobile-first (Telegram Mini App)
- Large tap targets (min 44px)
- CSS transitions/animations only (no animation library)

---

## Architecture

```
src/
├── App.tsx                     # Root: onboarding vs main app routing
├── main.tsx                    # Entry point, Telegram SDK init
│
├── components/                 # Reusable UI (8 components)
│   ├── AIChat.tsx              # AI chat interface with conversation history
│   ├── BottomNav.tsx           # 5-tab navigation bar
│   ├── Button.tsx              # Styled button variants
│   ├── Card.tsx                # Card wrapper
│   ├── ConfirmDialog.tsx       # Destructive action confirmation
│   ├── ProgressBar.tsx         # Animated progress bar
│   ├── Skeleton.tsx            # Loading skeleton screens
│   └── Toast.tsx               # Toast notifications (success/error/info/achievement)
│
├── pages/                      # Feature pages (10 pages)
│   ├── Achievements.tsx        # Achievement grid, filters, streaks
│   ├── Dashboard.tsx           # Home: calories, macros, streak, quick actions
│   ├── Nutrition.tsx           # Food log, AI scanner, nutrition coach
│   ├── Training.tsx            # Workouts, active tracker, AI coach
│   ├── Progress.tsx            # Weight chart, measurements, BMI
│   ├── Profile.tsx             # Settings, AI config, supplements, cycles, sync
│   └── onboarding/             # 6-step onboarding flow
│       ├── Onboarding.tsx      # Flow controller
│       ├── Welcome.tsx
│       ├── GoalSelection.tsx
│       ├── BodyStats.tsx
│       ├── ActivityLevel.tsx
│       ├── ExperienceLevel.tsx
│       └── Summary.tsx         # TDEE + macro calculation
│
├── icons/
│   └── index.tsx               # 25+ custom SVG icon components
│
├── stores/                     # Zustand stores (11 stores, all persisted)
│   ├── achievementStore.ts     # Achievements progress + streak data
│   ├── aiStore.ts              # AI provider, model, API key
│   ├── appStore.ts             # Active tab, onboarding status
│   ├── cycleStore.ts           # Steroid cycles, PCT
│   ├── langStore.ts            # Language preference (en/ru)
│   ├── nutritionStore.ts       # Food entries, meal log
│   ├── onboardingStore.ts      # User profile, TDEE, macros
│   ├── progressStore.ts        # Weight entries, measurements
│   ├── supabaseStore.ts        # Supabase URL, key, connection, sync state
│   ├── supplementStore.ts      # Supplements, daily checklist
│   ├── toastStore.ts           # Toast notification queue
│   └── trainingStore.ts        # Workouts, templates, active session
│
├── services/
│   ├── achievements.ts         # Achievement condition checker (23 achievements)
│   ├── ai/                     # AI service layer
│   │   ├── index.ts            # Facade — routes to active provider
│   │   ├── types.ts            # AI request/response types
│   │   ├── prompts.ts          # System prompts for all AI features
│   │   ├── openai.ts           # OpenAI provider (GPT-4o/mini + Vision)
│   │   └── gemini.ts           # Gemini provider (2.0 Flash/Pro, 2.5 Flash)
│   └── supabase/               # Backend service layer
│       ├── client.ts           # Supabase client init
│       ├── auth.ts             # Telegram auth via user ID
│       ├── database.ts         # Generic CRUD for all tables
│       ├── sync.ts             # Bidirectional sync engine
│       ├── types.ts            # Database row types
│       └── index.ts            # Barrel export
│
├── hooks/
│   ├── useAchievementCheck.ts  # Auto-checks achievements on store changes
│   └── useTelegram.ts          # Telegram SDK hook
│
├── i18n/
│   ├── index.ts                # i18n provider + useTranslation() hook
│   └── locales/
│       ├── en.ts               # English translations (~400 keys)
│       └── ru.ts               # Russian translations (~400 keys)
│
├── types/
│   ├── index.ts                # All data model interfaces
│   └── achievements.ts         # Achievement definitions
│
├── utils/
│   └── tdee.ts                 # TDEE/macro calculation (Mifflin-St Jeor)
│
└── styles/
    └── index.css               # Tailwind imports + animations + global styles
```

---

## Features

### Onboarding (6 steps)
- Welcome → Goal (lose/gain/maintain/recomp) → Body Stats → Activity Level → Experience → Summary with TDEE + macro targets
- TDEE: Mifflin-St Jeor formula with activity multipliers
- Macro split adjusted per goal

### Dashboard
- Daily calorie tracker (consumed vs target, circular progress)
- Macro breakdown (P/F/C) with animated progress bars
- Streak counter widget (fire icon)
- Recent achievement card
- Active workout banner
- Supplement checklist preview
- Quick action cards (AI Scan, Start Workout)

### Nutrition Tracker
- Manual food entry (name, calories, P/F/C, portion, meal type)
- Meals grouped: breakfast, lunch, dinner, snack
- Daily macro summary with progress bars
- Date navigation (7-day history)
- Edit / delete entries
- **AI Food Scanner** — Camera capture → Vision API (OpenAI/Gemini) → auto-fill nutrition
- **AI Nutrition Coach** — Chat interface with context of user's TDEE, macros, and daily food log

### Training
- 8 pre-built workout templates: Push, Pull, Legs, Upper, Lower, Full Body, HIIT, Cardio
- Each with full exercise lists (name, sets, reps, rest)
- **Active workout tracker:** Start → log sets/reps/weight per exercise → finish
- Workout history with detail view
- **AI Workout Generator** — Select muscles/equipment/time → AI generates full plan
- **AI Training Coach** — Chat for form advice, progressive overload, deload timing

### Progress
- Weight log with daily entries
- Pure SVG line chart (30-day view, gradient fill)
- BMI calculation + weight trend indicator
- Body measurements: chest, waist, hips, arms, thighs
- Links to achievements

### Supplements & Vitamins
- Add supplements: name, dosage, schedule (morning/afternoon/evening/with meal/before bed)
- Daily checklist with tap-to-toggle
- Edit / delete / active toggle
- **AI Supplement Recommendations** based on goals

### Steroid Cycle Tracker
- Create cycles with multiple compounds
- Each compound: name, dosage, frequency (daily/EOD/E3D/weekly/biweekly), duration
- Active cycle timeline with progress bar
- End cycle, cycle history
- PCT tracker: compound, dosage, start date, duration

### Lab Results Analysis
- Input blood work values (testosterone, estrogen, liver enzymes, lipids, CBC)
- AI analyzes and interprets results
- Flags concerning values
- Suggests supplements or lifestyle changes

### Achievements & Streaks (23 achievements)

**Nutrition:** First Bite, Calorie Counter (7d), Macro Master, Meal Prep Pro, Century Club (100 entries), Perfect Week
**Training:** First Rep, Iron Regular (10), Beast Mode (50), Heavy Lifter (100kg+), Marathon Session (60min+), Variety Pack (all 8 categories)
**Progress:** Scale Starter, Consistent Tracker (7d), Transformation (30 entries), Goal Crusher, Measure Up (5 measurements)
**Supplements:** Supplement Starter, Daily Dose, 30 Day Commitment
**Streaks:** On Fire (7d), Unstoppable (30d), Legend (100d)

- Bronze / Silver / Gold tiers with distinct colors
- Streak freezes earned through achievements
- Auto-checking with 300ms debounce on any store change
- Gold glow + confetti animation on unlock
- Achievement toast notifications with haptic feedback

### Profile & Settings
- Edit body stats + auto TDEE recalculation
- **AI Settings:** Provider (OpenAI/Gemini), model selector, API key, test connection
- **Cloud Sync:** Supabase URL/key, connect/disconnect, auto-sync, manual sync, last synced
- **Language:** EN/RU switcher
- Data export placeholder
- App info / about

### i18n (English + Russian)
- ~400 translation keys organized by feature
- Custom `useTranslation()` hook (no external deps)
- Auto-detect from Telegram SDK `language_code`
- Fallback to English

### Cloud Sync (Supabase)
- **Offline-first:** App works 100% without Supabase
- PostgreSQL: 12 tables with Row Level Security
- Telegram auth via user ID
- Bidirectional sync (last-write-wins)
- Auto-sync + manual "Sync Now"
- Migrations: `supabase/migrations/001_initial.sql`, `002_achievements.sql`

---

## AI Providers

### OpenAI
- Models: `gpt-4o`, `gpt-4o-mini`
- Vision: `gpt-4o` for food photo analysis
- Direct API calls from client (user's own key)

### Google Gemini
- Models: `gemini-2.0-flash`, `gemini-2.0-pro`, `gemini-2.5-flash`
- Vision: inline image data for food analysis
- Direct API calls from client (user's own key)

### AI Features
| Feature | Input | Output |
|---------|-------|--------|
| Food Scanner | Camera photo | Calories, P/F/C, name, portion |
| Workout Generator | Muscles, equipment, time, goal | Full workout plan |
| Nutrition Coach | Chat message + user context | Personalized advice |
| Training Coach | Chat message + workout history | Form tips, programming advice |
| Supplement Recs | User goals + current supplements | Suggested supplements + dosages |
| Lab Analysis | Blood work values | Interpretation + flags + suggestions |

---

## Database Schema (Supabase/PostgreSQL)

12 tables with RLS:
- `users` — Telegram auth (telegram_id unique)
- `user_profiles` — Onboarding data, TDEE, macros
- `food_entries` — Nutrition log
- `workout_logs` — Training history (exercises as JSONB)
- `weight_entries` — Weight tracking
- `measurements` — Body measurements
- `supplements` — Supplement list
- `supplement_logs` — Daily checklist
- `steroid_cycles` — Cycle data (compounds as JSONB)
- `pct_entries` — PCT tracking
- `achievements` — Achievement progress + unlock timestamps
- `streaks` — Current/longest streak, freezes

---

## TDEE Calculation

**Mifflin-St Jeor equation:**
- Male: `10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5`
- Female: `10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161`

**Activity multipliers:** 1.2 / 1.375 / 1.55 / 1.725 / 1.9

**Goal adjustments:** Lose: ×0.8 | Gain: ×1.15 | Maintain/Recomp: ×1.0

**Macro split:**
- Lose: 40% P / 30% F / 30% C
- Gain: 30% P / 25% F / 45% C
- Maintain/Recomp: 30% P / 30% F / 40% C

---

## Running Locally

```bash
cd /path/to/FitAI-Telegram
npm install
npm run dev        # Dev server at localhost:5173
npm run build      # Production build to dist/
npm run preview    # Preview production build
```

## Deploying

1. `npm run build` → produces `dist/`
2. Deploy `dist/` to static hosting (Vercel, Netlify, GitHub Pages, Cloudflare Pages)
3. Create Telegram Bot via @BotFather
4. Set Mini App URL: `BotFather → /newapp → URL of deployed app`
5. (Optional) Set up Supabase project, run migrations, enter URL/key in app settings

## Supabase Setup

1. Create project at supabase.com
2. Go to SQL Editor, run `supabase/migrations/001_initial.sql`
3. Run `supabase/migrations/002_achievements.sql`
4. Copy project URL + anon key
5. Enter in app: Profile → Cloud Sync → Connect

---

## Iteration History

| Iter | Focus | Files | Lines |
|------|-------|-------|-------|
| 1 | Skeleton, onboarding, nav, Telegram SDK | 20 | ~800 |
| 2 | Nutrition, training, progress, supplements, cycles | +16 | +1,941 |
| 3 | AI integration (OpenAI + Gemini), food scanner, coaches | +8 | +1,200 |
| 4 | Achievements (23), streaks, tier system | +6 | +1,222 |
| 5 | Supabase backend, auth, sync engine | +6 | +1,411 |
| 6 | i18n EN/RU, animations, toasts, confirm dialogs, polish | +14 | +1,800 |
| **Total** | | **56 files** | **~7,400 lines** |
