# Plan: GPT-Image Stage A Backend

## Goal
Add a new Stage A text-editor backend that calls OpenAI's `gpt-image-1.5`
(via `/v1/images/edits`) as an alternative to AnyText2. Motivated by
side-by-side observation: ChatGPT app produces near-perfect scene-text
edits on kraft-paper / dot-grid backgrounds where AnyText2 struggles.
Reproducing app-quality output requires hitting the *edits* endpoint
(not generations), passing a proper alpha mask, and **client-side
alpha-compositing the model output back onto the original ROI** — the
"pixel-perfect outside the mask" guarantee that the app provides
implicitly.

## Approach

Plan locally on `master`-derived `feat/gpt_image_backend`; implement on
the remote machine where `OPENAI_API_KEY` and a payment method live.

### Six design decisions (settled)

1. **Endpoint = `/v1/images/edits`** (image + RGBA mask + prompt).
   Generations endpoint is the failure mode that originally motivated
   this plan. Reject.
2. **Model = config-driven, default `gpt-image-1.5`.** Cheaper, faster,
   and higher-quality than `gpt-image-1` per OpenAI's own data
   (~20% cheaper output token, 4× faster, better benchmarks). Allow
   `gpt-image-1`, `gpt-image-1-mini` (smoke testing — ~70% cheaper than
   1.5), and `gpt-image-2` (when pricing surfaces) via a single
   `text_editor.gpt_image_model` yaml string.
3. **Client-side alpha-composite ON by default.** `gpt-image-*` is
   widely reported to "soft-mask" and re-render the whole canvas even
   with `input_fidelity:"high"`. AnyText2 doesn't need this because
   it's trained for masked editing — GPT does. S5's existing feather
   covers the canonical→frame quad boundary, NOT the text-region
   boundary inside the canonical, so the composite is not redundant
   with S5. Add `gpt_image_client_composite: bool = True` so a future
   model that respects masks can disable.
4. **Skip the AnyText2 adaptive-mask flow.** Add only if testing shows
   GPT fails on long-to-short translations.
5. **Secrets via `OPENAI_API_KEY` env var**, never YAML. Mirrors the
   `translation.api_key: null` pattern. Validator errors loud if the
   env var is missing when backend is selected.
6. **Reuse `text_editor.roi_context_expansion: 0.3`** — same knob as
   AnyText2 so both backends share the cropping behavior.

### Architecture fit

The Stage A integration boundary is `BaseTextEditor.edit_text(roi_image,
target_text, edit_region) -> np.ndarray` ([base_text_editor.py:18](code/src/models/base_text_editor.py)).
Drop the new backend behind that ABC; the factory in
[s3_text_editing.py:174](code/src/stages/s3_text_editing.py) already
has a `"stage_a"` slot that currently raises NotImplementedError —
replace it with a `"gpt_image"` branch. No upstream (S2) or downstream
(S4 LCM/BPN, S5 composite) changes needed.

### Reuse from `anytext2_editor.py`

The 700-line AnyText2 editor contains useful pure helpers:
- `_prepare_roi(image, min_gen_size)` — upscale + 64-align + pad with
  `BORDER_REPLICATE`, returns `(prepared_image, content_rect, scale)`.
  GPT's edits endpoint works at any size up to 4096 and doesn't have
  the 64-alignment requirement, so the GPT backend doesn't need this
  helper directly — but the upscale-small-ROI logic + content_rect
  bookkeeping pattern is worth mirroring.
- `_extract_text_color(image)` — returns `#rrggbb`. GPT prompt benefits
  from including the dominant text color verbatim.

Refactor decision: **inline a slimmer ROI-prep into the new file**
rather than over-engineering a shared module. AnyText2's `_prepare_roi`
is tightly tuned to AnyText2's 64-alignment quirk; GPT only needs a
min-size upscale. Premature abstraction has a higher cost than 30
duplicated lines.

### API setup + billing tutorial (will live in this plan)

For the remote-machine setup. Run through this BEFORE coding:

1. **Account + payment.** platform.openai.com → Settings → Billing
   → add a credit card. OpenAI billing is independent from the
   AnyText2 server.
2. **Spend cap.** Settings → Limits → set monthly hard cap (e.g. $20)
   and soft-cap email at $10 *before* the first call. A 500-frame
   video at 2 ROIs/frame on `gpt-image-1.5` high quality is roughly
   $130; the cap is your guardrail against runaway iteration.
3. **API key.** Settings → API keys → "Create new secret key" → copy
   `sk-...` once (never shown again).
4. **Org verification.** `gpt-image-*` requires org verification
   (OpenAI ID/phone). Do this before the smoke test or the call will
   403.
