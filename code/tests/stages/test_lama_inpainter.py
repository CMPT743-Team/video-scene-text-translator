"""Unit tests for LaMaInpainter (mocked TorchScript model)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import numpy as np
import pytest
import torch

from src.stages.s4_propagation.lama_inpainter import LaMaInpainter


@pytest.fixture
def mock_lama_model():
    """A mock TorchScript model that returns a plausible (1,3,H,W) tensor."""
    model = MagicMock()
    model.eval = MagicMock()

    def forward(image: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        # image is (1, 3, H, W), mask is (1, 1, H, W); return (1, 3, H, W) in [0, 1]
        b, _, h, w = image.shape
        return torch.full((b, 3, h, w), 0.5)

    model.side_effect = forward
    return model


@pytest.fixture
def lama_inpainter(mock_lama_model):
    """LaMaInpainter with a mocked model (no checkpoint needed)."""
    inpainter = LaMaInpainter(checkpoint_path=None, device="cpu")
    inpainter._model = mock_lama_model
    return inpainter


class TestLaMaInpainterFlags:
    def test_uses_text_mask_is_true(self):
        assert LaMaInpainter.uses_text_mask is True

    def test_raises_without_model(self):
        inpainter = LaMaInpainter(checkpoint_path=None, device="cpu")
        roi = np.zeros((64, 128, 3), dtype=np.uint8)
        mask = np.zeros((64, 128), dtype=np.uint8)
        with pytest.raises(RuntimeError, match="no model loaded"):
            inpainter.inpaint(roi, text_mask=mask)

    def test_raises_without_mask(self, lama_inpainter):
        roi = np.zeros((64, 128, 3), dtype=np.uint8)
        with pytest.raises(ValueError, match="requires a text_mask"):
            lama_inpainter.inpaint(roi, text_mask=None)


class TestLaMaInpainterInference:
    def test_output_shape_matches_input(self, lama_inpainter):
        roi = np.random.randint(0, 255, (100, 200, 3), dtype=np.uint8)
        mask = np.random.choice([0, 255], size=(100, 200)).astype(np.uint8)
        result = lama_inpainter.inpaint(roi, text_mask=mask)
        assert result.shape == (100, 200, 3)
        assert result.dtype == np.uint8

    def test_small_roi_upscaled(self, lama_inpainter):
        """ROIs smaller than 256px should be upscaled before inference."""
        roi = np.random.randint(0, 255, (32, 64, 3), dtype=np.uint8)
        mask = np.full((32, 64), 255, dtype=np.uint8)
        result = lama_inpainter.inpaint(roi, text_mask=mask)
        # Output should match original size (downscaled back)
        assert result.shape == (32, 64, 3)

    def test_large_roi_not_upscaled(self, lama_inpainter):
        """ROIs >= 256px should not be upscaled."""
        roi = np.random.randint(0, 255, (256, 512, 3), dtype=np.uint8)
        mask = np.zeros((256, 512), dtype=np.uint8)
        result = lama_inpainter.inpaint(roi, text_mask=mask)
        assert result.shape == (256, 512, 3)

    def test_non_mod8_dimensions_padded(self, lama_inpainter):
        """Dimensions not divisible by 8 should still work (padded internally)."""
        roi = np.random.randint(0, 255, (259, 513, 3), dtype=np.uint8)
        mask = np.zeros((259, 513), dtype=np.uint8)
        result = lama_inpainter.inpaint(roi, text_mask=mask)
        assert result.shape == (259, 513, 3)

    def test_output_is_bgr_uint8(self, lama_inpainter):
        roi = np.random.randint(0, 255, (256, 256, 3), dtype=np.uint8)
        mask = np.full((256, 256), 128, dtype=np.uint8)
        result = lama_inpainter.inpaint(roi, text_mask=mask)
        assert result.dtype == np.uint8
        assert result.ndim == 3
        assert result.shape[2] == 3


class TestLaMaLoadModel:
    @patch("src.stages.s4_propagation.lama_inpainter.torch.jit.load")
    def test_load_model_sets_device(self, mock_jit_load):
        mock_model = MagicMock()
        mock_jit_load.return_value = mock_model
        inpainter = LaMaInpainter(checkpoint_path=None, device="cpu")
        inpainter.load_model("/fake/path.pt", device="cpu")
        mock_jit_load.assert_called_once_with("/fake/path.pt", map_location=torch.device("cpu"))
        mock_model.eval.assert_called_once()
        assert inpainter._model is mock_model
