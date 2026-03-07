#!/usr/bin/env bash
set -euo pipefail

# Add local bin to PATH (where ngrok is installed)
export PATH="$HOME/.local/bin:$PATH"

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

if ! command -v ngrok &>/dev/null; then
  echo "ERROR: ngrok not found. Install it from https://ngrok.com/download"
  exit 1
fi

if ! command -v uv &>/dev/null; then
  echo "ERROR: uv not found. Install it from https://docs.astral.sh/uv/getting-started/installation/"
  exit 1
fi

if [ -z "${NGROK_AUTHTOKEN:-}" ]; then
  echo "ERROR: NGROK_AUTHTOKEN is not set."
  echo ""
  echo "  1. Sign up / log in at https://dashboard.ngrok.com"
  echo "  2. Copy your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "  3. Run:  export NGROK_AUTHTOKEN=<your-token>"
  echo "  4. Then re-run this script."
  exit 1
fi

# Configure ngrok authtoken
ngrok config add-authtoken "$NGROK_AUTHTOKEN" --log=false 2>/dev/null || true

# ---------------------------------------------------------------------------
# Start combined server (REST API + MCP)
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_HOST="${API_HOST:-127.0.0.1}"
API_PORT="${API_PORT:-8000}"

echo "Starting server on $API_HOST:$API_PORT ..."
API_HOST="$API_HOST" API_PORT="$API_PORT" uv run --directory "$SCRIPT_DIR" api.py &
SERVER_PID=$!

# Wait for the server to be ready
for i in $(seq 1 20); do
  if curl -sf "http://$API_HOST:$API_PORT/docs" -o /dev/null --max-time 1 2>/dev/null; then
    break
  fi
  sleep 0.5
done

# ---------------------------------------------------------------------------
# Start ngrok tunnel
# ---------------------------------------------------------------------------

echo "Starting ngrok tunnel to port $API_PORT ..."
ngrok http "$API_PORT" --log=stdout --log-format=json > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to establish the tunnel and retrieve the public URL
PUBLIC_URL=""
for i in $(seq 1 30); do
  sleep 0.5
  TUNNEL_INFO=$(curl -sf http://127.0.0.1:4040/api/tunnels 2>/dev/null || true)
  if [ -n "$TUNNEL_INFO" ]; then
    PUBLIC_URL=$(echo "$TUNNEL_INFO" | python3 -c "
import sys, json
data = json.load(sys.stdin)
tunnels = data.get('tunnels', [])
for t in tunnels:
    if t.get('proto') == 'https':
        print(t['public_url'])
        break
" 2>/dev/null || true)
    if [ -n "$PUBLIC_URL" ]; then
      break
    fi
  fi
done

# ---------------------------------------------------------------------------
# Cleanup on exit
# ---------------------------------------------------------------------------

cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$NGROK_PID" 2>/dev/null || true
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------------------
# Print connection info
# ---------------------------------------------------------------------------

if [ -z "$PUBLIC_URL" ]; then
  echo ""
  echo "WARNING: Could not retrieve ngrok public URL automatically."
  echo "Check the ngrok inspector at http://127.0.0.1:4040 to find your URL."
  echo "MCP endpoint will be: <ngrok-url>/mcp"
else
  echo ""
  echo "======================================================"
  echo "  Gym Tracker is running!"
  echo "======================================================"
  echo ""
  echo "  MCP endpoint:  $PUBLIC_URL/mcp"
  echo ""
  echo "  To connect in claude.ai:"
  echo "    1. Go to claude.ai → Settings → Integrations"
  echo "    2. Add a new integration with URL:"
  echo "       $PUBLIC_URL/mcp"
  echo ""
  echo "  REST API:      http://$API_HOST:$API_PORT"
  echo "  Swagger docs:  http://$API_HOST:$API_PORT/docs"
  echo ""
  echo "  ngrok inspector: http://127.0.0.1:4040"
  echo "======================================================"
fi

echo ""
echo "Press Ctrl+C to stop."
wait "$SERVER_PID"
