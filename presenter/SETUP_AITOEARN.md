# Presenter — vendored into AiToEarn

This directory is a vendored copy of [`rsrohan99/presenter`](https://github.com/rsrohan99/presenter),
a multi-agent AI tool that generates presentations (slides, diagrams, speaker
scripts, audio narration, and a final video) for a given topic.

It is set up here **ready to run, but has not been run**. No API keys are
configured and no presentation has been generated. To actually generate a
presentation you must supply your own keys and install the external tools below.

## Prerequisites

System tools (one-time):

```bash
python -m pip install git+https://gitlab.com/da_doomer/markdown-slides.git
npm install -g @mermaid-js/mermaid-cli decktape puppeteer
puppeteer browsers install chrome
# plus FFmpeg from https://www.ffmpeg.org/download.html
```

Python dependencies:

```bash
cd presenter
pip install -r requirements.txt
```

## Configure keys

```bash
cp .env.example .env
# then edit .env and fill in:
#   OPENAI_API_KEY="..."
#   ELEVENLABS_API_KEY="..."   # only needed for audio / video export
```

## Run

```bash
cd presenter
python run.py "your topic here"
# add --export-video to also render the narrated video
python run.py "your topic here" --export-video
```

Output lands in `presenter/presentations/<topic_folder>/`:

- `output/index.html` — interactive Reveal.js presentation
- `presentation.pdf` — exported PDF
- `presentation.mp4` — narrated video (with `--export-video`)

## Notes for this repo

- `.env` is git-ignored (see `presenter/.gitignore`); never commit real keys.
- This is an independent Python tool and is not wired into the AiToEarn
  application — run it standalone from this directory.