5. **Env var on the remote machine.** Add to your shell profile:
   ```
   export OPENAI_API_KEY="sk-..."
   ```
   Or store in `~/.openai/key` and source it. **Never** put it in any
   `code/config/*.yaml` — those get committed.
6. **SDK install.** `pip install openai>=1.50` inside the `vc_final`
   conda env. Use `third_party/install_openai.sh` for a reproducible
   install command.
7. **Smoke test.** Before plumbing into the pipeline:
   ```python
   from openai import OpenAI
   client = OpenAI()
   with open("test.png", "rb") as img, open("mask.png", "rb") as mask:
       r = client.images.edit(
           model="gpt-image-1-mini",  # cheap for smoke
           image=img,
           mask=mask,
           prompt='handwritten English word "Example" in black ink',
           input_fidelity="high",
           quality="low",
           size="1024x1024",
       )
   ```
   Confirm `r.data[0].b64_json` is non-empty and the result image
   preserves background. **Mask polarity:** transparent (alpha=0) =
   edit; opaque = preserve. Trust the OpenAI spec, not third-party
   guides that have it inverted.
8. **Concurrency + 429s.** The SDK has built-in retry with backoff.
   Cap concurrent in-flight requests with a `threading.Semaphore(4)`
   in the editor — fan-out from S3's per-track loop will otherwise
   trip rate limits.
9. **Cost telemetry.** Each response includes a `usage` field. Log
   per-call cost so a post-mortem can attribute spend. Keep a
   running total in the editor instance, log on `__del__`.

### Pricing reference (early 2026, per 1024×1024 output)

| Model | Low | Medium | High |
|---|---|---|---|
| gpt-image-1 | ~$0.011 | — | ~$0.167 |
| gpt-image-1.5 | $0.009 | $0.034 | $0.133 |
| gpt-image-1-mini | $0.005 | — | $0.036 |

`/edits` adds ~$0.01–0.03 per call for input-image + prompt tokens.
Batch API halves rates (out of scope for this plan; useful future
optimization).

## Files to Change

### Code

- [ ] (new) `code/src/models/gpt_image_editor.py` — `class
  GPTImageEditor(BaseTextEditor)`. Lazy-imports `openai`, calls
  `client.images.edit` with image + RGBA mask + prompt, alpha-composites
  the result back onto the original ROI using the same mask. Threading
  semaphore for concurrency cap. Cost-telemetry log. ~250–300 lines.
- [ ] `code/src/stages/s3_text_editing.py:174` — replace the
  `NotImplementedError` `"stage_a"` branch with a `"gpt_image"` branch
  that constructs `GPTImageEditor(self.config)`.
- [ ] `code/src/config.py:271` — extend `TextEditorConfig`:
  ```
  gpt_image_model: str = "gpt-image-1.5"
  gpt_image_quality: str = "high"          # low | medium | high | auto
  gpt_image_input_fidelity: str = "high"   # low | high (1.x only)
  gpt_image_size: str = "auto"             # auto | 1024x1024 | 1024x1536 | 1536x1024
  gpt_image_mask_feather_px: int = 2
  gpt_image_client_composite: bool = True
  gpt_image_max_concurrency: int = 4
  gpt_image_request_timeout_s: int = 120
  ```
  Plus validator: `backend == "gpt_image"` requires `OPENAI_API_KEY`
  in `os.environ`; raise with a clear message pointing at the tutorial.
- [ ] (new) `code/src/models/_gpt_image_prompt.py` — small helper for
  building the prompt string from `target_text` + extracted text color
  + a fixed style-preservation suffix. Pure function, easy to test.

### Config

- [ ] (new) `code/config/adv_gpt.yaml` — copy of `adv.yaml` with
  `text_editor.backend: "gpt_image"`. Lets the teammate switch backends
  by changing `--config` rather than editing yaml in place.

### Third-party

- [ ] (new) `third_party/install_openai.sh` — single-line
  `pip install 'openai>=1.50'` with conda-env activation prelude
  matching the other install scripts.

### Tests

- [ ] (new) `code/tests/models/test_gpt_image_editor.py` — mocks the
  `openai` client. Verifies (1) endpoint = `images.edit` not
  `images.generate`; (2) RGBA mask polarity (transparent = edit area);
  (3) `input_fidelity="high"` is passed; (4) alpha-composite preserves
  pixels outside the mask byte-identical when composite flag on;
  (5) raises clear error when `OPENAI_API_KEY` is missing;
  (6) concurrency semaphore caps in-flight calls.
