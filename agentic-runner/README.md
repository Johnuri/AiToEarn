# AiToEarn Agentic Runner

A small toolkit of terminal CLIs that pair with the AiToEarn project:

| Command  | What it does                                                        |
| -------- | ------------------------------------------------------------------ |
| `hermes` | An agentic loop powered by Claude (`bash` + text-editor tools).    |
| `kanban` | A JSON-backed kanban board for the terminal.                       |
| `rss`    | Subscribe to feeds and build a digest, optionally summarized by AI.|

## Install

```bash
bash install.sh           # creates a venv, installs deps, adds CLIs to PATH
source ~/.bashrc
export ANTHROPIC_API_KEY=sk-ant-...
```

The installer copies the tools into `~/.aitoearn/` (override with `AITOEARN_HOME`),
creates a dedicated virtualenv, and adds `~/.aitoearn/bin` to your `PATH`.

## hermes — agentic loop

```bash
hermes run "task description"            # one agentic run with tools
hermes run "task description" --loop      # keep working until the agent reports DONE
hermes run "refactor utils.py" --effort xhigh --max-steps 50
```

`hermes` runs a manual agentic loop against `claude-opus-4-8` with adaptive
thinking. It executes `bash` and text-editor tool calls locally in the current
working directory, feeds results back to the model, and stops when the task is
finished. In `--loop` mode it self-continues until it emits `DONE`.

Flags: `--model`, `--effort {low,medium,high,xhigh,max}`, `--max-steps`, `--max-tokens`.

## kanban — board

```bash
kanban --show                       # render the board (default)
kanban add "Write the README"       # add a card to 'todo'
kanban add "Fix bug" --column doing
kanban move 3 done                  # move card #3
kanban rm 3                         # delete card #3
kanban list                         # plain text
```

State lives in `~/.aitoearn/kanban.json`.

## rss — feeds & digest

```bash
rss add https://hnrss.org/frontpage
rss list
rss --digest                        # recent items across all feeds
rss digest --since 24 --limit 5     # 5 items/feed from the last 24h
rss digest --summarize              # add an AI briefing (needs ANTHROPIC_API_KEY)
```

Feeds live in `~/.aitoearn/feeds.txt`.

## Requirements

- Python 3.10+
- `ANTHROPIC_API_KEY` for `hermes` and `rss --summarize`
- Dependencies (installed into the venv): `anthropic`, `feedparser`
