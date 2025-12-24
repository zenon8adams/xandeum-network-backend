# Xandeum Network Backend 🚀

A lightweight TypeScript Express backend for a [Xandeum analytics dashboard](https://google.com).

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
npm start
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



## 📡 API Reference (examples)

### **A detailed documentation of this project is present at the [frontend repository](https://github.com)**.

All API routes are mounted under `${API_PREFIX}` (default `/api/v1`).

- Root

  - GET `/` — Returns status, version, and `documentation` path.

- Health
  - GET `${API_PREFIX}/health/health`
  - Example:

```bash
curl -s http://localhost:3000/api/v1/health/health
```

- IP Lookup
  - GET `${API_PREFIX}/ip/lookup?ip=8.8.8.8`

```bash
curl "http://localhost:3000/api/v1/ip/lookup?ip=8.8.8.8"
```

- POST `${API_PREFIX}/ip/batch` — body: `{ "ips": ["8.8.8.8", "1.1.1.1"] }`

```bash
curl -X POST http://localhost:3000/api/v1/ip/batch \
  -H "Content-Type: application/json" \
  -d '{"ips":["8.8.8.8","1.1.1.1"]}'
```

- Pnode Routes
  - POST `${API_PREFIX}/pnode/check-batch` — batch pod accessibility checks
  - GET `${API_PREFIX}/pnode/accessibility/:podId` — cached pod status
  - GET `${API_PREFIX}/pnode/root` — aggregated root node info
  - GET `${API_PREFIX}/pnode/leaf` — leaf nodes info
  - GET `${API_PREFIX}/pnode/run-command/:command` — run pnode commands (e.g., `get-stats`, `get-pods`)
  - POST `${API_PREFIX}/pnode/generative/find-best-leaf-endpoint` — body `{ "prompt": "..." }`

Example:

```bash
curl -X POST http://localhost:3000/api/v1/pnode/generative/find-best-leaf-endpoint \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Find endpoints best for Europe with low latency"}'
```
