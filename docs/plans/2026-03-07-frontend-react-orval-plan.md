# Frontend React + Orval Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold a React 19 + TypeScript frontend in `frontend/` with orval auto-generating TanStack Query v5 hooks from the FastAPI OpenAPI spec, served via nginx in production.

**Architecture:** Vite dev server (port 5173) proxies `/api/*` and `/mcp` to the FastAPI backend (port 8000 in dev, 8001 in prod). In production, nginx listens on port 8000, serves the built `frontend/dist/` as static files, and reverse-proxies API traffic to FastAPI on port 8001. Orval reads a committed `frontend/openapi.json` snapshot and generates typed axios + TanStack Query hooks into `frontend/src/api/` (gitignored).

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query v5, axios, orval, nginx

**Design doc:** `docs/plans/2026-03-07-frontend-react-orval-design.md`

---

## Prerequisites

- Node.js >= 18 installed (`node -v`)
- Backend running on port 8000 for spec export step (Task 3)
- `npm` available

---

## Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `frontend/` (scaffolded by Vite CLI)

**Step 1: Scaffold the project**

From repo root:

```bash
npm create vite@latest frontend -- --template react-ts
```

When prompted, select:
- Framework: React
- Variant: TypeScript

**Step 2: Verify scaffold succeeded**

```bash
ls frontend/
# Expected: index.html  package.json  public/  src/  tsconfig.json  vite.config.ts
```

**Step 3: Install base dependencies**

```bash
cd frontend && npm install
```

**Step 4: Verify dev server starts**

```bash
npm run dev
# Expected: "VITE ready" on port 5173
# Press Ctrl+C to stop
```

**Step 5: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: scaffold Vite React TypeScript frontend"
```

---

## Task 2: Install and configure TanStack Query + axios

**Files:**
- Modify: `frontend/package.json` (via npm install)
- Modify: `frontend/src/main.tsx`

**Step 1: Install dependencies**

```bash
cd frontend
npm install @tanstack/react-query @tanstack/react-query-devtools axios
```

**Step 2: Wrap the app with QueryClientProvider**

Open `frontend/src/main.tsx`. Replace the entire file content with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
```

**Step 3: Verify the app still compiles**

```bash
npm run build
# Expected: build output in frontend/dist/, no errors
```

**Step 4: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: add TanStack Query v5 provider and axios"
```

---

## Task 3: Configure Vite proxy for local development

**Files:**
- Modify: `frontend/vite.config.ts`

**Step 1: Update vite.config.ts**

Open `frontend/vite.config.ts` and replace with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/mcp': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
```

**Step 2: Verify proxy works (backend must be running)**

Start the backend in a separate terminal:
```bash
cd backend && uv run api.py
```

Then in the frontend directory:
```bash
npm run dev
```

Open browser at `http://localhost:5173` — the app loads. In a separate tab, confirm `http://localhost:5173/api/workouts` returns JSON from the backend (not a 404 or CORS error).

**Step 3: Commit**

```bash
cd ..
git add frontend/vite.config.ts
git commit -m "feat: configure Vite dev proxy for /api and /mcp"
```

---

## Task 4: Install orval and configure codegen

**Files:**
- Create: `frontend/orval.config.ts`
- Modify: `frontend/package.json` (via npm install + scripts)

**Step 1: Install orval**

```bash
cd frontend
npm install --save-dev orval
```

**Step 2: Create orval config**

Create `frontend/orval.config.ts`:

```ts
import { defineConfig } from 'orval'

export default defineConfig({
  gymTracker: {
    input: './openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/api',
      schemas: './src/api/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customAxiosInstance',
        },
      },
    },
  },
})
```

**Explanation of options:**
- `mode: 'tags-split'` — one file per FastAPI router tag (e.g. `workouts.ts`, `exercises.ts`)
- `target: './src/api'` — generated hooks land here
- `schemas: './src/api/model'` — generated TypeScript types land here
- `client: 'react-query'` — generates `useQuery`/`useMutation` hooks
- `httpClient: 'axios'` — uses axios for requests
- `clean: true` — deletes stale generated files before regenerating
- `mutator` — points to a custom axios instance file (created in Task 5) for base URL and auth

**Step 3: Add codegen npm script**

In `frontend/package.json`, add to the `"scripts"` section:

```json
"generate": "orval"
```

**Step 4: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: install orval and add codegen config"
```

---

## Task 5: Create custom axios instance

**Files:**
- Create: `frontend/src/api/axios-instance.ts`

Orval's mutator lets us inject a base URL and headers into every request. Without this, axios would use the full URL from the spec, which breaks the Vite proxy setup.

**Step 1: Create the file**

Create `frontend/src/api/axios-instance.ts`:

```ts
import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: '',  // empty = relative URLs, Vite proxy handles routing in dev
})

