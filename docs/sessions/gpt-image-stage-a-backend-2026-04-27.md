# Session: GPT-Image Stage A Backend — 2026-04-27

## Completed
- Surveyed recent merges (`cc86f6a` jitter fix, `9d23e32` BPN/S2 alignment, `44bf14a` liveness + S2 refiner path) and current `adv.yaml` performance tuning. Documented "newest pipeline settings" table.
- Researched ChatGPT-app vs `gpt-image-1` API quality gap (delegated to @researcher). Diagnosis: teammate's pipeline calls `/v1/images/generations` with text-only prompt instead of `/v1/images/edits` with image+mask, and lacks the client-side alpha-composite that the app does implicitly. Pricing also confirmed: `gpt-image-1.5` is strictly better than `gpt-image-1` (~20% cheaper, 4× faster, higher quality).
- Archived completed `plan.md` (stage-liveness observability) to `docs/plans_archive/stage-liveness-observability.md`.
- Created branch `feat/gpt_image_backend` and wrote new `plan.md` covering the new Stage A backend, including a 9-step API setup + billing tutorial and an 8-step implementation roadmap split between local (Step 1) and remote (Steps 2–8).
- Cut `test_data/video2.mp4` to 4s and `test_data/video2_c.mp4` to 3s (re-encoded H.264 CRF20 + AAC `+faststart`).
- Two atomic commits + push:
  - `5cb4c06 chore(test-data): add example videos and reference image` — force-added past `.gitignore` (`pic.png`, `video2.mp4`, `video2_c.mp4`, `video16_3s.mp4`).
  - `d3bd37f docs(plan): archive stage-liveness, add gpt-image backend plan`.
- Pushed `feat/gpt_image_backend` to origin, tracking set.

## Current State
- Branch `feat/gpt_image_backend` two commits ahead of `master`; up-to-date with `origin/feat/gpt_image_backend`.
- Working tree clean except for pre-existing untracked `report/`.
- No code changes yet — plan-only branch. Stage A factory in [s3_text_editing.py:184](code/src/stages/s3_text_editing.py) still raises `NotImplementedError` for the `"stage_a"` backend slot; new branch will be `"gpt_image"`.

## Next Steps
1. Local: Step 1 of plan — scaffolding pass on `code/src/config.py` (TextEditorConfig knobs), `code/src/stages/s3_text_editing.py:174` (factory branch), and a stub `code/src/models/gpt_image_editor.py`. Smoke-test factory wiring with a no-op editor.
2. Remote: Steps 2–8 — API setup per the tutorial, install `openai>=1.50` in `vc_final` env, implement `edit_text` against `gpt-image-1-mini` for cheap iteration, validate against `test_data/pic.png` (the kraft-paper reference), then run end-to-end with `adv_gpt.yaml` on a 30-frame clip.
3. After implementation: open PR from `feat/gpt_image_backend`.

## Decisions Made
- **D1 endpoint:** `/v1/images/edits` (not generations). Generations was the failure mode that motivated the work.
- **D2 model:** config-driven, default `gpt-image-1.5`. `gpt-image-1-mini` for smoke tests (~70% cheaper than 1.5). `gpt-image-2` available via yaml flip; not the default until pricing/behavior stabilizes.
- **D3 client-side alpha-composite:** ON by default. AnyText2 doesn't need this (trained for masked editing); GPT does (soft-masks the canvas). S5's existing feather covers the canonical→frame quad boundary, NOT the text-region boundary inside the canonical — composite is not redundant. Add `gpt_image_client_composite` flag for future opt-out.
- **D4 adaptive mask:** skip; revisit only if testing shows long-to-short failures.
- **D5 secrets:** `OPENAI_API_KEY` env var only. Never YAML.
- **D6 ROI context:** reuse existing `roi_context_expansion: 0.3`.
- **Reuse strategy:** inline a slimmer ROI prep into the new file rather than extracting a shared module — AnyText2's `_prepare_roi` is tightly coupled to its 64-alignment; GPT only needs a min-size upscale. Premature abstraction not worth the cost of 30 duplicated lines.

## Open Questions
- `gpt-image-2` pricing is not yet on third-party trackers as of this session. Confirm at API-setup time on the remote machine; if 2 is meaningfully better at similar cost, default may flip from 1.5.
- Whether `roi_context_expansion: 0.3` (currently shared with AnyText2) is the right value for GPT — may want a separate `gpt_image_roi_context_expansion` knob if testing shows the optimum diverges.
- Mask boundary fidelity even after client-side composite: 2-px feather may not be enough on high-contrast text edges. May need to fall back to Hi-SAM-shrunk masks (already wired in S4) if visible.
