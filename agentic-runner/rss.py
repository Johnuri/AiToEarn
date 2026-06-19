#!/usr/bin/env python3
"""rss — manage feeds and build a digest, optionally summarized by Claude.

Usage:
    rss add https://hnrss.org/frontpage
    rss list
    rss rm  https://hnrss.org/frontpage
    rss digest                 # recent items across all feeds
    rss --digest               # same as `rss digest`
    rss digest --limit 5 --since 24   # 5 items/feed from the last 24 hours
    rss digest --summarize     # also write an AI summary (needs ANTHROPIC_API_KEY)

Feeds are stored in ~/.aitoearn/feeds.txt (one URL per line).
"""

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    import feedparser
except ImportError:
    sys.exit("rss: the 'feedparser' package is not installed. Run install.sh first.")

HOME = Path(os.environ.get("AITOEARN_HOME", Path.home() / ".aitoearn"))
FEEDS = HOME / "feeds.txt"
BOLD, DIM, CYAN, RESET = "\033[1m", "\033[2m", "\033[36m", "\033[0m"


def read_feeds() -> list[str]:
    if not FEEDS.exists():
        return []
    return [l.strip() for l in FEEDS.read_text().splitlines() if l.strip()]


def write_feeds(feeds: list[str]) -> None:
    FEEDS.parent.mkdir(parents=True, exist_ok=True)
    FEEDS.write_text("\n".join(feeds) + "\n")


def add(url):
    feeds = read_feeds()
    if url in feeds:
        print(f"Already subscribed: {url}")
        return
    feeds.append(url)
    write_feeds(feeds)
    print(f"Added feed: {url}")


def remove(url):
    feeds = read_feeds()
    if url not in feeds:
        sys.exit(f"rss: not subscribed to {url}")
    write_feeds([f for f in feeds if f != url])
    print(f"Removed feed: {url}")


def list_feeds():
    feeds = read_feeds()
    if not feeds:
        print("No feeds. Add one with: rss add <url>")
        return
    for f in feeds:
        print(f)


def _entry_time(entry):
    for key in ("published_parsed", "updated_parsed"):
        t = entry.get(key)
        if t:
            return datetime(*t[:6], tzinfo=timezone.utc)
    return None


def collect(limit, since_hours):
    feeds = read_feeds()
    if not feeds:
        sys.exit("rss: no feeds. Add one with: rss add <url>")
    cutoff = None
    if since_hours:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=since_hours)
    items = []
    for url in feeds:
        parsed = feedparser.parse(url)
        title = parsed.feed.get("title", url)
        count = 0
        for entry in parsed.entries:
            ts = _entry_time(entry)
            if cutoff and ts and ts < cutoff:
                continue
            items.append({
                "feed": title,
                "title": entry.get("title", "(untitled)"),
                "link": entry.get("link", ""),
                "time": ts,
                "summary": entry.get("summary", ""),
            })
            count += 1
            if count >= limit:
                break
    items.sort(key=lambda x: x["time"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return items


def digest(args):
    items = collect(args.limit, args.since)
    if not items:
        print("No recent items.")
        return
    for it in items:
        when = it["time"].strftime("%Y-%m-%d %H:%M") if it["time"] else ""
        print(f"{BOLD}{it['title']}{RESET}")
        print(f"  {DIM}{it['feed']} · {when}{RESET}")
        if it["link"]:
            print(f"  {CYAN}{it['link']}{RESET}")
        print()

    if args.summarize:
        summarize(items)


def summarize(items):
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("rss: --summarize needs ANTHROPIC_API_KEY; skipping summary.")
        return
    try:
        import anthropic
    except ImportError:
        print("rss: 'anthropic' not installed; skipping summary.")
        return
    client = anthropic.Anthropic()
    headlines = "\n".join(f"- {it['title']} ({it['feed']})" for it in items[:60])
    print(f"{BOLD}── AI digest ──{RESET}")
    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=1500,
        system="You summarize RSS headlines into a crisp briefing. Group related "
               "items, surface the few that matter most, and keep it under 200 words.",
        messages=[{"role": "user", "content": f"Today's headlines:\n{headlines}"}],
    ) as stream:
        for text in stream.text_stream:
            sys.stdout.write(text)
            sys.stdout.flush()
    print()


def main():
    parser = argparse.ArgumentParser(prog="rss", description="RSS feeds and digest.")
    parser.add_argument("--digest", action="store_true", help="build a digest (shortcut)")
    sub = parser.add_subparsers(dest="cmd")

    p_add = sub.add_parser("add", help="subscribe to a feed")
    p_add.add_argument("url")
    p_rm = sub.add_parser("rm", help="unsubscribe from a feed")
    p_rm.add_argument("url")
    sub.add_parser("list", help="list feeds")

    p_dig = sub.add_parser("digest", help="build a digest")
    p_dig.add_argument("--limit", type=int, default=8, help="items per feed")
    p_dig.add_argument("--since", type=int, default=0, help="only items from the last N hours")
    p_dig.add_argument("--summarize", action="store_true", help="add an AI summary")

    args = parser.parse_args()

    if args.cmd == "add":
        add(args.url)
    elif args.cmd == "rm":
        remove(args.url)
    elif args.cmd == "list":
        list_feeds()
    elif args.cmd == "digest":
        digest(args)
    elif args.digest:
        # `rss --digest` with no subcommand: use defaults
        args.limit, args.since, args.summarize = 8, 0, False
        digest(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
