# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Association Adel Elouerif** — a full-stack humanitarian organization management system with three separate sub-applications:

1. **Frontend** (root) — React + Vite app containing both a public landing site and a professional staff portal
2. **Backend** (`backend/`) — Node.js + Express REST API + Socket.io server backed by MongoDB
3. **Personnel App** (`personnel-app/`) — Electron desktop app with local SQLite storage for offline use

## Commands

### Frontend (root directory)
```bash
npm install
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend (`backend/`)
```bash
npm install
npm run dev      # nodemon auto-reload at http://localhost:5000
npm start        # Production start
```

Backend requires a running MongoDB instance. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`, `JWT_SECRET`, and `PORT`.

### Personnel App (`personnel-app/`)
```bash
npm install
npm run dev      # Vite dev server + Electron (concurrent)
npm run package  # Build Windows .exe installer → dist-electron/
```

No test suite or linting is configured in any sub-project.

## Architecture

### Frontend dual-mode design
`src/AppRouter.jsx` splits routing into two surfaces:
- **Public site** (`src/App.jsx`) — landing page (hero, services, contact) served to unauthenticated visitors
- **Professional portal** (`src/professional/ProfessionalDashboard.jsx`) — admin/staff management interface, protected by JWT

Authentication stores `professionalToken` and `professionalUser` in `localStorage`. The Axios instance in `src/services/api.js` auto-injects the bearer token and detects the correct base URL (`localhost:5000` locally, same origin on Vercel).

### Backend structure
```
backend/
  server.js          # Express + Socket.io setup, MongoDB connect, CORS config
  routes/            # 20+ route files, each mounted under /api/<name>
  controllers/       # Business logic handlers (6 controllers)
  models/            # 18 Mongoose schemas
  middleware/        # auth.js (JWT verify), upload.js (Multer)
  services/          # aiService.js (OpenAI integration)
  utils/             # auditLogger.js, generateToken.js, notificationHelper.js
  uploads/           # Static files served from /uploads
```

Backend uses **CommonJS** (`require`/`module.exports`). Frontend uses **ES modules** (`import`/`export`).

DNS is forced to `8.8.8.8` / `1.1.1.1` in `server.js` to ensure MongoDB Atlas SRV lookups work on restricted networks.

### Real-time (Socket.io)
The backend creates per-user rooms named `user:${userId}`. Events: `message:send`, `typing:start`, `typing:stop`, `message:read`, `user:online`. Notifications are written to MongoDB when socket events fire.

### Electron personnel app
`personnel-app/electron/main.js` — Main process; initialises SQL.js in-memory SQLite and exposes IPC handlers.  
`personnel-app/electron/preload.js` — Context bridge exposing `window.electronAPI` to renderer.  
Renderer pages live in `personnel-app/src/`.

### i18n
Three locales under `src/locales/`: `ar.json`, `fr.json`, `en.json`. Configured in `src/i18n.js` using `i18next` + `i18next-browser-languagedetector`.

### Key environment variables
| Variable | Location | Purpose |
|---|---|---|
| `VITE_API_URL` | `.env` (root) | Backend URL used as fallback |
| `MONGODB_URI` | `backend/.env` | MongoDB connection string |
| `JWT_SECRET` | `backend/.env` | Token signing secret |
| `FRONTEND_URL` | `backend/.env` | Allowed CORS origin in production |
| `PORT` | `backend/.env` | Backend port (default 5000) |

### Deployment
- Frontend → Vercel (`vercel.json` at root)
- Backend → Vercel or Docker (`backend/vercel.json`, `backend/Dockerfile`)
- In production, the frontend and backend can share the same Vercel origin; `src/services/api.js` uses `window.location.origin` as the API base when not on localhost.
