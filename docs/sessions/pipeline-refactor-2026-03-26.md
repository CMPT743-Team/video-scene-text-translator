# Session: Pipeline Architecture Refactor — 2026-03-26

## Completed
- Full pipeline walkthrough: understood all 5 stages' I/O, algorithms, and gaps vs STRIVE paper
- Refactored pipeline to STRIVE's frontalization-first design (8 atomic commits on `refactor/pipeline-architecture`, merged to master)
- S1: split 256-line monolith into `detector.py`, `tracker.py`, `selector.py`, `stage.py`; moved optical flow gap-filling from S2
- S2: homographies now map to canonical frontal rectangle (not reference perspective); H stored on TextDetection; FrameHomography eliminated
- S3: warps reference ROI to frontal before editing
- S4: frontalizes frame ROIs before histogram matching (pixel-aligned comparison)
- S5: reads H from TextDetection (no more `all_homographies` param); bounded-region warp instead of full-frame
- Config: optical flow params migrated from FrontalizationConfig to DetectionConfig
- Data cleanup: `reference_quad` converted to property, `min_inliers` dead field removed
- Code review: 7 findings, all fixed. 129 tests passing, lint clean.
- Updated `docs/architecture.md` with new design, limitations, and open questions

## Current State
- 129 tests, ruff clean, on master branch
- Pipeline aligned with STRIVE flow: frontalize → edit → propagate (aligned) → de-frontalize
- Classical CV throughout (homography, histogram matching) — no ML models yet
- Stage A: placeholder editor only (RS-STE / AnyText2 not integrated)
- easyocr and googletrans still NOT installed in conda env

## Next Steps
1. Integrate real Stage A model (RS-STE or AnyText2) — subclass BaseTextEditor
2. Install easyocr + googletrans and test end-to-end on real video
3. Stage C planning: STTN/TPM integration (if in scope for Apr 3)
4. Evaluation metrics and cross-model comparison

## Decisions Made
- **Canonical rectangle over reference perspective** — gives Stage A models clean frontal input, enables pixel-aligned S4 comparison. Canonical size derived from reference quad's average edge lengths.
- **Matrices only, warp on-the-fly** — S2 stores 3×3 matrices; downstream stages warp when needed. Avoids memory bloat.
- **Gap-filling belongs in S1** — it's tracking (where is the text?), not frontalization (what's its perspective?)
- **Keep future items classical-only** — per-pixel lighting ratio needs inpainting (out of scope), temporal smoothing needs homography decomposition (no evidence of jitter yet), both deferred
- **reference_quad as property** — derived from `detections[reference_frame_idx].quad`, no duplicate state
- **Config split** — optical flow params in DetectionConfig (S1 owns tracking), homography params in FrontalizationConfig (S2 owns geometry)

## Open Questions
- Which Stage A model to integrate first (RS-STE vs AnyText2)?
- Is Stage C (STTN/TPM) in scope for Apr 3, or just evaluation of Stage B?
- Gap-filling propagates to ALL frames including occluded — acceptable for demo, needs validation for production
