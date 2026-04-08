# Plan: Fix LCM Darkening — Separate Global Scale from Spatial Variation

## Context
The LCM (Lighting Correction Module) systematically darkens edited text ROIs by ~8-9 intensity points. Root cause: neural inpainters (SRNet & LaMa) produce backgrounds that are slightly darker than real backgrounds (regression-to-mean). This bias enters the per-pixel ratio map `target_bg / ref_bg`, making the mean ratio < 1.0, which darkens the edited ROI.

Pure log-domain mean-centering would fix the bias but also remove legitimate global lighting changes (e.g., scene getting darker as camera moves into shadow). We need to separate the two concerns.

## Goal
Fix the LCM darkening bias while preserving both spatial lighting variation (shadows, gradients) and legitimate global lighting changes across frames.

## Approach

### Decompose the ratio into spatial variation + global scale

```
final_ratio = normalized_spatial_ratio × global_scale
```

1. **Spatial variation** — from inpainted backgrounds (ratio map), mean-centered per-channel in log-domain to remove inpainting bias
2. **Global lighting change** — from raw canonical ROIs (no inpainting, no bias), computed as per-channel mean ratio

### Implementation in `_stable_ratio()` (lighting_correction_module.py, lines 170-183)

```python
def _stable_ratio(
    self, ref_bg: np.ndarray, target_bg: np.ndarray,
    ref_canonical: np.ndarray | None = None,
    target_canonical: np.ndarray | None = None,
) -> np.ndarray:
    ref_f = ref_bg.astype(np.float32) / 255.0
    cur_f = target_bg.astype(np.float32) / 255.0
    eps = self.cfg.eps

    if self.cfg.use_log_domain:
        log_ratio = np.log(cur_f + eps) - np.log(ref_f + eps)
    else:
        log_ratio = np.log((cur_f + eps) / (ref_f + eps))

    if self.cfg.normalize_ratio:
        # Remove inpainting bias: center log-ratio per channel
        for c in range(log_ratio.shape[2]):
            log_ratio[..., c] -= np.mean(log_ratio[..., c])

        # Re-inject global lighting from RAW frames (no inpainting bias)
        if ref_canonical is not None and target_canonical is not None:
            ref_raw = ref_canonical.astype(np.float32) / 255.0
            tgt_raw = target_canonical.astype(np.float32) / 255.0
            for c in range(3):
                global_log_scale = (
                    np.log(np.mean(tgt_raw[..., c]) + eps)
                    - np.log(np.mean(ref_raw[..., c]) + eps)
                )
                log_ratio[..., c] += global_log_scale

    ratio = np.exp(log_ratio)
    ratio = np.clip(ratio, self.cfg.ratio_clip_min, self.cfg.ratio_clip_max)
    return ratio.astype(np.float32)
```

### Data flow changes in `stage.py`

The `correct()` and `compute_ratio_map()` methods need the raw canonical ROIs passed through so `_stable_ratio()` can compute the global scale. The call sites at lines 257-261 already have `ref_canonical` and `target_canonical` available — just need to thread them through.

## Files to Change
- [ ] `code/src/stages/s4_propagation/lighting_correction_module.py`
  - `LCMConfig`: add `normalize_ratio: bool = True`
  - `_stable_ratio()`: add `ref_canonical` + `target_canonical` params, implement centering + global scale
  - `compute_ratio_map()`: accept and pass through raw canonicals
  - `correct()`: accept and pass through raw canonicals
- [ ] `code/src/stages/s4_propagation/stage.py`
  - Update `lcm.correct()` call sites (lines 257-261) to pass `ref_canonical` and `target_canonical`
- [ ] `code/src/config.py`
  - Add `lcm_normalize_ratio: bool = True` to `PropagationConfig` (line ~89)
- [ ] `code/config/adv.yaml`
  - Add `lcm_normalize_ratio: true` (default, can be toggled off)
- [ ] `code/tests/stages/test_s4_propagation.py`
  - Test: normalized ratio has geometric mean ≈ 1.0 per channel
  - Test: global scale from raw frames is re-applied correctly
  - Test: `normalize_ratio: false` preserves original behavior
  - Test: uniform-lit scene produces ratio ≈ 1.0 (no darkening)
  - Test: genuinely darker target produces ratio < 1.0 (darkening preserved)

## Risks
- **Raw canonical text content**: Both raw canonicals contain original scene text. For global mean computation, text pixels contribute noise. Mitigated: same text track across frames → text contribution roughly cancels in the ratio.
- **Very small ROIs**: Mean estimate from 64×64 ROI (~4K pixels) may be noisy. Mitigated: global scale is a single scalar per channel, not spatially varying — low variance even with few pixels.
- **Edge case — all-dark ROI**: If both raw canonicals are near-black, `log(mean + eps)` difference could be noisy. Mitigated: eps prevents log(0), and clipping bounds the final ratio.

## Done When
- [ ] LCM with `normalize_ratio: true` produces no systematic darkening on static-lighting videos
- [ ] LCM with `normalize_ratio: true` correctly darkens text when scene genuinely gets darker
- [ ] LCM with `normalize_ratio: false` matches previous behavior exactly (regression test)
- [ ] All tests pass
- [ ] Lint passes

## Progress
- [ ] Step 1: Add `lcm_normalize_ratio` to config (`config.py` + `adv.yaml`)
- [ ] Step 2: Extend LCM methods to accept raw canonicals, implement centering + global scale
- [ ] Step 3: Thread raw canonicals through `stage.py` call sites
- [ ] Step 4: Write tests
- [ ] Step 5: Run full test suite + lint
