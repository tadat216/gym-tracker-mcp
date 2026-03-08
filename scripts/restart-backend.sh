#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
SESSION="backend"
PORT=8000

# Stop the tmux session process if it exists
if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux send-keys -t "$SESSION" C-c ""
  sleep 1
fi

# Kill anything still holding the port
if fuser "$PORT/tcp" &>/dev/null; then
  fuser -k "$PORT/tcp"
  sleep 1
fi

# Create the session if it doesn't exist, otherwise reuse it
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux new-session -d -s "$SESSION" -c "$BACKEND_DIR"
fi

tmux send-keys -t "$SESSION" "cd $BACKEND_DIR && uv run python api.py" Enter

echo "Backend restarting in tmux session '$SESSION' on port $PORT."
echo "Run: tmux attach -t $SESSION"
