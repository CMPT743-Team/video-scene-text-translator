"""LaMa-based background inpainter (Large Mask Inpainting, WACV 2022).

Loads the ``big-lama.pt`` TorchScript model and performs general-purpose
inpainting using an explicit binary text mask.  Better than SRNet on
textured backgrounds thanks to Fourier convolutions trained on Places365.

Model details:
- Input:  image (1, 3, H, W) float32 RGB [0,1] + mask (1, 1, H, W) float32 [0,1], dims % 8 == 0
- Output: (1, 3, H, W) float32 [0,1]
- Download: see ``third_party/install_lama.sh``
"""

from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np
import torch

from .base_inpainter import BaseBackgroundInpainter

logger = logging.getLogger(__name__)

# Minimum input dimension — LaMa was trained at 256×256.
_MIN_SIZE = 256
# LaMa requires spatial dims divisible by 8.
_PAD_MULTIPLE = 8


class LaMaInpainter(BaseBackgroundInpainter):
    """Background inpainter wrapping LaMa TorchScript model."""

    uses_text_mask: bool = True

    def __init__(
        self,
        checkpoint_path: str | Path | None = None,
        device: str = "cuda" if torch.cuda.is_available() else "cpu",
    ):
        self.device = torch.device(device)
        self._model: torch.jit.ScriptModule | None = None
        if checkpoint_path is not None:
            self.load_model(str(checkpoint_path), device=str(self.device))

    def load_model(self, model_path: str, device: str = "cpu") -> None:
        """Load the ``big-lama.pt`` TorchScript checkpoint."""
        self.device = torch.device(device)
        logger.info("LaMa: loading TorchScript model from %s", model_path)
        self._model = torch.jit.load(model_path, map_location=self.device)
        self._model.eval()

    @torch.no_grad()
    def inpaint(
        self,
        canonical_roi: np.ndarray,
        *,
        text_mask: np.ndarray | None = None,
    ) -> np.ndarray:
        """Remove text using LaMa inpainting.

        Args:
            canonical_roi: BGR uint8 (H, W, 3).
            text_mask: Binary uint8 (H, W), 255 = text pixels to inpaint.

        Returns:
            BGR uint8 (H, W, 3) — same shape as input.
        """
        if self._model is None:
            raise RuntimeError(
                "LaMaInpainter has no model loaded. Pass checkpoint_path "
                "to __init__ or call load_model()."
            )
        if canonical_roi.ndim != 3 or canonical_roi.shape[2] != 3:
            raise ValueError(
                f"Expected (H, W, 3) BGR image, got shape {canonical_roi.shape}"
            )
        if text_mask is None:
            raise ValueError(
                "LaMaInpainter requires a text_mask (uses_text_mask=True)."
            )

        orig_h, orig_w = canonical_roi.shape[:2]

        # --- Upscale small ROIs so min(H,W) >= 256 ---
        scale = 1.0
        if min(orig_h, orig_w) < _MIN_SIZE:
            scale = _MIN_SIZE / min(orig_h, orig_w)
            new_h = int(orig_h * scale)
            new_w = int(orig_w * scale)
            canonical_roi = cv2.resize(
                canonical_roi, (new_w, new_h), interpolation=cv2.INTER_LINEAR
            )
            text_mask = cv2.resize(
                text_mask, (new_w, new_h), interpolation=cv2.INTER_NEAREST
            )

        h, w = canonical_roi.shape[:2]

        # --- BGR → RGB, normalize to [0,1] float32 tensor ---
        rgb = cv2.cvtColor(canonical_roi, cv2.COLOR_BGR2RGB)
        img_t = torch.from_numpy(rgb.astype(np.float32) / 255.0)
        img_t = img_t.permute(2, 0, 1).unsqueeze(0)  # (1, 3, H, W)

        # --- Mask: uint8 [0,255] → float32 [0,1] tensor ---
        mask_f = text_mask.astype(np.float32) / 255.0
        mask_t = torch.from_numpy(mask_f).unsqueeze(0).unsqueeze(0)  # (1, 1, H, W)

        # --- Pad to multiples of 8 (reflect on right/bottom) ---
        pad_h = (_PAD_MULTIPLE - h % _PAD_MULTIPLE) % _PAD_MULTIPLE
        pad_w = (_PAD_MULTIPLE - w % _PAD_MULTIPLE) % _PAD_MULTIPLE
        if pad_h > 0 or pad_w > 0:
            img_t = torch.nn.functional.pad(img_t, (0, pad_w, 0, pad_h), mode="reflect")
            mask_t = torch.nn.functional.pad(mask_t, (0, pad_w, 0, pad_h), mode="constant", value=0.0)

        # --- Forward: image (1, 3, H, W) + mask (1, 1, H, W) as separate args ---
        img_t = img_t.to(self.device)
        mask_t = mask_t.to(self.device)
        out = self._model(img_t, mask_t)  # (1, 3, H_pad, W_pad)

        # --- Crop padding, denormalize, RGB → BGR ---
        out = out[:, :, :h, :w]
        out_np = out.squeeze(0).clamp(0.0, 1.0).cpu().numpy()
        out_np = (out_np * 255.0).astype(np.uint8)
        out_np = np.transpose(out_np, (1, 2, 0))  # (3,H,W) → (H,W,3) RGB
        bgr = cv2.cvtColor(out_np, cv2.COLOR_RGB2BGR)

        # --- Downscale back if we upscaled ---
        if scale > 1.0:
            bgr = cv2.resize(bgr, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)

        return bgr
