# MindPath

AI-powered mobile app connecting underrepresented communities to local mental health providers. Users describe how they're feeling in natural language, Mira (the AI assistant) runs a clinical screening instrument (GAD-7, PHQ-9, etc.), and the app surfaces matched providers nearby.

Built as an independent study at the University of Illinois Chicago.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo SDK 51, TypeScript |
| Backend | FastAPI (Python) |
| AI / LLM | Anthropic Claude via LangGraph state machine |
| TTS / STT | ElevenLabs |
| Database | SQLite (`webmd.db`) — 11,398 Illinois providers |
| Navigation | React Navigation v6 (Native Stack + Bottom Tabs) |

---

## Repo Structure

```
mentalhealth/
├── backend/              # FastAPI server
│   ├── main.py           # App entry point, router registration
│   ├── database.py       # SQLite connection
│   ├── requirements.txt
│   ├── routers/
│   │   ├── providers.py  # Provider search, nearby, filters
│   │   └── booking.py    # Appointment booking
│   └── voice/            # LangGraph AI conversation pipeline
│       ├── graph.py      # Conversation state machine
│       ├── llm.py        # System prompt + Claude calls
│       ├── router.py     # /chat/completions + /voice/summary endpoints
│       ├── instruments.py# Clinical instrument definitions (GAD-7, PHQ-9…)
│       └── scoring.py    # Instrument scoring logic
├── mindpath/             # React Native app
│   ├── App.tsx
│   ├── app.json          # Expo config (permissions, plugins)
│   └── src/
│       ├── screens/      # All app screens
│       ├── components/   # Reusable UI components
│       ├── services/     # API calls, ElevenLabs TTS, preferences
│       ├── context/      # React context (filters, saved, location)
│       ├── navigation/   # Stack + tab navigators
│       ├── types/        # TypeScript interfaces
│       └── theme/        # Colors, spacing, typography tokens
├── pipeline/             # One-time data ingestion scripts (scraping done)
├── scraper/              # WebMD provider scraper (scraping done)
├── webmd.db              # Provider database (gitignored)
└── .env.example          # Required environment variables
```

---

## Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Xcode** (for iOS simulator) or a physical iOS/Android device
- **Expo CLI**: `npm install -g expo-cli`

---

## Setup

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd mentalhealth
cp .env.example .env
# Fill in your API keys (see Environment Variables below)
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server runs at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

> The database (`webmd.db`) is gitignored due to size. Ask a team member for a copy and place it at `data/webmd.db`.

### 3. Mobile app

```bash
cd mindpath
npm install

# Run on iOS simulator
npx expo run:ios

# Run on physical device (ensure device and Mac are on same network)
npx expo run:ios --device
```

> `npx expo start` alone won't work for location and microphone features — you need a native build via `expo run:ios`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key — powers Mira's conversation |
| `ELEVENLABS_API_KEY` | ElevenLabs key — TTS voice + STT transcription |
| `ELEVENLABS_VOICE_ID` | Voice ID for Mira's TTS output |

---

## Key App Flows

### Mira Chat (text)
Home → Mira tab → text conversation → condition detected → clinical instrument questions → assessment result → provider list filtered by condition

### Voice Assessment
Home → Mira tab → mic icon → hands-free voice conversation with VAD (auto-detects silence) → same assessment + provider flow

### Quick Screening
Home → Screening tab → select condition → answer instrument questions → results

### Provider Discovery
Home → Discover tab → search by city/ZIP/name → filter by insurance, specialty, distance, telehealth, gender, language, rating

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/providers` | Search + filter providers |
| `GET` | `/providers/nearby` | Haversine distance search by lat/lng |
| `GET` | `/providers/{id}` | Single provider detail |
| `POST` | `/bookings` | Create appointment request |
| `POST` | `/chat/completions` | Mira conversation turn (OpenAI-compatible) |
| `POST` | `/voice/summary` | Generate LLM summary of conversation |

---

## Clinical Instruments

Mira administers validated instruments based on detected condition:

| Condition | Instrument | Questions |
|---|---|---|
| Anxiety | GAD-7 | 7 |
| Depression | PHQ-9 | 9 |
| ADHD | ASRS-5 | 6 |
| Trauma / PTSD | PC-PTSD-5 | 5 |

Scoring is deterministic and runs entirely on the frontend (`mindpath/src/services/instruments.ts`).

---

## Data

The provider database was scraped from public sources and contains 11,398 Illinois mental health providers with reviews, specialties, insurance, and LLM-generated profile insights. The scraping pipeline lives in `pipeline/` and `scraper/` for reference — scraping is complete and does not need to be re-run.
