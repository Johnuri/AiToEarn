#!/usr/bin/env python3
"""notes — quick note capture with an AI question-answering mode.

Usage:
    notes add "remember to renew the domain" --tag todo
    notes                       # list all notes (default)
    notes list --tag todo       # filter by tag
    notes search "domain"       # substring search
    notes rm 4                  # delete note #4
    notes ask "what do I still need to do?"   # Claude answers over your notes

Notes are stored in ~/.aitoearn/notes.json.
`notes ask` requires ANTHROPIC_API_KEY.
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

DATA = Path(os.environ.get("AITOEARN_HOME", Path.home() / ".aitoearn")) / "notes.json"
BOLD, DIM, YELLOW, RESET = "\033[1m", "\033[2m", "\033[33m", "\033[0m"


def load() -> dict:
    if DATA.exists():
        return json.loads(DATA.read_text())
    return {"next_id": 1, "notes": []}


def save(state: dict) -> None:
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(state, indent=2))


def add(state, text, tag):
    note = {
        "id": state["next_id"],
        "text": text,
        "tag": tag,
        "created": datetime.now().isoformat(timespec="seconds"),
    }
    state["notes"].append(note)
    state["next_id"] += 1
    save(state)
    print(f"Added note #{note['id']}" + (f" [{tag}]" if tag else ""))


def remove(state, note_id):
    before = len(state["notes"])
    state["notes"] = [n for n in state["notes"] if n["id"] != note_id]
    if len(state["notes"]) == before:
        sys.exit(f"notes: no note #{note_id}")
    save(state)
    print(f"Removed #{note_id}")


def _print(notes):
    if not notes:
        print("No notes. Add one with: notes add \"my note\"")
        return
    for n in notes:
        when = n["created"].replace("T", " ")
        tag = f" {YELLOW}[{n['tag']}]{RESET}" if n.get("tag") else ""
        print(f"{BOLD}#{n['id']}{RESET}{tag} {n['text']}")
        print(f"  {DIM}{when}{RESET}")


def list_notes(state, tag):
    notes = state["notes"]
    if tag:
        notes = [n for n in notes if n.get("tag") == tag]
    _print(notes)


def search(state, query):
    q = query.lower()
    _print([n for n in state["notes"] if q in n["text"].lower()
            or q in (n.get("tag") or "").lower()])


def ask(state, question):
    if not state["notes"]:
        sys.exit("notes: no notes to ask about. Add some first.")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("notes: `ask` needs ANTHROPIC_API_KEY. export ANTHROPIC_API_KEY=sk-ant-...")
    try:
        import anthropic
    except ImportError:
        sys.exit("notes: the 'anthropic' package is not installed. Run install.sh first.")

    corpus = "\n".join(
        f"#{n['id']} [{n.get('tag') or 'untagged'}] ({n['created']}): {n['text']}"
        for n in state["notes"]
    )
    client = anthropic.Anthropic()
    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=2000,
        system="You answer questions using ONLY the user's notes provided below. "
               "Cite the note numbers you used like (#3). If the notes don't "
               "contain the answer, say so plainly.",
        messages=[{"role": "user",
                   "content": f"My notes:\n{corpus}\n\nQuestion: {question}"}],
    ) as stream:
        for text in stream.text_stream:
            sys.stdout.write(text)
            sys.stdout.flush()
    print()


def main():
    parser = argparse.ArgumentParser(prog="notes", description="Quick notes with an AI ask mode.")
    sub = parser.add_subparsers(dest="cmd")

    p_add = sub.add_parser("add", help="add a note")
    p_add.add_argument("text")
    p_add.add_argument("--tag", default="", help="optional tag")

    p_list = sub.add_parser("list", help="list notes")
    p_list.add_argument("--tag", default="", help="filter by tag")

    p_search = sub.add_parser("search", help="substring search")
    p_search.add_argument("query")

    p_rm = sub.add_parser("rm", help="remove a note")
    p_rm.add_argument("id", type=int)

    p_ask = sub.add_parser("ask", help="ask Claude a question over your notes")
    p_ask.add_argument("question")

    args = parser.parse_args()
    state = load()

    if args.cmd == "add":
        add(state, args.text, args.tag)
    elif args.cmd == "search":
        search(state, args.query)
    elif args.cmd == "rm":
        remove(state, args.id)
    elif args.cmd == "ask":
        ask(state, args.question)
    elif args.cmd == "list":
        list_notes(state, args.tag)
    else:
        list_notes(state, "")


if __name__ == "__main__":
    main()
