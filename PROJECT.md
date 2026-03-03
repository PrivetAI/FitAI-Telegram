# FitAI — AI-Powered Fitness Telegram Mini App

## Overview
FitAI is a comprehensive AI-powered fitness companion built as a Telegram Mini App (TWA/PWA). It combines calorie tracking, AI-assisted nutrition analysis, workout programming, progress monitoring, supplement management, and steroid cycle tracking into a single mobile-first experience.

**GitHub:** `PrivetAI/FitAI-Telegram`
**Type:** Telegram Mini App (TWA)
**Status:** In development (iteration 2 complete)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | React 19 + TypeScript | Component-based, type-safe |
| **Build** | Vite 7 | Fast dev server + optimized builds |
| **Styling** | Tailwind CSS 4 | `@tailwindcss/vite` plugin, `@theme` tokens |
| **State** | Zustand 5 + persist middleware | localStorage persistence, separate stores per feature |
| **Telegram** | @twa-dev/sdk 8 | Mini App API: theme, haptics, back button |
| **AI** | OpenAI API (planned) | GPT-4o for text, Vision for food photos |
| **Backend** | TBD (Supabase or Node.js) | Currently all client-side with localStorage |

**Build size:** ~276KB JS (80KB gzipped)

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0D0D0D` | Main app background |
| Surface | `#1A1A1A` | Cards, inputs |
| Surface Light | `#2A2A2A` | Hover states, secondary cards |
| Accent (Green) | `#00E676` | Primary actions, progress, active states |
| Text Primary | `#FFFFFF` | Headings, primary text |
| Text Secondary | `#9CA3AF` | Labels, helper text |
| Danger | `#FF5252` | Delete, errors |
| Warning | `#FFC107` | Caution states |

**Rules:**
- NO emoji anywhere in UI — custom SVG icons only
- Dark theme exclusively
- Card-based layout
- Mobile-first (Telegram Mini App = phone screen)
- Large tap targets (min 44px)
- Smooth CSS transitions/animations

---

## Architecture

```
src/
├── App.tsx                  # Root: routes onboarding vs main app
├── main.tsx                 # Entry point, Telegram SDK init
├── components/              # Reusable UI primitives
│   ├── BottomNav.tsx        # 5-tab navigation bar
│   ├── Button.tsx           # Styled button variants
│   ├── Card.tsx             # Card wrapper component
│   └── ProgressBar.tsx      # Animated progress bar
├── pages/                   # Feature pages
│   ├── Dashboard.tsx        # Home: calories, macros, quick actions
│   ├── Nutrition.tsx        # Food log, meal tracking, AI scanner
│   ├── Training.tsx         # Workout templates, active tracker, history
│   ├── Progress.tsx         # Weight chart, measurements, photos
│   ├── Profile.tsx          # Settings, supplements, cycles, about
│   └── onboarding/          # 6-step onboarding flow
│       ├── Onboarding.tsx   # Flow controller
│       ├── Welcome.tsx
│       ├── GoalSelection.tsx
│       ├── BodyStats.tsx
│       ├── ActivityLevel.tsx
│       ├── ExperienceLevel.tsx
│       └── Summary.tsx      # TDEE calculation + macro split
├── icons/
│   └── index.tsx            # All custom SVG icon components (15+)
├── stores/                  # Zustand state stores (all persisted)
│   ├── appStore.ts          # App state: active tab, onboarding status
│   ├── onboardingStore.ts   # User profile, TDEE, macros
│   ├── nutritionStore.ts    # Food entries, meal log
│   ├── trainingStore.ts     # Workouts, templates, active session
│   ├── progressStore.ts     # Weight entries, measurements
│   ├── supplementStore.ts   # Supplements, daily checklist
│   └── cycleStore.ts        # Steroid cycles, PCT
├── services/
│   └── ai.ts               # AI service placeholders (OpenAI integration point)
├── hooks/
│   └── useTelegram.ts       # Telegram SDK hook
├── types/
│   └── index.ts             # All TypeScript interfaces
├── utils/
│   └── tdee.ts              # TDEE/macro calculation (Mifflin-St Jeor)
└── styles/
    └── index.css            # Tailwind imports + global styles
```

---

## Features

### ✅ Implemented (Iteration 1-2)

#### Onboarding (6 steps)
- Welcome screen with app introduction
- Goal selection: lose weight / gain muscle / maintain / recomp
- Body stats: gender, age, height (cm), weight (kg)
- Activity level: sedentary → very active (5 levels)
- Experience level: beginner / intermediate / advanced
- Summary: TDEE calculated via Mifflin-St Jeor, macro split based on goal

#### Dashboard
- Daily calorie tracker (consumed vs target)
- Macro breakdown (protein / fat / carbs) with progress bars
- Active workout banner
- Supplement checklist preview
- Quick action cards (AI Scan, Start Workout)
- Weekly progress placeholder

