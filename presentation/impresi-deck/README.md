# Functional Analytic Psychotherapy (FAP) — Impresi Slide Deck

An animated slide presentation introducing **Functional Analytic Psychotherapy
(FAP)**, built with the [Impresi](https://github.com/richjava/impresi)
JavaScript library.

## View it

It's a single self-contained page that loads Impresi from a CDN. Serve it over
HTTP (some browsers block the CDN script when opening the file directly):

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

1. Title — Functional Analytic Psychotherapy
2. What is FAP?
3. Clinically Relevant Behaviors (CRB1 / CRB2 / CRB3)
4. The Five Rules
5. Natural reinforcement
6. The ACL model — Awareness · Courage · Love
7. Why it matters
8. Closing — "The relationship is the treatment."

## Editing

All content lives in the `config` object in `index.html`. Each slide is a set of
`resources` (background / heading / blurb) sequenced by the `actions` array,
where each "screen" brings the previous slide's items `out` and the new slide's
items `in`. Animations use [Animate.css](https://animate.style/) class names
(`fadeInUp`, `zoomIn`, `slideInLeft`, …).
