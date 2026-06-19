#!/usr/bin/env bash
# install.sh — set up the AiToEarn agentic runner CLIs: hermes, kanban, rss.
#
#   bash install.sh
#   source ~/.bashrc
#   export ANTHROPIC_API_KEY=sk-ant-...
#
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/agentic-runner"
HOME_DIR="${AITOEARN_HOME:-$HOME/.aitoearn}"
LIB_DIR="$HOME_DIR/lib"
BIN_DIR="$HOME_DIR/bin"
VENV_DIR="$HOME_DIR/venv"

echo "==> Installing AiToEarn agentic runner into $HOME_DIR"

# 1. Locate python3.
if ! command -v python3 >/dev/null 2>&1; then
  echo "install.sh: python3 is required but not found." >&2
  exit 1
fi

# 2. Create a virtualenv and install dependencies.
mkdir -p "$LIB_DIR" "$BIN_DIR"
if [ ! -d "$VENV_DIR" ]; then
  echo "==> Creating virtualenv"
  python3 -m venv "$VENV_DIR"
fi
echo "==> Installing Python dependencies (anthropic, feedparser)"
"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -r "$SRC_DIR/requirements.txt"

# 3. Copy the tool sources into the install dir so they run from anywhere.
echo "==> Installing CLIs: hermes, kanban, rss"
for tool in hermes kanban rss; do
  cp "$SRC_DIR/$tool.py" "$LIB_DIR/$tool.py"
  cat > "$BIN_DIR/$tool" <<EOF
#!/usr/bin/env bash
exec "$VENV_DIR/bin/python" "$LIB_DIR/$tool.py" "\$@"
EOF
  chmod +x "$BIN_DIR/$tool"
done

# 4. Put the bin dir on PATH via ~/.bashrc (idempotent).
MARKER="# >>> aitoearn agentic runner >>>"
if ! grep -qF "$MARKER" "$HOME/.bashrc" 2>/dev/null; then
  echo "==> Adding $BIN_DIR to PATH in ~/.bashrc"
  {
    echo ""
    echo "$MARKER"
    echo "export PATH=\"$BIN_DIR:\$PATH\""
    echo "# <<< aitoearn agentic runner <<<"
  } >> "$HOME/.bashrc"
else
  echo "==> PATH entry already present in ~/.bashrc"
fi

cat <<EOF

✓ Done. Next steps:

    source ~/.bashrc
    export ANTHROPIC_API_KEY=sk-ant-...

Then try:

    hermes run "summarize the README" --loop
    kanban --show
    rss add https://hnrss.org/frontpage && rss --digest

EOF
