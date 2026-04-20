# Figure sources

Provenance log for figures in the report. Append an entry when a real
image replaces a placeholder. Keeps the paper reproducible without
bloating the LaTeX.

## Format

```
- `figures/NAME.png` — short description.
  Source: <video-file> frames N..M | screenshot of <ui> | etc.
  Config: <yaml-path> (any non-default knobs)
  Date produced: YYYY-MM-DD
  Notes: …
```

## Entries

- `figures/pipeline.png` — five-stage pipeline diagram.
  Source: `_refs/pipeline-pic.png` (hand-drawn / Keynote export).
  Date produced: pre-presentation.
  Notes: copy of the milestone diagram. May be re-rendered as vector
  PDF later for print quality.

<!-- Append future entries below -->
