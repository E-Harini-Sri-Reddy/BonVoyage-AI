# BonVoyage AI — Architecture & Planning Document

> Phase 1 deliverable. Defines architecture, folder structure, APIs, env vars, data flow, and component inventory.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + Vite)               │
│  Pages: Home │ Trip Planner │ AI Travel Planner                 │
│  Context: TripState, Favorites, RecentSearches, Theme           │
│  Services: apiClient (Axios → backend only)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP /api/*
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express.js)                        │
│  Routes → Controllers → Services → External APIs / Groq         │
│  Middleware: validation, errorHandler, rateLimit, cors            │
└──────┬──────────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
    Groq      OpenWeather  Geoapify   Sky Scrapper  (Leaflet/OSM
    API       One Call     Places +   (RapidAPI)     tiles via
              API          Geocoding                   frontend)
```

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **API keys never in frontend** | All external calls via Express proxy |
| **Single aggregated response** | `POST /api/trip/plan` returns one JSON payload |
| **Graceful degradation** | Partial data + fallbacks when APIs fail |
| **Structured AI I/O** | JSON schema prompts; parse & validate Groq output |
| **Separation of concerns** | Prompt builders, normalizers, and controllers isolated |

---

## 2. Monorepo Folder Structure

```
BonVoyage AI/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/
│   │   │   ├── logo.svg
│   │   │   └── illustrations/
│   │   ├── components/
│   │   │   ├── common/          # Button, Card, Input, Skeleton, Badge, Carousel
│   │   │   ├── layout/          # Header, Footer, PageContainer, GlassPanel
│   │   │   ├── auth/            # LoginCard, GoogleButton (dummy)
│   │   │   ├── trip/            # TripForm, InterestPicker, TripSummaryBar
│   │   │   └── results/         # WeatherDay, FlightCard, HotelCard, ActivityCard, etc.
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── TripPlannerPage.jsx
│   │   │   └── ResultsPage.jsx
│   │   ├── hooks/
│   │   │   ├── useTripForm.js
│   │   │   ├── useTripPlan.js
│   │   │   ├── useFavorites.js
│   │   │   └── useRecentSearches.js
│   │   ├── context/
│   │   │   ├── TripContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── services/
│   │   │   └── apiClient.js
│   │   ├── utils/
│   │   │   ├── validation.js
│   │   │   ├── formatters.js
│   │   │   └── storage.js
│   │   ├── constants/
│   │   │   ├── interests.js
│   │   │   ├── tripTypes.js
│   │   │   └── routes.js
│   │   ├── styles/
│   │   │   └── globals.css       # Tailwind directives + CSS variables
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   └── constants.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── trip.routes.js
│   │   │   ├── weather.routes.js
│   │   │   ├── flights.routes.js
│   │   │   ├── hotels.routes.js
│   │   │   └── places.routes.js
│   │   ├── controllers/
│   │   │   └── trip.controller.js
│   │   ├── middleware/
│   │   │   ├── validate.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── services/
│   │   │   ├── groq.service.js
│   │   │   ├── weather.service.js
│   │   │   ├── flights.service.js
│   │   │   ├── hotels.service.js
│   │   │   ├── places.service.js
│   │   │   └── geocoding.service.js
│   │   ├── clients/
│   │   │   ├── groq.client.js
│   │   │   ├── openweather.client.js
│   │   │   ├── geoapify.client.js
│   │   │   └── skyscrapper.client.js
│   │   ├── normalizers/
│   │   │   ├── weather.normalizer.js
│   │   │   ├── flights.normalizer.js
│   │   │   ├── hotels.normalizer.js
│   │   │   └── places.normalizer.js
│   │   ├── prompts/
│   │   │   ├── weatherInsight.prompt.js
│   │   │   ├── activities.prompt.js
│   │   │   ├── optimizer.prompt.js
│   │   │   ├── itinerary.prompt.js
│   │   │   ├── budget.prompt.js
│   │   │   ├── packing.prompt.js
│   │   │   ├── summary.prompt.js
│   │   │   └── localInfo.prompt.js
│   │   ├── validators/
│   │   │   └── trip.validator.js
│   │   ├── utils/
│   │   │   ├── cache.js
│   │   │   ├── dateHelpers.js
│   │   │   └── retry.js
│   │   └── app.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── ARCHITECTURE.md
├── .gitignore
├── README.md
└── package.json                  # Root scripts: dev, build, install:all
```

---

## 3. External API Selection & Usage

### 3.1 Groq API (AI Engine)

| Use Case | Model | Notes |
|----------|-------|-------|
| Weather day explanations | `llama-3.3-70b-versatile` | Short, contextual |
| Activity generation | Same | Grounded in Geoapify places |
| Trip Optimizer (flagship) | Same | Full structured context |
| Daily itinerary | Same | Per-day morning/afternoon/evening |
| Budget allocation | Same | Percentage breakdown |
| Packing checklist | Same | Weather + activity aware |
| Trip summary | Same | Concise narrative |
| Local info enrichment | Same | Supplement static data |

**Strategy:** Batch related prompts where possible; use `response_format: { type: "json_object" }` for structured outputs.

### 3.2 OpenWeather One Call API 3.0

- **Endpoint:** `https://api.openweathermap.org/data/3.0/onecall`
- **Flow:** Geocode destination → lat/lon → daily + hourly forecast
- **Normalization:** Map each trip day to Morning (6–12), Afternoon (12–18), Evening (18–22)
- **Fields:** icon, temp, pop (rain %), humidity, wind_speed
- **Fallback:** If forecast unavailable, show message + skip AI weather insights for that day

### 3.3 Geoapify

| API | Purpose |
|-----|---------|
| **Geocoding** | Resolve "Flying From/To" (airport codes, cities, countries) → coordinates |
| **Places** | Hotels, landmarks, museums, parks, restaurants near destination |

**Hotel ranking algorithm (backend):**
```
score = (budgetFit * 0.35) + (rating * 0.25) + (centreProximity * 0.20)
      + (attractionProximity * 0.15) + (familyFriendly * 0.05)
```

### 3.4 Sky Scrapper API (RapidAPI)

- **Host:** `sky-scrapper.p.rapidapi.com`
- **Endpoints:** Search flights by origin/destination/date
- **Sort:** Price ascending → top 3
- **External links:** Google Flights & Skyscanner URLs constructed from route + dates
- **Fallback:** Empty array + user message if no flights found

### 3.5 Leaflet + OpenStreetMap (Frontend only)

- Display destination map with hotel/place markers
- No API key required; tiles from OSM

---

## 4. Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Groq
GROQ_API_KEY=

# OpenWeather
OPENWEATHER_API_KEY=

# Geoapify
GEOAPIFY_API_KEY=

# Sky Scrapper (RapidAPI)
RAPIDAPI_KEY=
RAPIDAPI_HOST=sky-scrapper.p.rapidapi.com

# Optional
CACHE_TTL_SECONDS=3600
GROQ_MODEL=llama-3.3-70b-versatile
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> No secret keys in frontend env — only public backend URL.

---

## 5. Data Flow

### 5.1 Trip Planning Request Flow

```
User submits Trip Planner form
        │
        ▼
Frontend validates (client-side) → TripContext stores trip input
        │
        ▼
Navigate to Results Page → POST /api/trip/plan
        │
        ▼
Backend trip.controller.js
        │
        ├── 1. Validate payload (Joi/Zod)
        ├── 2. Geocode origin + destination (Geoapify) — parallel
        ├── 3. Fetch weather (OpenWeather) — parallel
        ├── 4. Fetch flights (Sky Scrapper) — parallel
        ├── 5. Fetch hotels + places (Geoapify) — parallel
        ├── 6. Normalize all responses
        ├── 7. Groq: weather insights (per day)
        ├── 8. Groq: activities (5, grounded in places)
        ├── 9. Groq: trip optimizer (all structured data)
        ├── 10. Groq: itinerary, budget, packing, summary, restaurants, local info
        └── 11. Aggregate → single JSON response
        │
        ▼
Frontend renders 12 sections from response
        │
        ▼
Save to Recent Searches (localStorage)
```

### 5.2 Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/trip/plan` | **Primary** — full trip plan aggregation |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/geocode` | Resolve location string (optional, for autocomplete) |

> Individual resource routes (`/weather`, `/flights`, etc.) available for debugging but frontend uses only `/api/trip/plan`.

### 5.3 Trip Plan Request Schema

```json
{
  "origin": "JFK",
  "destination": "Paris",
  "fromDate": "2026-08-01",
  "toDate": "2026-08-07",
  "travellers": 2,
  "budget": 5000,
  "currency": "USD",
  "tripType": "couple",
  "interests": ["food", "museums", "photography"]
}
```

### 5.4 Trip Plan Response Schema (aggregated)

```json
{
  "meta": { "origin", "destination", "dates", "travellers", "budget", "tripType", "interests" },
  "geocoding": { "origin": { lat, lon, name }, "destination": { lat, lon, name } },
  "weather": [{ "date", "periods": [{ "period", "icon", "temp", "rainProbability", "humidity", "windSpeed", "aiInsight" }] }],
  "flights": [{ "airline", "route", "duration", "stops", "price", "links": { "googleFlights", "skyscanner" } }],
  "hotels": [{ "name", "price", "rating", "address", "amenities", "bookUrl", "distanceToCentre" }],
  "activities": [{ "title", "description", "duration", "estimatedCost", "indoor", "location" }],
  "places": [{ "name", "category", "rating", "distance", "description", "openingHours" }],
  "optimizer": { "decisions": [{ "category", "choice", "reason" }], "highlights": [] },
  "itinerary": [{ "day", "date", "morning", "afternoon", "evening" }],
  "budget": { "flights", "hotels", "food", "activities", "emergencyBuffer", "total" },
  "packing": [{ "item", "reason", "category" }],
  "summary": { "text", "highlights", "pace", "weatherNote", "budgetNote" },
  "restaurants": [{ "name", "cuisine", "rating", "distance", "priceRange", "mealTime" }],
  "localInfo": { "emergencyNumbers", "currency", "language", "timeZone", "powerPlug", "transportTips", "safetyTips" },
  "errors": [{ "source", "message", "severity" }]
}
```

---

## 6. Frontend Routing

| Route | Page | Auth |
|-------|------|------|
| `/` | Home | Dummy login UI |
| `/plan` | Trip Planner | Open (CTA from Home) |
| `/results` | AI Travel Planner | Requires trip data in context |

React Router v7 with `TripContext` persisting form data across navigation.

---

## 7. Reusable Component Inventory

### Layout & Common
- `GlassPanel` — glassmorphism container
- `Button` — primary, secondary, ghost variants
- `Card` — rounded, soft shadow
- `Input`, `Select`, `DatePicker`
- `Skeleton` — loading placeholders
- `Badge`, `Chip` — interests, tags
- `Carousel` — flights & hotels
- `ErrorBanner`, `EmptyState`
- `LoadingOverlay`

### Auth (Dummy)
- `LoginCard` — email/password + Google button (non-functional)
- `GoogleButton` — styled placeholder

### Trip Planner
- `TripForm` — all trip detail fields
- `InterestPicker` — multi-select chips
- `ValidationMessage` — inline errors
- `TripSummaryBar` — sticky header on results page

### Results (12 sections)
- `WeatherSection` + `WeatherDayCard`
- `FlightsSection` + `FlightCard` + `FlightCarousel`
- `HotelsSection` + `HotelCard` + `HotelCarousel`
- `ActivitiesSection` + `ActivityCard`
- `PlacesSection` + `PlaceCard`
- `OptimizerSection` — flagship feature highlight
- `ItinerarySection` + `DayTimeline`
- `BudgetSection` + `BudgetChart` (nice-to-have)
- `PackingSection` + `ChecklistItem`
- `SummarySection`
- `RestaurantsSection`
- `LocalInfoSection`
- `MapSection` — Leaflet map with markers

### Features
- `FavoritesButton` — heart toggle (localStorage)
- `RecentSearches` — dropdown/panel on Home
- `ThemeToggle` — dark mode (nice-to-have)

---

## 8. Validation Rules

| Field | Rules |
|-------|-------|
| `fromDate` | Required, not in past |
| `toDate` | Required, ≥ fromDate |
| `origin` | Required, ≠ destination |
| `destination` | Required |
| `travellers` | Integer ≥ 1, default 1 |
| `budget` | Number > 0 |
| `tripType` | Enum: solo, couple, family, friends, kids, elderly |
| `interests` | Array, min 1 selection recommended |

Client-side: real-time validation, disable submit until valid.  
Server-side: duplicate validation via `trip.validator.js`.

---

## 9. Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| API rate limit | Retry with backoff; return cached if available |
| Missing weather | Partial section + warning in `errors[]` |
| No hotels/flights | Empty array + friendly message + AI adjusts budget |
| Invalid destination | 400 with geocoding suggestions |
| Slow APIs | Promise.allSettled; don't block entire response |
| Groq failure | Fallback static messages; retry once |
| Network failure | Frontend retry button + toast |

---

## 10. UI/UX Design System (Tailwind)

### Color Palette
- **Primary:** Deep teal `#0D9488` → gradient to `#14B8A6`
- **Background:** Off-white `#FAFAFA` / dark `#0F172A`
- **Glass:** `bg-white/70 backdrop-blur-xl border border-white/20`
- **Text:** Slate scale

### Typography
- **Display:** `DM Sans` or `Inter` (Google Fonts)
- **Headings:** Semibold, tight tracking
- **Body:** Regular, relaxed line-height

### Motion
- Page transitions: fade + slide (150–300ms)
- Card hover: subtle lift + shadow
- Skeleton: pulse animation

### Responsive Breakpoints
- Mobile-first: `sm` 640, `md` 768, `lg` 1024, `xl` 1280

---

## 11. Local Storage (No Auth)

| Key | Data |
|-----|------|
| `bonvoyage_favorites` | Array of favorited trips/places |
| `bonvoyage_recent_searches` | Last 5 trip inputs |
| `bonvoyage_packing_checked` | Checked packing items |
| `bonvoyage_theme` | light / dark |

---

## 12. Development Scripts (Root)

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\"",
    "install:all": "npm install && npm install --prefix frontend && npm install --prefix backend",
    "build": "npm run build --prefix frontend"
  }
}
```

---

## 13. Phase Roadmap (Remaining)

| Phase | Scope |
|-------|-------|
| **2** | Project setup: Vite, Express, Tailwind, routing, env |
| **3** | Core UI: 3 pages, forms, validation, components |
| **4** | Backend: API clients, normalizers, validation |
| **5** | AI: Groq prompts, optimizer, itinerary |
| **6** | Advanced: favorites, recent searches, local info |
| **7** | Polish: a11y, skeletons, dark mode, error UX |

---

## 14. Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSS | Tailwind CSS | User preference; faster iteration |
| State | React Context + hooks | Sufficient without auth; no Redux overhead |
| Validation | Zod (backend) + custom (frontend) | Type-safe, composable |
| Caching | In-memory Node cache | Simple TTL for geocode/weather |
| Maps | Leaflet client-side | No backend needed; OSM tiles free |
| Monorepo | frontend/ + backend/ | Clear separation, single repo |

---

*Document version: 1.0 — Phase 1 complete*
