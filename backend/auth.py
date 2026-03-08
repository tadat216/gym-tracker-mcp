"""
Authentication for Gym Tracker:
- GymTrackerOAuthProvider: FastMCP OAuth 2.1 provider for claude.ai MCP connections
- create_jwt / require_auth: JWT helpers for the REST API
"""

import os
import secrets
import time

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from mcp.server.auth.provider import (
    AccessToken,
    AuthorizationCode,
    AuthorizationParams,
    RefreshToken,
    TokenError,
    construct_redirect_uri,
)
from mcp.shared.auth import OAuthClientInformationFull, OAuthToken

from fastmcp.server.auth import OAuthProvider
from fastmcp.server.auth.auth import ClientRegistrationOptions, RevocationOptions

# ── Environment config ────────────────────────────────────────────────────────

MCP_CLIENT_ID = os.environ["MCP_CLIENT_ID"]
MCP_CLIENT_SECRET = os.environ["MCP_CLIENT_SECRET"]
AUTH_USERNAME = os.environ["AUTH_USERNAME"]
AUTH_PASSWORD = os.environ["AUTH_PASSWORD"]
JWT_SECRET = os.environ["JWT_SECRET"]

# ── Token expiry ──────────────────────────────────────────────────────────────

MCP_TOKEN_EXPIRY = 30 * 24 * 60 * 60   # 30 days (long-lived for MCP)
REST_TOKEN_EXPIRY = 24 * 60 * 60        # 24 hours for REST

# ── GymTrackerOAuthProvider ───────────────────────────────────────────────────


class GymTrackerOAuthProvider(OAuthProvider):
    """
    Single-user OAuth 2.1 provider for the Gym Tracker MCP server.

    - One pre-registered client (MCP_CLIENT_ID / MCP_CLIENT_SECRET from env)
    - Auto-approves the authorization step — no interactive login form
    - Access tokens are opaque secrets stored in memory
    - No dynamic client registration (pre-configured client only)
    """

    def __init__(self, base_url: str):
        super().__init__(
            base_url=base_url,
            # Disable dynamic client registration — only our pre-registered client
            client_registration_options=ClientRegistrationOptions(enabled=False),
            revocation_options=RevocationOptions(enabled=True),
        )
        # In-memory stores (single user, single process — fine for personal use)
        self._auth_codes: dict[str, AuthorizationCode] = {}
        self._access_tokens: dict[str, AccessToken] = {}
        self._refresh_tokens: dict[str, RefreshToken] = {}

        # The one pre-registered OAuth client
        self._client = OAuthClientInformationFull(
            client_id=MCP_CLIENT_ID,
            client_secret=MCP_CLIENT_SECRET,
            redirect_uris=["https://claude.ai/api/mcp/auth_callback", "https://claude.ai/oauth/callback", "http://localhost"],
            grant_types=["authorization_code", "refresh_token"],
            response_types=["code"],
        )

    # ── OAuthAuthorizationServerProvider protocol ─────────────────────────────

    async def get_client(self, client_id: str) -> OAuthClientInformationFull | None:
        if client_id == MCP_CLIENT_ID:
            return self._client
        return None

    async def register_client(self, client_info: OAuthClientInformationFull) -> None:
        # DCR is disabled; this should never be called
        raise NotImplementedError("Dynamic client registration is disabled")

    async def authorize(
        self, client: OAuthClientInformationFull, params: AuthorizationParams
    ) -> str:
        """Auto-approve: issue an auth code immediately and redirect back to client.

        No login form — for a personal single-user server the client_id/secret
        is sufficient; the secret is required again at the token exchange step.
        """
        code = secrets.token_urlsafe(32)
        auth_code = AuthorizationCode(
            code=code,
            client_id=client.client_id or MCP_CLIENT_ID,
            redirect_uri=params.redirect_uri,
            redirect_uri_provided_explicitly=params.redirect_uri_provided_explicitly,
            scopes=params.scopes or [],
            expires_at=time.time() + 5 * 60,  # 5 min
            code_challenge=params.code_challenge,
        )
        self._auth_codes[code] = auth_code
        return construct_redirect_uri(
            str(params.redirect_uri), code=code, state=params.state
        )

    async def load_authorization_code(
        self, client: OAuthClientInformationFull, authorization_code: str
    ) -> AuthorizationCode | None:
        code = self._auth_codes.get(authorization_code)
        if code and code.expires_at > time.time():
            return code
        return None

    async def exchange_authorization_code(
        self, client: OAuthClientInformationFull, authorization_code: AuthorizationCode
    ) -> OAuthToken:
        if authorization_code.code not in self._auth_codes:
            raise TokenError("invalid_grant", "Authorization code not found or already used")
        del self._auth_codes[authorization_code.code]

        access_token = secrets.token_urlsafe(48)
        refresh_token = secrets.token_urlsafe(48)
        expires_at = int(time.time() + MCP_TOKEN_EXPIRY)

        self._access_tokens[access_token] = AccessToken(
            token=access_token,
            client_id=client.client_id or MCP_CLIENT_ID,
            scopes=authorization_code.scopes,
            expires_at=expires_at,
        )
        self._refresh_tokens[refresh_token] = RefreshToken(
            token=refresh_token,
            client_id=client.client_id or MCP_CLIENT_ID,
            scopes=authorization_code.scopes,
        )

        return OAuthToken(
            access_token=access_token,
            token_type="Bearer",
            expires_in=MCP_TOKEN_EXPIRY,
            refresh_token=refresh_token,
            scope=" ".join(authorization_code.scopes),
        )

    async def load_access_token(self, token: str) -> AccessToken | None:
        t = self._access_tokens.get(token)
        if t and (t.expires_at is None or t.expires_at > time.time()):
            return t
        return None

    async def load_refresh_token(
        self, client: OAuthClientInformationFull, refresh_token: str
    ) -> RefreshToken | None:
        return self._refresh_tokens.get(refresh_token)

    async def exchange_refresh_token(
        self,
        client: OAuthClientInformationFull,
        refresh_token: RefreshToken,
        scopes: list[str],
    ) -> OAuthToken:
        # Remove old refresh token
        self._refresh_tokens.pop(refresh_token.token, None)

        new_access = secrets.token_urlsafe(48)
        new_refresh = secrets.token_urlsafe(48)
        expires_at = int(time.time() + MCP_TOKEN_EXPIRY)
        used_scopes = scopes or refresh_token.scopes

        self._access_tokens[new_access] = AccessToken(
            token=new_access,
            client_id=client.client_id or MCP_CLIENT_ID,
            scopes=used_scopes,
            expires_at=expires_at,
        )
        self._refresh_tokens[new_refresh] = RefreshToken(
            token=new_refresh,
            client_id=client.client_id or MCP_CLIENT_ID,
            scopes=used_scopes,
        )

        return OAuthToken(
            access_token=new_access,
            token_type="Bearer",
            expires_in=MCP_TOKEN_EXPIRY,
            refresh_token=new_refresh,
            scope=" ".join(used_scopes),
        )

    async def revoke_token(self, token: AccessToken | RefreshToken) -> None:
        if isinstance(token, AccessToken):
            self._access_tokens.pop(token.token, None)
        else:
            self._refresh_tokens.pop(token.token, None)


# ── REST API JWT helpers ──────────────────────────────────────────────────────

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
