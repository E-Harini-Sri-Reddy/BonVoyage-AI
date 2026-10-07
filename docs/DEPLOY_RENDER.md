# Deploy BonVoyage AI on Render

Recommended setup: **one Web Service** that builds the React app and serves it from Express (same origin → cookies & `/api` just work).

---

## 1. Before you start

1. Push this repo to **GitHub** (or GitLab / Bitbucket).
2. In **MongoDB Atlas → Network Access**, allow `0.0.0.0/0` (or Render’s IPs) so Render can connect.
3. In **Google Cloud Console → APIs & Services → Credentials → your OAuth Client**:
   - **Authorized JavaScript origins**: add your Render URL, e.g. `https://bonvoyage-ai.onrender.com`
   - **Authorized redirect URIs**: same origin is enough for GIS button login (no redirect URI required for the One Tap / button ID token flow, but origins must match).

---

## 2. Create the Web Service (Dashboard)

1. Go to [https://dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**.
2. Connect your GitHub repo **BonVoyage AI**.
3. Settings:

| Field | Value |
|--------|--------|
| **Name** | `bonvoyage-ai` (or any name) |
| **Region** | Closest to you |
| **Runtime** | `Node` |
| **Root Directory** | *(leave empty — use repo root)* |
| **Build Command** | `npm run render-build` *(installs frontend devDeps so Vite can build even when NODE_ENV=production)* |
| **Start Command** | `npm start` |
| **Instance type** | Free (or paid if you need fewer cold starts) |

4. Open **Advanced** → add environment variables (table below).
5. Click **Create Web Service**.
6. After the first deploy, copy the URL (e.g. `https://bonvoyage-ai.onrender.com`).
7. Set / update:

```text
CORS_ORIGIN=https://bonvoyage-ai.onrender.com
CLIENT_URL=https://bonvoyage-ai.onrender.com
```

8. **Manual Deploy → Clear build cache & deploy** once more so `VITE_GOOGLE_CLIENT_ID` is baked into the frontend build.

---

## 3. Environment variables (Render Dashboard)

### Required

| Variable | Example / notes |
|----------|------------------|
| `NODE_ENV` | `production` |
| `GROQ_API_KEY` | from [console.groq.com](https://console.groq.com) |
| `OPENWEATHER_API_KEY` | from OpenWeather |
| `GEOAPIFY_API_KEY` | from Geoapify |
| `RAPIDAPI_KEY` | from RapidAPI (Sky Scrapper) |
| `MONGODB_URI` | `mongodb+srv://USER:PASS@cluster.mongodb.net/` |
| `MONGODB_DB_NAME` | `bonvoyage` |
| `JWT_SECRET` | long random string (Render can auto-generate) |
| `GOOGLE_CLIENT_ID` | same Google OAuth client ID (backend verifies tokens) |
| `VITE_GOOGLE_CLIENT_ID` | **same value** as `GOOGLE_CLIENT_ID` (must be present at **build** time) |
| `CORS_ORIGIN` | `https://YOUR-SERVICE.onrender.com` |
| `CLIENT_URL` | `https://YOUR-SERVICE.onrender.com` |
| `VITE_API_BASE_URL` | `/api` (same-origin; recommended) |

### Optional

| Variable | Default | Notes |
|----------|---------|--------|
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | |
| `RAPIDAPI_HOST` | `sky-scrapper.p.rapidapi.com` | |
| `JWT_EXPIRES_IN` | `7d` | |
| `CACHE_TTL_SECONDS` | `3600` | |
| `COOKIE_SAMESITE` | `lax` | Use `none` only if frontend & API are on **different** domains |
| `PORT` | set by Render | Do **not** hardcode; Render injects `PORT` |

`PORT` is provided automatically by Render — you do not need to add it.

---

## 4. Blueprint deploy (optional)

If the repo includes `render.yaml`:

1. Dashboard → **New +** → **Blueprint**
2. Select the repo
3. Fill in the `sync: false` secrets when prompted
4. Apply

Then set `CORS_ORIGIN` / `CLIENT_URL` to the live service URL and redeploy.

---

## 5. Alternative: separate Static Site + API

Only if you want frontend and API on different Render URLs.

1. **Web Service** (API only)  
   - Root Directory: `backend`  
   - Build: `npm install`  
   - Start: `npm start`  
   - Env: all backend vars; `CORS_ORIGIN=https://your-frontend.onrender.com`  
   - `COOKIE_SAMESITE=none`

2. **Static Site** (frontend)  
   - Root Directory: `frontend`  
   - Build: `npm install && npm run build`  
   - Publish directory: `dist`  
   - Env:  
     - `VITE_API_BASE_URL=https://your-api.onrender.com/api`  
     - `VITE_GOOGLE_CLIENT_ID=...`

Same-origin (section 2) is simpler for auth cookies.

---

## 6. Verify

| Check | URL |
|--------|-----|
| Health | `https://YOUR-SERVICE.onrender.com/api/health` |
| App | `https://YOUR-SERVICE.onrender.com/` |
| API status | `https://YOUR-SERVICE.onrender.com/api/auth/status` |

---

## 7. Free-tier caveats

- **Cold starts**: free services sleep after ~15 minutes; first request can take 30–60s.
- **Long trip plans**: planning can exceed free HTTP timeouts; if `/api/trip/plan` fails with 502/504, upgrade the plan or shorten trips.
- **Sky Scrapper / Groq quotas** still apply in production.

---

## 8. Local vs Render cheat sheet

| Local | Render |
|--------|--------|
| `npm run dev` (5173 + 5000) | One URL serves UI + `/api` |
| `backend/.env` file | Dashboard Environment |
| Vite proxy `/api` → 5000 | Express serves `/api` + `frontend/dist` |
