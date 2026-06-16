# AiToEarn — Impresi Slide Deck

An animated slide presentation about **AiToEarn**, built with the
[Impresi](https://github.com/richjava/impresi) JavaScript library.

## View it

It's a single self-contained page that loads Impresi from a CDN and reuses the
images in the parent `presentation/` folder, so it must be served over HTTP
(opening the file directly will block the relative image paths in some browsers).

```bash
# from the repository root
cd presentation/impresi-deck
python3 -m http.server 8000
# then open http://localhost:8000 in a browser
```

## Navigate

| Action  | Keys                         |
| ------- | ---------------------------- |
| Next    | → · ↓ · Space · Enter        |
| Back    | ← · ↑                        |

## Slides

1. Title — AiToEarn
2. One platform, every channel
3. Monetize
4. Publish
5. Engage
6. Create
7. 5 ways to get started
8. Closing — aitoearn.ai

## Editing

All content lives in the `config` object in `index.html`. Each slide is a set of
`resources` (background / heading / blurb / image) sequenced by the `actions`
array, where each "screen" brings the previous slide's items `out` and the new
slide's items `in`. Animations use [Animate.css](https://animate.style/) class
names (`fadeInUp`, `zoomIn`, `slideInLeft`, …).
