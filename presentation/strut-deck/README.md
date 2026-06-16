# Functional Analytic Psychotherapy (FAP) — impress.js / Strut deck

A Prezi-style **zooming and rotating** presentation about Functional Analytic
Psychotherapy, built on [impress.js](https://github.com/impress/impress.js) —
the same engine that powers [Strut](https://github.com/nadirbelarouci/strut-editor-offline).

## View it

Open `index.html` in a modern browser (Chrome / Safari / Firefox). It loads
impress.js from a CDN, so an internet connection is needed the first time.

```bash
# or serve it locally
cd presentation/strut-deck
python3 -m http.server 8000
# then open http://localhost:8000
```

## Navigate

| Action | Keys                  |
| ------ | --------------------- |
| Next   | → · ↓ · Space · Page↓ |
| Back   | ← · ↑ · Page↑         |

## Editing in Strut

Strut is a desktop (Electron) editor that imports/exports impress.js
presentations. To work on this deck in Strut:

```bash
git clone https://github.com/nadirbelarouci/strut-editor-offline
cd strut-editor-offline
npm install
npm start
```

Each slide is a `.step` div positioned on an infinite canvas with
`data-x`, `data-y`, `data-scale` and `data-rotate` — adjust those to change the
camera path between slides.

## Slides

1. Title — Functional Analytic Psychotherapy
2. What is FAP?
3. Clinically Relevant Behaviors (CRB1 / CRB2 / CRB3)
4. The Five Rules
5. Natural reinforcement
6. The ACL model — Awareness · Courage · Love
7. Why it matters
8. Closing — "The relationship is the treatment."