- [ ] (new) `code/tests/models/test_gpt_image_editor_e2e.py` — gated by
  `pytest.mark.skipif(not os.environ.get("OPENAI_API_KEY"))`. Single
  real call against `gpt-image-1-mini` low quality on a tiny ROI to
  confirm wire-up; logged cost should be < $0.01 per run. Skipped in
  CI by default.

### Docs

- [ ] `code/CLAUDE.md` (or root) — add `gpt-image` row to the Stack
  table and a Gotchas entry: "OPENAI_API_KEY required for gpt_image
  backend; never put the key in YAML."

## Risks

- **Soft-mask still bleeds even with composite.** The composite paste-back
  guarantees pixels outside the mask are byte-identical. But pixels
  *inside* the mask, near the boundary, are GPT's output — which can
  carry color/lighting that doesn't match the surrounding scene. The
  2-px feather (`gpt_image_mask_feather_px`) softens this. If still
  visible, fall back to D4 (adaptive-mask flow) or shrink the mask to
  the literal text strokes via Hi-SAM (already wired in S4).
- **Mask polarity bugs are silent.** OpenAI's spec says transparent=edit;
  several third-party guides invert it. Test #2 above pins polarity in
  CI so this can't drift.
- **Org-verification gating.** `gpt-image-*` calls 403 without
  verification; error is unambiguous but the first-time-on-remote
  failure can still cost a debugging hour. Tutorial step 4 calls this
  out.
- **Cost spike on long videos.** A 1500-frame video × 3 ROIs × 1.5-high
  ≈ $600. The hard cap at $20 is non-negotiable for the project budget;
  plan to use `gpt-image-1-mini` at `low` quality for any full-video
  iteration and reserve `1.5/high` for the final render.
- **Rate-limit tail latency.** Per-track fan-out without a concurrency
  cap will hit 429s on TPM (tokens-per-minute) bucket. The semaphore
  is the mitigation; if 429s persist, drop max_concurrency to 2.
- **No streaming/long-poll.** `images.edit` blocks for 5–30s per call.
  S3's per-track wraps + 30s heartbeats (from the prior liveness work)
  already cover this — the watchdog log will surface a wedged GPT
  call within 180s.
- **Output format drift.** `gpt-image-1.5` returns base64 PNG by
  default; `gpt-image-2` may default to a URL or different encoding.
  Code should handle both (`b64_json` vs `url`) and fall back loudly.

## Done When

- [ ] Single-call smoke test on `gpt-image-1-mini` returns a non-empty
  result with byte-identical pixels outside the mask (verified
  programmatically).
- [ ] Same kraft-paper test image as the screenshot the teammate sent
  produces an "Example"-replaced output that visually matches the
  ChatGPT app result (subjective, but the bar is set by that screenshot).
- [ ] Pipeline run with `--config config/adv_gpt.yaml` on a 30-frame
  test clip completes end-to-end with `gpt-image-1-mini` and produces
  a watchable output. Cost logged < $0.50.
- [ ] Same run with `text_editor.gpt_image_model: gpt-image-1.5,
  quality: high` produces visibly better text rendering than the
  AnyText2 baseline on the same clip.
- [ ] All unit tests pass (`cd code && python -m pytest tests/ -v`).
  E2E test is gated on `OPENAI_API_KEY` and skipped in normal runs.
- [ ] Lint clean (`ruff check code/`).
- [ ] Code review approved (`@reviewer`).
- [ ] Atomic commits — split: (1) config + ABC plumbing,
  (2) editor implementation, (3) tests, (4) install script + docs.

## Progress

- [ ] Step 1 — local: scaffolding + config + factory branch
  (`config.py`, `s3_text_editing.py`, empty `gpt_image_editor.py`
  with imports + class skeleton). Smoke-test the factory wiring with
  a stub backend that returns the input unchanged.
- [ ] Step 2 — remote: API setup + billing per the tutorial above.
  One-time. Verify smoke test in Python REPL works before continuing.
- [ ] Step 3 — remote: implement `GPTImageEditor.edit_text` —
  resize/upscale, build RGBA mask, call `images.edit`, decode b64,
  alpha-composite, return BGR. Iterate against the kraft-paper
  reference image until output matches the app screenshot.
- [ ] Step 4 — remote: prompt-helper module + dominant-color
  extraction. A/B with and without color hint in the prompt.
- [ ] Step 5 — remote: concurrency cap + cost telemetry + retry
  hardening. Verify under fan-out from a 30-frame multi-track video.
- [ ] Step 6 — remote: tests (unit with mocks; gated e2e).
- [ ] Step 7 — remote: end-to-end run on 30-frame clip with
  `adv_gpt.yaml`. Compare side-by-side against AnyText2 output.
- [ ] Step 8 — remote: review (`@reviewer`), commit splits, push.
