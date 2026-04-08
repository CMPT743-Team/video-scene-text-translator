"""Abstract base class for background inpainting models.

Any inpainter that produces a text-removed background ROI in canonical
frontal space must subclass BaseBackgroundInpainter. The s4 propagation
stage and the LCM consume the output via TextDetection.inpainted_background.

Multiple backends can plug in here (SRNet's B sub-network, LaMa, MAT, etc.)
without changing the rest of the pipeline.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np


class BaseBackgroundInpainter(ABC):
    """Abstract interface for text-removal/background inpainting models."""

    # Whether this backend uses an explicit text mask for inpainting.
    # Subclasses that need a mask (e.g. LaMa) should set this to True.
    # When True, S4 generates a binary text mask via Otsu thresholding
    # and passes it to inpaint().
    uses_text_mask: bool = False

    @abstractmethod
    def inpaint(
        self,
        canonical_roi: np.ndarray,
        *,
        text_mask: np.ndarray | None = None,
    ) -> np.ndarray:
        """Remove text from a canonical-frontal ROI and return its background.

        Args:
            canonical_roi: BGR image of the frontalized text region
                (H x W x 3, uint8). Already warped to canonical space by S2.
            text_mask: Optional binary mask (H x W, uint8, 0/255) indicating
                text pixels. Only provided when ``uses_text_mask`` is True.

        Returns:
            BGR image of the same shape as `canonical_roi` (H x W x 3, uint8)
            with the text strokes erased and replaced by plausible
            background texture.
        """
        ...

    def load_model(self, model_path: str, device: str = "cpu") -> None:  # noqa: B027
        """Optionally load model weights. No-op default for stub backends."""
        pass