// orval mutator signature: (config) => Promise<data>
export const customAxiosInstance = <T>(config: Parameters<typeof axiosInstance>[0]): Promise<T> => {
  return axiosInstance(config).then((res) => res.data)
}
```

**Why relative baseURL?** In dev, Vite proxies `/api/*` to the backend. In prod, nginx does the same. Relative URLs work in both environments without any env var needed.

**Step 2: Commit**

```bash
git add frontend/src/api/axios-instance.ts
git commit -m "feat: add custom axios instance for orval mutator"
```

---

## Task 6: Export OpenAPI spec and run codegen

**Files:**
- Create: `frontend/openapi.json` (committed spec snapshot)
- Create: `frontend/src/api/` (generated, gitignored)

**Step 1: Start the backend**

```bash
cd backend && uv run api.py
# Backend running on http://127.0.0.1:8000
```

**Step 2: Export the OpenAPI spec**

In a separate terminal from repo root:

```bash
curl http://localhost:8000/openapi.json > frontend/openapi.json
```

Verify it's valid JSON:
```bash
cat frontend/openapi.json | python3 -m json.tool | head -20
# Expected: JSON with "openapi", "info", "paths" keys
```

**Step 3: Run orval codegen**

```bash
cd frontend && npm run generate
```

Expected output:
```
- gymTracker
  workouts.ts
  exercises.ts
  muscle-groups.ts
  workout-exercises.ts
  sets.ts
  model/
```

**Step 4: Verify generated files exist**

```bash
ls frontend/src/api/
# Expected: workouts.ts exercises.ts muscle-groups.ts workout-exercises.ts sets.ts model/ axios-instance.ts
```

**Step 5: Verify TypeScript compiles**

```bash
cd frontend && npm run build
# Expected: no TypeScript errors, build succeeds
```

**Step 6: Gitignore the generated output, keep the spec**

Add to `frontend/.gitignore` (create if missing, or append):

```
# orval generated output
src/api/*.ts
src/api/model/
!src/api/axios-instance.ts
```

> Note: `axios-instance.ts` is hand-written and must NOT be gitignored.

**Step 7: Commit**

```bash
cd ..
git add frontend/openapi.json frontend/.gitignore
git commit -m "feat: add committed OpenAPI spec snapshot and gitignore generated api files"
```

---

## Task 7: Add nginx production config

**Files:**
- Create: `nginx.conf`

**Step 1: Create nginx.conf at repo root**

```nginx
server {
    listen 8000;

    # Proxy API traffic to FastAPI (internal port 8001)
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy MCP traffic to FastAPI
    location /mcp {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # MCP uses SSE/streaming — disable buffering
        proxy_buffering off;
        proxy_cache off;
    }

    # Serve React SPA
    location / {
        root /path/to/gym-tracker-mcp/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

> Replace `/path/to/gym-tracker-mcp` with the actual absolute path on your server.

**Step 2: Document how to run in production**

In the same commit, note the production startup commands:

```bash
# Build frontend
cd frontend && npm run build

# Start FastAPI on internal port 8001
cd backend && MCP_PORT=8001 API_PORT=8001 uv run api.py &

# Start nginx with this config
nginx -c /path/to/gym-tracker-mcp/nginx.conf
```

**Step 3: Commit**

```bash
cd ..
git add nginx.conf
git commit -m "feat: add nginx production config for port 8000 unified serving"
```

---

## Task 8: Verify end-to-end codegen workflow

This task documents the ongoing workflow for regenerating hooks when the API changes. No code to write — just verify the full loop works.

**Step 1: Make a trivial API change** (e.g., add a comment to a router). Restart backend.

**Step 2: Re-export spec**

```bash
curl http://localhost:8000/openapi.json > frontend/openapi.json
```

**Step 3: Regenerate hooks**

```bash
cd frontend && npm run generate
```

**Step 4: Verify build still passes**

```bash
npm run build
```

**Step 5: Commit updated spec if API changed**

```bash
cd .. && git add frontend/openapi.json && git commit -m "chore: update openapi spec snapshot"
```

---

## Regenerating Hooks — Quick Reference

```bash
# 1. Start backend (if not running)
cd backend && uv run api.py

# 2. Export spec
curl http://localhost:8000/openapi.json > frontend/openapi.json

# 3. Regenerate
cd frontend && npm run generate

# 4. Commit the updated spec
git add openapi.json && git commit -m "chore: update openapi spec"
```

---

## Using Generated Hooks

After codegen, hooks are available like:

```tsx
import { useGetWorkouts, useCreateWorkout } from './api/workouts'

function WorkoutList() {
  const { data, isLoading } = useGetWorkouts({ last_n_days: 7 })

  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {data?.map(w => <li key={w.id}>{w.date}</li>)}
    </ul>
  )
}
```

All types are inferred from the OpenAPI spec — no manual type definitions needed.
