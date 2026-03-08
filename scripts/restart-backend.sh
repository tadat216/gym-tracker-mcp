#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR/.."
BACKEND_DIR="$REPO_DIR/backend"
SESSION="backend"
BACKEND_PORT=8001
NGINX_CONF="$REPO_DIR/nginx.conf"

# Stop the tmux session process if it exists
if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux send-keys -t "$SESSION" C-c ""
  sleep 1
fi

# Kill anything still holding the backend port
if fuser "$BACKEND_PORT/tcp" &>/dev/null; then
  fuser -k "$BACKEND_PORT/tcp"
  sleep 1
fi

# Create the session if it doesn't exist, otherwise reuse it
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux new-session -d -s "$SESSION" -c "$BACKEND_DIR"
fi

tmux send-keys -t "$SESSION" "cd $BACKEND_DIR && API_PORT=$BACKEND_PORT uv run python api.py" Enter

echo "Backend restarting in tmux session '$SESSION' on port $BACKEND_PORT."

# Restart nginx with the project config (serves port 8000 → frontend + backend proxy)
# Use the project pidfile so we don't touch the system nginx
if [ -f /tmp/nginx.pid ]; then
  nginx -c "$NGINX_CONF" -s stop 2>/dev/null || true
  sleep 1
fi
nginx -c "$NGINX_CONF"
echo "Nginx started on port 8000 (config: $NGINX_CONF)."

echo "Run: tmux attach -t $SESSION"