#### Nutrition Tracker
- Manual food entry (name, calories, P/F/C, portion, meal type)
- Meals grouped by type: breakfast, lunch, dinner, snack
- Daily macro summary with progress bars vs targets
- Date navigation (7-day history)
- Edit / delete entries
- AI Food Scanner placeholder (camera button → mock analysis)

#### Training
- 8 pre-built workout templates:
  - Push, Pull, Legs, Upper Body, Lower Body, Full Body, HIIT, Cardio
- Each with full exercise lists (name, sets, reps, rest time)
- **Active workout tracker:**
  - Start from template → log sets/reps/weight in real-time
  - Add extra sets per exercise
  - Finish/cancel workout
  - Duration tracking
- Workout history with detail view
- AI workout generation placeholder

#### Progress
- Weight log with daily entries
- SVG line chart (30-day view, gradient fill, data points)
- BMI calculation
- Weight trend indicator (gaining/losing/stable)
- Body measurements: chest, waist, hips, arms, thighs
- Progress photos placeholder

#### Supplements & Vitamins
- Add supplements: name, dosage, schedule (morning/afternoon/evening/with meal/before bed)
- Daily checklist with tap-to-toggle
- Edit / delete supplements
- Active/inactive management

#### Steroid Cycle Tracker
- Create named cycles with multiple compounds
- Each compound: name, dosage, frequency (daily/EOD/E3D/weekly/biweekly), duration in weeks
- Active cycle timeline with progress bar (weeks elapsed)
- End cycle functionality
- Cycle history
- PCT tracker: compound, dosage, start date, duration

#### Profile
- View/edit body stats
- Auto TDEE recalculation on changes
- Quick access to supplements & cycles
- About / app info
- Data export placeholder

### 🔜 Planned (Future Iterations)

#### Iteration 3 — AI Integration
- OpenAI GPT-4o integration for:
  - Food photo analysis (Vision API → auto-fill nutrition data)
  - Smart workout generation based on goals/experience/equipment
  - Nutrition coaching (meal suggestions, deficit/surplus advice)
  - Training advice (progressive overload, deload recommendations)
- API key management (user provides their own key, or server-side proxy)

#### Iteration 4 — Advanced Features
- Blood work / lab results analysis (input values → AI interpretation)
- Vitamin deficiency detection from lab results
- Supplement recommendations based on goals + labs
- Progress photo comparison (side-by-side)
- Social sharing (workout summaries)
- Achievement/streak system

#### Iteration 5 — Backend & Sync
- Supabase or Node.js backend
- Telegram auth (user identity via Mini App init data)
- Cloud data sync (cross-device)
- Push notifications via Telegram bot
- Data export (CSV/PDF reports)

#### Iteration 6 — Polish
- Animations & micro-interactions
- Onboarding tutorial tooltips
- Offline support (service worker)
- Localization (EN/RU)
- App Store / Play Store wrapper (Capacitor/TWA)

---

## Data Models

All defined in `src/types/index.ts`. Key models:

- **UserProfile** — gender, age, height, weight, goal, activity, experience, TDEE, macros
- **FoodEntry** — name, calories, P/F/C, portion, meal type, date
- **WorkoutTemplate** — name, category, target muscles, exercises
- **WorkoutLog** — active exercises with sets (reps/weight), duration
- **WeightEntry** — weight, date
- **MeasurementEntry** — chest, waist, hips, arms, thighs
- **Supplement** — name, dosage, schedule[], active flag
- **SteroidCycle** — name, compounds[], start/end date, active flag
- **PCTEntry** — compound, dosage, duration, linked to cycle

---

## TDEE Calculation

Uses **Mifflin-St Jeor** equation:
- Male: `10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161 + 5 + 166`
- Female: `10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161`

Activity multipliers: 1.2 / 1.375 / 1.55 / 1.725 / 1.9

Target calories adjusted by goal:
- Lose weight: TDEE × 0.8
- Gain muscle: TDEE × 1.15
- Recomp: TDEE × 1.0
- Maintain: TDEE × 1.0

Macro split by goal:
- Lose: 40% protein / 30% fat / 30% carbs
- Gain: 30% protein / 25% fat / 45% carbs
- Maintain/Recomp: 30% protein / 30% fat / 40% carbs

---

## Running Locally

```bash
cd /Users/PrinceTyga/Documents/development/FitAI-Telegram
npm install
npm run dev        # Dev server at localhost:5173
npm run build      # Production build to dist/
npm run preview    # Preview production build
```

## Deploying as Telegram Mini App

1. Build: `npm run build`
2. Deploy `dist/` to any static hosting (Vercel, Netlify, GitHub Pages)
3. Set up Telegram Bot via @BotFather
4. Configure Mini App URL: `BotFather → /newapp → set URL to deployed app`
5. Users access via bot menu button or direct link

---

## Notes

- All data currently stored in browser localStorage via Zustand persist
- No backend/API calls yet — AI functions return mock data
- Telegram SDK auto-detects theme but we force dark mode
- Zero emoji policy — all icons are custom SVG components in `src/icons/`
- Weight chart is pure SVG (no chart library dependency)
