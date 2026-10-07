# BonVoyage AI

AI-powered travel planning web application — portfolio-ready full stack project with React, Express, and Groq AI.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express, Zod, Helmet, CORS |
| AI | Groq API |
| APIs | OpenWeather, Geoapify, Sky Scrapper (RapidAPI) |
| Maps | Leaflet + OpenStreetMap |

## Project Structure

```
BonVoyage AI/
├── frontend/          # React SPA
├── backend/           # Express API
├── docs/              # Architecture docs
└── package.json       # Root dev scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install all dependencies (root + frontend + backend)
npm run install:all

# REQUIRED: Create backend/.env with your API keys
cp backend/.env.example backend/.env
# Edit backend/.env — keys go here, NOT in .env.example

# Optional: frontend env (defaults work with Vite proxy)
cp frontend/.env.example frontend/.env
```

### Verify API Keys

```bash
cd backend && node scripts/diagnose-apis.js
```

Or visit `http://localhost:5000/api/health/apis` after starting the server.

### Development

```bash
# Start both frontend (5173) and backend (5000)
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

### Build

```bash
npm run build
```

## API Keys Required (Phase 4+)

| Service | Env Variable | Get Key |
|---------|-------------|---------|
| Groq | `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| OpenWeather | `OPENWEATHER_API_KEY` | [openweathermap.org](https://openweathermap.org/api) |
| Geoapify | `GEOAPIFY_API_KEY` | [geoapify.com](https://www.geoapify.com) |
| Sky Scrapper | `RAPIDAPI_KEY` | [rapidapi.com](https://rapidapi.com) |

## Development Phases

- [x] Phase 1 — Architecture & Planning
- [x] Phase 2 — Project Setup
- [x] Phase 3 — Core UI
- [x] Phase 4 — Backend & API Integration
- [x] Phase 5 — AI Features
- [x] Phase 6 — Advanced Features
- [ ] Phase 7 — Polish & Testing

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for full architecture details.

## License

MIT — Portfolio project
