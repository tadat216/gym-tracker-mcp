"""
Authentication for Gym Tracker:
- create_jwt / require_auth: JWT helpers for the REST API
"""

import os
import time

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# ── Environment config ────────────────────────────────────────────────────────

AUTH_USERNAME = os.environ["AUTH_USERNAME"]
AUTH_PASSWORD = os.environ["AUTH_PASSWORD"]
JWT_SECRET = os.environ["JWT_SECRET"]

# ── REST API JWT helpers ──────────────────────────────────────────────────────

REST_TOKEN_EXPIRY = 24 * 60 * 60  # 24 hours

_bearer_scheme = HTTPBearer(auto_error=False)


def create_jwt(username: str) -> str:
    """Issue a JWT for REST API access (24h expiry)."""
    now = int(time.time())
    payload = {
        "sub": username,
        "exp": now + REST_TOKEN_EXPIRY,
        "iat": now,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> str:
    """FastAPI dependency — validates JWT Bearer token. Returns username."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
