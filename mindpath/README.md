# MindPath — Mental Health Provider Discovery App

A polished, production-quality mobile app frontend for discovering mental health providers. Built with React Native + Expo + TypeScript.

---

## Screens

| Screen | Description |
|--------|-------------|
| **Onboarding** | Animated welcome screen with gradient and feature highlights |
| **Home / Search** | Search by city/ZIP, browse by specialty, quick-search chips |
| **Results** | Provider list with sort, filter bar, and skeleton loading states |
| **Filter Modal** | Full-screen filter: specialty, provider type, insurance, language, gender, availability, rating, experience |
| **Provider Detail** | Rich profile: hero, stats strip, about, specialties, conditions, treatment approaches, education, insurance, reviews, FAQ, sticky CTA |
| **Saved** | Bookmarked providers with polished empty state |
| **Profile / Settings** | Insurance/language/telehealth preferences, notifications, crisis resources |

---

## Tech Stack

- **React Native** 0.74 + **Expo SDK 51**
- **TypeScript** (strict mode)
- **React Navigation** v6 — Native Stack + Bottom Tabs
- **Expo Linear Gradient** — hero/header gradients
- **@expo/vector-icons** — Ionicons throughout
- **React Native Safe Area Context** — safe area handling
- **React Context API** — saved providers state + filter state

---

## Project Structure

```
mindpath/
├── App.tsx                        # Root — providers + navigator
├── app.json                       # Expo config
├── package.json
├── tsconfig.json
├── src/
│   ├── types/
│   │   └── index.ts               # Provider, Review, Filter interfaces + nav param lists
│   ├── theme/
│   │   └── index.ts               # Colors, Typography, Spacing, Radius, Shadows
│   ├── data/
│   │   └── mockProviders.ts       # 8 realistic Chicago providers + filter/search helpers
│   ├── context/
│   │   ├── SavedContext.tsx        # Saved/bookmarked providers state
│   │   └── FilterContext.tsx       # Search filter state
│   ├── navigation/
│   │   └── AppNavigator.tsx        # Root stack + main tabs
│   ├── components/
│   │   ├── ProviderCard.tsx        # Provider list card (fully featured)
│   │   ├── LoadingCard.tsx         # Animated skeleton card
│   │   ├── EmptyState.tsx          # Empty state with icon + CTA
│   │   └── ui/
│   │       ├── Badge.tsx           # Colored status badges
│   │       ├── RatingStars.tsx     # Star rating display
│   │       ├── FilterChip.tsx      # Selectable filter chip
│   │       └── SectionHeader.tsx   # Section title with optional action
│   └── screens/
│       ├── OnboardingScreen.tsx
│       ├── HomeScreen.tsx
│       ├── ResultsScreen.tsx
│       ├── FilterScreen.tsx
│       ├── ProviderDetailScreen.tsx
│       ├── SavedScreen.tsx
│       └── ProfileScreen.tsx
```

---

## Setup & Run

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Xcode) or Android Emulator, **or** the [Expo Go](https://expo.dev/go) app on your phone

### Install

```bash
cd mindpath
npm install
```

### Run

```bash
# Start the dev server
npx expo start

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Scan with Expo Go (iOS or Android)
npx expo start
# Then scan the QR code with your phone camera (iOS) or Expo Go app (Android)
```

---

## Design System

All design tokens live in `src/theme/index.ts`:

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#4A8B9F` | Calm teal — primary actions, links, icons |
| `secondary` | `#6BAF92` | Sage green — success states, availability |
| `accent` | `#E8956A` | Warm amber — CTAs, search button |
| `background` | `#F7F9FC` | App background |
| `surface` | `#FFFFFF` | Cards, headers |
| `textPrimary` | `#1A2B3C` | Main headings + body |
| `textSecondary` | `#6B7A8D` | Secondary text |

### Typography

Relies on system fonts with a strong weight hierarchy. All size/weight/lineHeight constants are in `Typography`.

### Spacing

Uses an 8-point grid: `xs=4, sm=8, md=16, lg=24, xl=32, xxl=48`

---

## Mock Data

8 realistic Chicago mental health providers in `src/data/mockProviders.ts`:

1. **Dr. Sarah Chen, PhD** — Psychologist, anxiety/trauma (4.9 ★)
2. **Dr. Marcus Johnson, MD** — Psychiatrist, ADHD/depression (4.8 ★)
3. **Elena Rodriguez, LMFT** — Couples & Family Therapist, bilingual (4.9 ★)
4. **Dr. James Park, PsyD** — OCD specialist, ERP (4.7 ★)
5. **Priya Patel, LCSW** — Grief & mindfulness, trilingual (4.8 ★)
6. **Dr. David Thompson, MD** — Child & Adolescent Psychiatrist (4.9 ★)
7. **Maya Williams, LPC** — LGBTQ+ affirmative therapist (4.8 ★)
8. **Dr. Robert Chen, PhD** — Neuropsychologist, ADHD testing (4.6 ★)

Each has full profiles: overview, specialties, conditions, treatment approaches, education, insurance, reviews, availability, and session rates.

---

## Connecting Real Data

The mock layer is fully abstracted. When ready to connect a real backend:

1. Replace `src/data/mockProviders.ts` functions (`searchProviders`, `getProviderById`) with API calls
2. The `Provider` interface in `src/types/index.ts` maps directly to your provider schema
3. Add loading/error states as needed in `ResultsScreen` and `ProviderDetailScreen`
4. Persist `SavedContext` with AsyncStorage or a backend favorites endpoint

---

## Notes

- This is a **frontend-only demo** — no real backend, no real appointments
- All provider data is fictional
- The "Book Appointment" and "Call" buttons are placeholder interactions
- The crisis line (988) is real and displayed intentionally in the Profile screen
