#!/usr/bin/env python3
"""hermes — an agentic loop CLI powered by Claude.

Usage:
    hermes run "task description"            # single agentic run (tools until done)
    hermes run "task description" --loop     # keep working autonomously until DONE
    hermes run "task" --model claude-opus-4-8 --effort xhigh --max-steps 50

Requires ANTHROPIC_API_KEY in the environment.

The agent has access to a `bash` tool and a text-editor tool, executed locally
in the current working directory. It runs a manual agentic loop: each turn the
model may call tools, we execute them and feed the results back, and we stop
when the model finishes (or, in --loop mode, when it reports the task is DONE).
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

try:
    import anthropic
except ImportError:
    sys.exit("hermes: the 'anthropic' package is not installed. Run install.sh first.")


# Anthropic-defined, client-executed tools. These are schema-less — we declare
# them by type/name and implement the handlers ourselves.
TOOLS = [
    {"type": "bash_20250124", "name": "bash"},
    {"type": "text_editor_20250728", "name": "str_replace_based_edit_tool"},
]

SYSTEM_PROMPT = """You are hermes, an autonomous engineering agent running in a \
terminal on the user's machine. You execute tasks by calling the bash and \
text-editor tools. Work in the current working directory.

Guidelines:
- When you have enough information to act, act. Don't over-plan or narrate \
options you won't pursue.
- Prefer small, verifiable steps. After making changes, verify them (run the \
build, tests, or the program) rather than assuming success.
- Report outcomes faithfully: if a command fails, say so with the output.
- Only make changes the task requires. Don't add abstractions or error handling \
for cases that can't happen.
- When the task is fully complete, end your turn with a one or two sentence \
summary of what you did, and include the token DONE on its own line."""

# A persistent shell process keeps cwd / env / venv state across bash calls.
_shell_cwd = os.getcwd()


def run_bash(command: str) -> str:
    """Execute a bash command in a persistent-ish working directory."""
    global _shell_cwd
    try:
        proc = subprocess.run(
            command,
            shell=True,
            cwd=_shell_cwd,
            capture_output=True,
            text=True,
            timeout=600,
        )
    except subprocess.TimeoutExpired:
        return "Error: command timed out after 600s"
    # Track cd by re-querying pwd when the command looks like it changed dirs.
    if "cd " in command:
        try:
            pwd = subprocess.run(
                f"{command} >/dev/null 2>&1; pwd",
                shell=True,
                cwd=_shell_cwd,
                capture_output=True,
                text=True,
                timeout=10,
            ).stdout.strip()
            if pwd and Path(pwd).is_dir():
                _shell_cwd = pwd
        except subprocess.SubprocessError:
            pass
    out = (proc.stdout or "") + (proc.stderr or "")
    out = out.strip() or f"(no output, exit code {proc.returncode})"
    if proc.returncode != 0:
        out = f"[exit code {proc.returncode}]\n{out}"
    return out[:60000]


def _safe_path(raw: str) -> Path:
    p = Path(raw)
    if not p.is_absolute():
        p = Path(_shell_cwd) / p
    return p


def run_text_editor(inp: dict) -> tuple[str, bool]:
    """Implement the str_replace_based_edit_tool commands. Returns (text, is_error)."""
    command = inp.get("command")
    path = _safe_path(inp.get("path", ""))
    try:
        if command == "view":
            if path.is_dir():
                entries = sorted(os.listdir(path))
                return "\n".join(entries) or "(empty directory)", False
            text = path.read_text(errors="replace")
            rng = inp.get("view_range")
            lines = text.splitlines()
            if rng and len(rng) == 2:
                start, end = rng
                end = len(lines) if end == -1 else end
                lines = lines[start - 1:end]
                numbered = [f"{i + start}\t{l}" for i, l in enumerate(lines)]
            else:
                numbered = [f"{i + 1}\t{l}" for i, l in enumerate(lines)]
            return "\n".join(numbered), False

        if command == "create":
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(inp.get("file_text", ""))
            return f"Created {path}", False

        if command == "str_replace":
            text = path.read_text()
            old = inp.get("old_str", "")
            count = text.count(old)
            if count == 0:
                return "Error: old_str not found", True
            if count > 1:
                return f"Error: old_str matched {count} times; must be unique", True
            path.write_text(text.replace(old, inp.get("new_str", ""), 1))
            return f"Edited {path}", False

        if command == "insert":
            lines = path.read_text().splitlines(keepends=True)
            at = int(inp.get("insert_line", 0))
            ins = inp.get("insert_text", "")
            if not ins.endswith("\n"):
                ins += "\n"
            lines.insert(at, ins)
            path.write_text("".join(lines))
            return f"Inserted into {path} at line {at}", False

        return f"Error: unknown command '{command}'", True
    except FileNotFoundError:
        return f"Error: no such file: {path}", True
    except Exception as exc:  # noqa: BLE001 - surface any error back to the model
        return f"Error: {exc}", True


def execute_tool(block) -> dict:
    """Run one tool_use block and build its tool_result."""
    if block.name == "bash":
        if block.input.get("restart"):
            return _result(block.id, "Shell restarted.")
        out = run_bash(block.input.get("command", ""))
        return _result(block.id, out)
    if block.name == "str_replace_based_edit_tool":
        text, is_error = run_text_editor(block.input)
        return _result(block.id, text, is_error)
    return _result(block.id, f"Unknown tool: {block.name}", True)


def _result(tool_use_id: str, content: str, is_error: bool = False) -> dict:
    r = {"type": "tool_result", "tool_use_id": tool_use_id, "content": content}
    if is_error:
        r["is_error"] = True
    return r


def stream_turn(client, messages, model, effort, max_tokens):
    """Stream one assistant turn, printing thinking/text live, return final message."""
    with client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        thinking={"type": "adaptive", "display": "summarized"},
        output_config={"effort": effort},
        system=SYSTEM_PROMPT,
        tools=TOOLS,
        messages=messages,
    ) as stream:
        mode = None
        for event in stream:
            if event.type == "content_block_start":
                bt = event.content_block.type
                if bt == "thinking":
                    sys.stdout.write("\n\033[2m… ")
                    mode = "thinking"
                elif bt == "text":
                    sys.stdout.write("\n")
                    mode = "text"
                elif bt == "tool_use":
                    mode = "tool"
            elif event.type == "content_block_delta":
                d = event.delta
                if d.type == "thinking_delta":
                    sys.stdout.write(d.thinking)
                    sys.stdout.flush()
                elif d.type == "text_delta":
                    sys.stdout.write(d.text)
                    sys.stdout.flush()
            elif event.type == "content_block_stop" and mode == "thinking":
                sys.stdout.write("\033[0m")
        return stream.get_final_message()


def run(args):
    client = anthropic.Anthropic()
    messages = [{"role": "user", "content": args.task}]
    steps = 0
    while steps < args.max_steps:
        steps += 1
        response = stream_turn(client, messages, args.model, args.effort, args.max_tokens)
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "tool_use":
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            results = []
            for block in tool_uses:
                print(f"\n\033[36m▶ {block.name}: "
                      f"{block.input.get('command', block.input.get('command') or block.input)}\033[0m")
                results.append(execute_tool(block))
            messages.append({"role": "user", "content": results})
            continue

        # end_turn (or any non-tool stop)
        if response.stop_reason == "refusal":
            print("\n\033[31mhermes: request was refused by safety policy.\033[0m")
            return
        if args.loop:
            text = "".join(b.text for b in response.content if b.type == "text")
            if "DONE" in text:
                break
            messages.append({
                "role": "user",
                "content": "Continue the task. If it is fully complete, reply with DONE.",
            })
            continue
        break
    print(f"\n\033[32m✓ hermes finished after {steps} step(s).\033[0m")


def main():
    parser = argparse.ArgumentParser(prog="hermes", description="Agentic loop powered by Claude.")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_run = sub.add_parser("run", help="run a task")
    p_run.add_argument("task", help="task description")
    p_run.add_argument("--loop", action="store_true",
                       help="keep working autonomously until the agent reports DONE")
    p_run.add_argument("--model", default="claude-opus-4-8")
    p_run.add_argument("--effort", default="high",
                       choices=["low", "medium", "high", "xhigh", "max"])
    p_run.add_argument("--max-steps", type=int, default=40,
                       help="max agentic iterations before stopping")
    p_run.add_argument("--max-tokens", type=int, default=32000)
    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("hermes: ANTHROPIC_API_KEY is not set. export ANTHROPIC_API_KEY=sk-ant-...")

    if args.cmd == "run":
        try:
            run(args)
        except KeyboardInterrupt:
            print("\n\033[33mhermes: interrupted.\033[0m")


if __name__ == "__main__":
    main()
