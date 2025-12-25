# Xandeum Network Backend 🚀

A TypeScript + Express backend that powers the [Xandeum](https://www.xandeum.network/) analytics dashboard frontend in this [repo](https://github.com/zenon8adams/xandeum-dashboard.git).

**Key Features**

- **Interactive network view:** A dedicated _Network_ page with a D3-based cluster graph showing pNodes and the versions they’re running.
- **Table & world views:** Separate pages to explore all pNodes either in a structured table or plotted on a global map.
- **Node shell:** An in-app shell that lets you run commands against public pNode endpoints to fetch live stats and status directly from the UI.
- **Sidebar details:** Rich, contextual info for selected nodes, including storage, uptime, location, public endpoint, node status, and credit ranking.
- **AI-powered chat:** Explore network insights and metrics using simple, natural-language queries.

---

## 🔧 Quick Start

1. Clone and install dependencies:

```bash
git clone <repo-url>
cd xandeum-network-backend
yarn install
```

2. Create a `.env` file (see sample below) and set required environment variables.

3. Run in development (watch + inspector):

```bash
yarn dev
```

4. Build and run production:

```bash
yarn build
yarn start
```

---

## ⚙️ Project Structure (high-level)

- `src/`
  - `app.ts` — Express setup (middleware, routes, rate limiting)
  - `server.ts` — server bootstrap and graceful shutdown
  - `config/` — env validation (Zod) and MongoDB connection
  - `routes/` — `health`, `ip`, and `pnode` endpoints
  - `controllers/` — handlers (IP lookups, pnode, generative AI)
  - `modules/` — integrations (generative AI MCP, pnode helpers, HTTP client)
  - `models/` — Mongoose models used for caching
  - `middleware/` — validation, error handling, async catcher
  - `utils/` — logger (winston), morgan stream, helpers

---

## 📋 Environment Variables

The app uses `dotenv` and validates expected variables at startup. Required variables:

- `NODE_ENV` — `development` | `production` | `test` (default: `development`)
- `PORT` — port number (default: `4500`)
- `API_PREFIX` — API prefix (default: `/api/v1`)
- `CORS_ORIGIN` — CORS origin (default: `*`)
- `RATE_LIMIT_WINDOW_MS` — window in ms for rate limiter (default 900000)
- `RATE_LIMIT_MAX` — max requests per window (default 100)
- `MONGODB_URI` — **required** MongoDB connection string
- `REFERENCE_PNODE_URL` — your Xandeum pNode endpoint URL (testing used [Goole's Gemini AI](https://gemini.google.com/))

---

## 🚀 Scripts

- `npm run dev` — Run with `tsx` in watch+inspect mode (development)
- `npm run build` — Compile TypeScript (produces `dist/`)
- `npm start` — Start production server (after build)
- `npm run type-check` — Run TypeScript type check (`tsc --noEmit`)

---
