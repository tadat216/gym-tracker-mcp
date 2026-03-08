# Auth Design — Gym Tracker MCP

**Date:** 2026-03-08
**Scope:** Single-user authentication for MCP server (claude.ai) and REST API (React frontend)

---

## Problem

The app is publicly accessible with no authentication. The MCP server needs OAuth 2.0 so claude.ai can connect via its "OAuth Client ID / Secret" settings. The REST API needs JWT protection for the React frontend.

## Goals

- MCP server: OAuth 2.0 authorization code flow — claude.ai authenticates and holds tokens long-term
- REST API: JWT bearer tokens — frontend logs in once, stores token in localStorage
- Single user: no multi-user scoping; all data is shared under one account
- All secrets in `.env` files (gitignored), documented in `.env.example`

---

## Architecture

```
claude.ai ──OAuth 2.0──▶ /oauth/* endpoints (FastMCP OAuthProvider)
                              ↳ login form at /oauth/authorize
                              ↳ issues JWT access tokens
                              ↳ client: MCP_CLIENT_ID / MCP_CLIENT_SECRET

Browser ──JWT Bearer──▶ /api/* routes (FastAPI)
                              ↳ POST /api/auth/login → JWT
                              ↳ all other routes: Depends(require_auth)
                              ↳ credentials: AUTH_USERNAME / AUTH_PASSWORD
```

---

## Environment Variables

### `backend/.env.example`

```
MCP_CLIENT_ID=gym-tracker-mcp
MCP_CLIENT_SECRET=change-me-to-a-random-secret
AUTH_USERNAME=admin
AUTH_PASSWORD=change-me-to-a-strong-password
JWT_SECRET=change-me-to-a-random-secret
```

### `frontend/.env.example`

```
VITE_USERNAME=admin
VITE_PASSWORD=change-me-to-match-backend
```

---

## Backend Design

### New: `backend/auth.py`

Contains:
1. `GymTrackerOAuthProvider(OAuthProvider)` — custom FastMCP OAuth provider
   - Pre-registers one static OAuth client (`MCP_CLIENT_ID` / `MCP_CLIENT_SECRET`)
   - Serves HTML login form; validates against `AUTH_USERNAME` / `AUTH_PASSWORD`
   - Issues signed JWTs (`JWT_SECRET`, HS256, 30-day expiry for MCP)
2. `require_auth` — FastAPI dependency that validates JWT Bearer token
3. `create_token(username)` — helper to issue a JWT for REST login

### Modified: `backend/api.py`

- Load `.env` via `python-dotenv` at startup
- Pass `auth=GymTrackerOAuthProvider(...)` to the FastMCP instance
- Add `POST /api/auth/login` (unauthenticated)
- Add `dependencies=[Depends(require_auth)]` to all router `include_router` calls

### New Python deps

- `pyjwt` — JWT creation and verification
- `python-dotenv` — `.env` loading

---

## Frontend Design

### New: `frontend/src/contexts/auth-context.tsx`

- `AuthContext` with `token`, `isAuthenticated`, `login(username, password)`, `logout()`
- Persists JWT to `localStorage`; reads it on mount

### New: `frontend/src/components/auth/login-form/`

Follows the `frontend-component-structure` skill pattern:
- `types.ts` — props types
- `hooks.ts` — login mutation, form state; reads `VITE_USERNAME` / `VITE_PASSWORD` as default values
- `views/main.tsx` — username/password form UI
- `container.tsx` — wires hook → view; redirects to `/` on success

### Modified: `frontend/src/main.tsx`

- Wrap with `BrowserRouter` + `AuthProvider`
- Route `/login` → `LoginFormContainer`
- Route `/*` → protected: redirect to `/login` if not authenticated

### Modified: `frontend/src/lib/axios-instance.ts`

- Add request interceptor: attach `Authorization: Bearer <token>` from localStorage
- Add response interceptor: on 401, redirect to `/login` and clear token

### New Frontend dep

- `react-router-dom` — routing

---

## Data Flow

### MCP (claude.ai first connection)

1. User adds MCP URL in claude.ai with `MCP_CLIENT_ID` + `MCP_CLIENT_SECRET`
2. claude.ai hits `/.well-known/oauth-authorization-server`
3. Redirects to `/oauth/authorize` — login form shown
4. User submits credentials → server issues authorization code
5. claude.ai exchanges code for JWT access token at `/oauth/token`
6. claude.ai stores token; subsequent MCP calls include `Authorization: Bearer <token>`

### REST (frontend login)

1. Frontend shows login form (pre-filled from `VITE_USERNAME` / `VITE_PASSWORD`)
2. `POST /api/auth/login` with credentials → returns JWT (24h expiry)
3. JWT stored in localStorage; axios interceptor attaches it to all requests
4. On 401, auto-redirect to `/login`

---

## After Backend Changes

Once backend auth endpoints are live, regenerate frontend API hooks:

```bash
curl http://localhost:8000/api/openapi.json > frontend/openapi.json
cd frontend && npm run generate
```

---

## Out of Scope

- Multi-user data isolation (no user_id added to DB tables)
- Token refresh (MCP tokens are long-lived; REST tokens redirect to login on expiry)
- Rate limiting or brute-force protection (personal app)
