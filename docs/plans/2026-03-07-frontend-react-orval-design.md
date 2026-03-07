# Frontend React + Orval Design

**Date:** 2026-03-07
**Status:** Approved

## Overview

Add a React TypeScript frontend to the gym-tracker-mcp project. The frontend lives as a `frontend/` sibling to `backend/` in the same repo. Orval auto-generates TanStack Query hooks from the FastAPI OpenAPI spec so API types and hooks never need to be written by hand.

## Repo Structure

```
gym-tracker-mcp/
├── backend/          # FastAPI + MCP server
├── frontend/         # React + TypeScript (Vite)
│   ├── src/
│   │   └── api/      # orval-generated hooks & types (gitignored)
│   ├── openapi.json  # committed OpenAPI spec snapshot
│   └── orval.config.ts
├── nginx.conf        # production nginx config
└── docs/plans/
```

## Frontend Stack

| Tool | Purpose |
|------|---------|
| Vite | Build tool and dev server |
| React 19 + TypeScript | UI framework |
| TanStack Query v5 | Server state management (caching, refetching) |
| orval | Codegen: OpenAPI spec → typed hooks + axios calls |
| axios | HTTP client (orval default) |

## Orval Code Generation

Orval reads a **committed local spec file** (`frontend/openapi.json`) rather than hitting the live backend. This keeps codegen reproducible and usable without a running server.

**Workflow to regenerate hooks:**

```bash
# 1. Start the backend
cd backend && uv run api.py

# 2. Export the spec
curl http://localhost:8000/openapi.json > frontend/openapi.json

# 3. Regenerate hooks
cd frontend && npx orval
```

Generated output goes to `frontend/src/api/` and is gitignored — regenerated from the committed spec as needed.

## Dev Environment

```
Browser → Vite dev server :5173
                  │
          /api/* and /mcp → proxy → FastAPI :8000
```

Vite's built-in proxy (`vite.config.ts`) forwards `/api` and `/mcp` to the backend. No CORS issues, single origin from the browser's perspective.

## Production Environment

```
Browser → nginx :8000
              ├── /api/*  → FastAPI :8001 (internal)
              ├── /mcp    → FastAPI :8001 (internal)
              └── /*      → frontend/dist/ (static files)
```

- nginx listens on port `8000` — the only port exposed to clients
- FastAPI runs internally on port `8001`, never exposed directly
- `npm run build` outputs to `frontend/dist/`
- nginx serves the built static files and proxies API/MCP traffic

## nginx Config (production)

```nginx
server {
    listen 8000;

    # Proxy API and MCP to FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /mcp {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Serve React frontend (SPA fallback)
    location / {
        root /path/to/gym-tracker-mcp/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## Key Decisions

- **nginx over FastAPI static files** — nginx is purpose-built for serving static files; FastAPI stays focused on API logic
- **Local spec file** — committed `openapi.json` makes codegen reproducible without a running server
- **React 19** — stable, TanStack Query v5 and orval both support it
- **Port 8000 unified** — clients see only one port in both dev (Vite proxy) and prod (nginx)
