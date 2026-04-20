# Plan: Final Report — Cross-Language Scene Text Replacement in Video

## Goal
Produce a conference-style technical report (LaTeX) documenting the
5-stage pipeline, framed as engineering contribution. Submitted to
fulfill the CMPT 743 final deliverable. Lives entirely under
`report/` and is built reproducibly with `latexmk`.

## Approach

### Branch
`feat/final-report` (created).

### Template — NeurIPS 2024 single-column
Picked over CVPR 2-col because the pipeline diagram is wide, the
methodology section has many sub-modules, and 2 of 3 reference samples
use the NeurIPS-style format. Will vendor `neurips_2024.sty` into
`report/style/`.

### Engine — `pdflatex` via `latexmk`
TeX Live present at `/Library/TeX/texbin`. `pdflatex` chosen over
xelatex unless we hit Unicode issues (e.g. CJK characters in body) —
in which case we switch to xelatex. CJK strings inside text examples
will use `\zh{...}` macro that can swap engines later.

### Bibliography — `natbib` numerical
Standard NeurIPS choice. `references.bib` hand-curated.

### Page budget
Target 6–8 pages excluding references. Flex: methodology can grow if
needed since the engineering depth IS the contribution.

### Workflow
1. Read codebase + git log (post-presentation deltas matter — see Risks)
   and write `report/content_brief.md` first. This is the source of
   truth for the LaTeX. **Do not start LaTeX before this file is
   reviewed.**
2. Scaffold LaTeX project (template + skeleton sections + figure
   placeholders + bib stubs).
3. Write **initial draft** of every section end-to-end. Drafts can be
   rough — coverage over polish at this stage.
4. Polish each section sequentially with the user, one at a time.
5. Replace placeholder figures with real ones the user provides.
6. Final `latexmk` build + proofread + commit.

### Outline (matches prof's required structure)
1. **Introduction** — video localization is high-effort manual today
   (rotoscoping, 3D tracking); generative video models lack glyph
   control; image STE doesn't extend to video. Why it matters; why
   hard (translated + aligned + temporally consistent + visually
   realistic).
2. **Related Work** — (a) image STE: SRNet, MOSTEL, AnyText/AnyText2,
   CLASTE; (b) video text replacement: STRIVE (closest, code
   unreleased); (c) generative video models: Sora, Runway Gen-4 Aleph;
   (d) supporting components: PaddleOCR, CoTracker3, STTN, Poisson
   blending, Hi-SAM.
3. **Methodology** — 5-stage pipeline. Per stage: input/output, model
   choice + rationale, key engineering decisions. Includes architecture
   + training scheme of the 2 trained-by-us models (BPN, Alignment
   Refiner). Adaptive-mask algorithm for AnyText2. Hi-SAM vs SRNet
   inpainter tradeoff.
4. **Experiments & Results** — qualitative comparison vs Runway Gen-4
   Aleph; module ablations (LCM on/off, BPN on/off, Alignment Refiner
   on/off); failure modes (long-to-short, detection jitter). Quant
   metrics with placeholder values (see D-content-7).
5. **Conclusion + Future Work** — model-involvement table; 3 future
   directions from PPT plus any new ones surfaced during writing.

### Hero figure
A single-column hero figure on page 1 showing the web UI demo
screenshot (input video panel + output video panel + stage progress).
Placeholder image `figures/hero_webui.png` — the body never mentions
the web client itself, the figure just visually conveys "this is a
working end-to-end system."

### Pipeline figure
`_refs/pipeline-pic.png` — the existing 5-stage diagram. Placed at the
top of Section 3 (Methodology). May redraw in TikZ later if the PNG
quality suffers in print; for now use as-is.

## Content writing decisions (refer back during drafting)

These are the calls we've already made — keep consistent across
sections.

- **D-content-1 — Voice.** Plural "we." Past tense for what was built;
  present for what the system does.
- **D-content-2 — Engineering framing, not research framing.** No
  "novel contribution" language. Frame as: existing systems' gaps →
  our engineering response → ablation showing each module earns its
  place. Prof explicitly OK'd this framing in `requirement.txt`.
- **D-content-3 — Web client is invisible in the body.** Used only as
  the hero figure. No section, no mention. It's not a research
  contribution.
- **D-content-4 — TPM data gen pipeline is a footnote.** Mentioned in
  Methodology > S4 as "to enable training BPN we built a streaming
  data-gen pipeline." No dedicated section.
- **D-content-5 — Two trained models get full subsections.** BPN and
  Alignment Refiner each get architecture + training + loss + eval
  treatment. The other 5 pretrained models get a paragraph each.
- **D-content-6 — Source-of-truth for technical claims is
  `content_brief.md`, NOT the PPT.** PPT is stale in places (see
  Risks). Always reconcile against current code before writing.
- **D-content-7 — Quantitative metrics: assume + placeholder.** We'll
  claim:
  - **OCR readback accuracy** (PaddleOCR re-detects target text on
    output frames) — primary
  - **SSIM / PSNR** on non-text background regions vs. source —
    secondary, shows we don't damage surroundings
  - **Temporal consistency**: per-frame Δquad jitter (px) before/after
    Alignment Refiner
  - **Runtime per stage** (seconds, on 1× consumer GPU) — engineering
    legitimacy
  Numbers are placeholders (`XX.X`) the user fills in. If the user
  later tells us we don't have a metric, drop it.
- **D-content-8 — Comparison baselines.** Runway Gen-4 Aleph
  (qualitative, frame triplets). STRIVE not reproducible (code
  unreleased) — say so explicitly in Related Work and Results.
