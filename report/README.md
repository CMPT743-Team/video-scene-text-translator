# Final Report — Cross-Language Scene Text Replacement in Video

CMPT 743 final report (Simon Fraser University). LaTeX source for a
conference-style technical paper documenting the project.

## Build

Requires a TeX Live distribution with `pdflatex`, `bibtex`, and
`latexmk`. From this directory:

```bash
latexmk -pdf
```

Output: `main.pdf`. Clean intermediates with `latexmk -C`. Live
preview while editing: `latexmk -pdf -pvc`.

## Layout

```
report/
├── main.tex                 entry point; loads style, sections, bib
├── latexmkrc                build config
├── references.bib           bibliography (numbered, natbib)
├── style/
│   └── neurips_2024.sty     vendored NeurIPS 2024 single-column style
├── sections/
│   ├── 00_abstract.tex
│   ├── 01_introduction.tex
│   ├── 02_related_work.tex
│   ├── 03_methodology.tex
│   ├── 04_experiments.tex
│   └── 05_conclusion.tex
├── figures/
│   ├── pipeline.png         5-stage pipeline diagram (real)
│   └── ...                  other figures (placeholders until added)
├── content_brief.md         source-of-truth for technical claims
├── samples/                 reference papers from the prof
├── requirement.txt          prof's requirements
└── README.md                this file
```

## Figures

Figures use the `\figplaceholder{filename}{width}{caption}{label}`
macro defined in `main.tex`. If the file `figures/<filename>.pdf` or
`figures/<filename>.png` exists, it is included. Otherwise a visible
framed "PLACEHOLDER" box is rendered with the missing filename. This
keeps the build green before all real figures arrive — drop a real
PNG/PDF in with the matching filename and the box is replaced
automatically.

Planned figure slots are listed in `content_brief.md` §M.2. When a
real figure replaces a placeholder, also append its source (video
file, frame range, config) to `figures/SOURCES.md`.

## Source of truth

Every technical claim in the LaTeX should match `content_brief.md`,
which is reconciled against the current `master`-branch
implementation (the final-presentation slides are partially stale —
see §F of the brief). When the code changes in a way that affects
the report, update `content_brief.md` first, then propagate to the
LaTeX.

## Style

NeurIPS 2024 single-column. The `style/neurips_2024.sty` is the
official one from the NeurIPS 2024 author kit. The `final` option is
passed in `main.tex` so author names + affiliations are visible.
