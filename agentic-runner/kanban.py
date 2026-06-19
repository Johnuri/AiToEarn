#!/usr/bin/env python3
"""kanban — a tiny JSON-backed kanban board for the terminal.

Usage:
    kanban --show                       # render the board (default action)
    kanban add "Write the README"       # add a card to 'todo'
    kanban add "Fix bug" --column doing
    kanban move 3 done                  # move card #3 to 'done'
    kanban rm 3                         # delete card #3
    kanban list                         # plain text list

Data is stored in ~/.aitoearn/kanban.json.
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

DATA = Path(os.environ.get("AITOEARN_HOME", Path.home() / ".aitoearn")) / "kanban.json"
COLUMNS = ["todo", "doing", "done"]
COLORS = {"todo": "\033[33m", "doing": "\033[36m", "done": "\033[32m"}
RESET = "\033[0m"


def load() -> dict:
    if DATA.exists():
        return json.loads(DATA.read_text())
    return {"next_id": 1, "cards": []}


def save(state: dict) -> None:
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(state, indent=2))


def add(state, title, column):
    if column not in COLUMNS:
        sys.exit(f"kanban: unknown column '{column}' (choose from {', '.join(COLUMNS)})")
    card = {
        "id": state["next_id"],
        "title": title,
        "column": column,
        "created": datetime.now().isoformat(timespec="seconds"),
    }
    state["cards"].append(card)
    state["next_id"] += 1
    save(state)
    print(f"Added #{card['id']} to {column}: {title}")


def move(state, card_id, column):
    if column not in COLUMNS:
        sys.exit(f"kanban: unknown column '{column}' (choose from {', '.join(COLUMNS)})")
    for card in state["cards"]:
        if card["id"] == card_id:
            card["column"] = column
            save(state)
            print(f"Moved #{card_id} -> {column}")
            return
    sys.exit(f"kanban: no card #{card_id}")


def remove(state, card_id):
    before = len(state["cards"])
    state["cards"] = [c for c in state["cards"] if c["id"] != card_id]
    if len(state["cards"]) == before:
        sys.exit(f"kanban: no card #{card_id}")
    save(state)
    print(f"Removed #{card_id}")


def show(state):
    cards = state["cards"]
    if not cards:
        print("Board is empty. Add a card with: kanban add \"my task\"")
        return
    width = 26
    cols = {c: [card for card in cards if card["column"] == c] for c in COLUMNS}
    headers = [f"{COLORS[c]}{c.upper()} ({len(cols[c])}){RESET}" for c in COLUMNS]
    print("  ".join(h.ljust(width + len(COLORS[c]) + len(RESET)) for h, c in zip(headers, COLUMNS)))
    print("  ".join("-" * width for _ in COLUMNS))
    rows = max(len(cols[c]) for c in COLUMNS)
    for i in range(rows):
        cells = []
        for c in COLUMNS:
            if i < len(cols[c]):
                card = cols[c][i]
                label = f"#{card['id']} {card['title']}"
                if len(label) > width:
                    label = label[: width - 1] + "…"
                cells.append(f"{COLORS[c]}{label.ljust(width)}{RESET}")
            else:
                cells.append(" " * width)
        print("  ".join(cells))


def list_cards(state):
    for c in COLUMNS:
        for card in state["cards"]:
            if card["column"] == c:
                print(f"[{c:5}] #{card['id']:<3} {card['title']}")


def main():
    parser = argparse.ArgumentParser(prog="kanban", description="Terminal kanban board.")
    parser.add_argument("--show", action="store_true", help="render the board")
    sub = parser.add_subparsers(dest="cmd")

    p_add = sub.add_parser("add", help="add a card")
    p_add.add_argument("title")
    p_add.add_argument("--column", default="todo", choices=COLUMNS)

    p_move = sub.add_parser("move", help="move a card to a column")
    p_move.add_argument("id", type=int)
    p_move.add_argument("column", choices=COLUMNS)

    p_rm = sub.add_parser("rm", help="remove a card")
    p_rm.add_argument("id", type=int)

    sub.add_parser("show", help="render the board")
    sub.add_parser("list", help="plain text list")

    args = parser.parse_args()
    state = load()

    if args.cmd == "add":
        add(state, args.title, args.column)
    elif args.cmd == "move":
        move(state, args.id, args.column)
    elif args.cmd == "rm":
        remove(state, args.id)
    elif args.cmd == "list":
        list_cards(state)
    else:
        # default / --show / show
        show(state)


if __name__ == "__main__":
    main()