- **D-content-9 — Failure cases get their own subsection.** Honesty
  builds credibility — long-to-short translation gibberish, detection
  jitter, occlusion-driven false replacements.
- **D-content-10 — Author list.** Hebin Yao, Yunshan Feng, Liliana
  Lopez. SFU. Affiliation block matches sample 1/3.

## Files to Change
- [ ] (new) `report/content_brief.md` — codebase + git log
      reconciliation; source of truth for every technical claim. **Must
      include a "Post-Presentation Updates" section** listing deltas
      between the PPT and current `master`.
- [ ] (new) `report/main.tex` — entry point; loads style + sections
- [ ] (new) `report/sections/00_abstract.tex`
- [ ] (new) `report/sections/01_introduction.tex`
- [ ] (new) `report/sections/02_related_work.tex`
- [ ] (new) `report/sections/03_methodology.tex` (subsections per stage
      S1–S5 + the two trained models)
- [ ] (new) `report/sections/04_experiments.tex`
- [ ] (new) `report/sections/05_conclusion.tex`
- [ ] (new) `report/references.bib` — natbib bibliography
- [ ] (new) `report/style/neurips_2024.sty` (+ supporting files) —
      vendored template
- [ ] (new) `report/figures/pipeline.png` — copy of
      `_refs/pipeline-pic.png`
- [ ] (new) `report/figures/hero_webui.png` — placeholder
- [ ] (new) `report/figures/results_*.png` — placeholders for
      qualitative comparison + ablations
- [ ] (new) `report/.gitignore` — ignore latex aux files (.aux, .log,
      .out, .toc, .bbl, .blg, .fdb_latexmk, .fls, .synctex.gz)
- [ ] (new) `report/Makefile` or `latexmkrc` — one-command build
- [ ] (new) `report/README.md` — how to build the report

## Risks
- **PPT is partially stale.** Verified deltas (commits after the
  presentation cutoff, reflected in `master`):
  - **Alignment Refiner moved S5 → S2** (`feat/mv_refine_to_s2`,
    commit `930eb97`). PPT slide 9 lists it under S5; correct location
    is S2. Affects both S2 and S5 sections.
  - **BPN retrained on S2-aligned dataset, enabled by default**
    (commits `81caa3d`, `156844a`). PPT description of BPN training is
    pre-realignment.
  - **BPN padding bug fix** (`7a6b1f1`): reflect → replicate to avoid
    border halo. Worth a sentence in BPN training notes.
  - **Hi-SAM segmentation-based inpainter added** as alternative to
    SRNet (`feat/text_seg` merge `25a50cd`). Not in PPT. Affects S3 +
    S4 inpainter discussion.
  - **Stage liveness watchdog** (server-side observability) — out of
    paper scope, ignore.
  Action: `content_brief.md` must reconcile and use current code as
  truth.
- **Real result frames are missing locally.** All result figures stay
  as placeholders until the user provides them. Plan structure +
  caption text is ready so swap is mechanical.
- **CJK rendering in pdflatex.** Examples like 典狱长 may force a
  switch to xelatex. Mitigation: use `\zh{}` macro and Source Han Sans
  if needed.
- **Page overflow** — if 8 pages isn't enough, methodology subsections
  collapse first; results figures shrink to half-column; related work
  trims last.

## Done When
- [ ] `content_brief.md` complete and user-approved
- [ ] LaTeX project compiles cleanly (`latexmk -pdf` exits 0, no
      undefined refs/citations)
- [ ] All 5 required sections present and drafted
- [ ] Hero + pipeline + at least 4 result-figure placeholders embedded
      with captions
- [ ] All quantitative numbers either real or clearly marked
      placeholder
- [ ] Bibliography ≥ 12 entries, all cited at least once
- [ ] Each section polished with user
- [ ] Final PDF reviewed end-to-end by user
- [ ] Code review (@reviewer) of LaTeX project structure
- [ ] Atomic commits on `feat/final-report`

## Progress
- [x] Branch `feat/final-report` created
- [x] Plan written and approved
- [x] Step 1 — Read full codebase + git log + sessions; write
      `content_brief.md`
- [ ] Step 2 — Get user sign-off on `content_brief.md`
- [x] Step 3 — Scaffold LaTeX project (style + skeleton + bib stubs +
      build files)
- [x] Step 4 — Drop in pipeline figure + hero placeholder + result
      placeholders (handled by `\figplaceholder` macro — placeholders
      render as visible boxes until real images arrive)
- [x] CJK rendering verified — pdflatex + CJKutf8 + arphic (gbsnu)
      working with 典狱长 in the experiments caption
- [x] Step 5 — Write initial full draft (Sections 1–5 + abstract).
      12-page PDF compiles cleanly, all 16 citations resolved, CJK
      rendering verified.
- [ ] Step 6 — Polish Section 1 (Introduction) with user
- [ ] Step 7 — Polish Section 2 (Related Work) with user
- [ ] Step 8 — Polish Section 3 (Methodology) with user
- [ ] Step 9 — Polish Section 4 (Experiments & Results) with user
- [ ] Step 10 — Polish Section 5 (Conclusion + Future Work) with user
- [ ] Step 11 — Replace result-figure placeholders with real frames
      (user-supplied)
- [ ] Step 12 — Fill real quantitative numbers (user-supplied)
- [ ] Step 13 — Final build + proofread + reviewer pass
- [ ] Step 14 — Atomic commits + push branch
