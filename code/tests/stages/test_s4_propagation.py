"""Tests for Stage 4: Propagation."""

from unittest.mock import MagicMock, patch

import cv2
import numpy as np
import pytest

from src.data_types import Quad, TextDetection, TextTrack
from src.stages.s4_propagation import PropagationStage
from src.stages.s4_propagation.base_inpainter import BaseBackgroundInpainter


@pytest.fixture
def propagation_stage(default_config):
    return PropagationStage(default_config)


class TestPropagateToFrame:
    def test_output_shape_preserved(self, propagation_stage):
        edited = np.random.randint(0, 255, (50, 100, 3), dtype=np.uint8)
        target = np.random.randint(0, 255, (50, 100, 3), dtype=np.uint8)
        result = propagation_stage.propagate_to_frame(edited, target)
        assert result.shape == edited.shape

    def test_different_size_target_resized(self, propagation_stage):
        edited = np.random.randint(0, 255, (50, 100, 3), dtype=np.uint8)
        target = np.random.randint(0, 255, (80, 150, 3), dtype=np.uint8)
        result = propagation_stage.propagate_to_frame(edited, target)
        assert result.shape == edited.shape


class TestAlphaMask:
    def test_shape(self, propagation_stage):
        mask = propagation_stage._create_alpha_mask((50, 100))
        assert mask.shape == (50, 100)
        assert mask.dtype == np.float32

    def test_center_is_one(self, propagation_stage):
        mask = propagation_stage._create_alpha_mask((100, 200))
        assert mask[50, 100] == 1.0

    def test_edges_less_than_center(self, propagation_stage):
        mask = propagation_stage._create_alpha_mask((100, 200))
        assert mask[0, 0] < mask[50, 100]
        assert mask[0, 100] < mask[50, 100]

    def test_values_in_range(self, propagation_stage):
        mask = propagation_stage._create_alpha_mask((80, 120))
        assert mask.min() >= 0.0
        assert mask.max() <= 1.0


class TestPropagationRun:
    def test_produces_propagated_rois(self, propagation_stage, synthetic_frame):
        quad = Quad(points=np.array([
            [200, 150], [440, 150], [440, 250], [200, 250]
        ], dtype=np.float32))
        det = TextDetection(
            frame_idx=0, quad=quad, bbox=quad.to_bbox(),
            text="HELLO", ocr_confidence=0.9,
        )
        edited_roi = np.full((100, 240, 3), 128, dtype=np.uint8)
        track = TextTrack(
            track_id=0, source_text="HELLO", target_text="HOLA",
            source_lang="en", target_lang="es",
            detections={0: det},
            reference_frame_idx=0,

            edited_roi=edited_roi,
        )
        frames = {0: synthetic_frame}
        result = propagation_stage.run([track], frames)
        assert 0 in result
        assert len(result[0]) == 1
        assert result[0][0].roi_image.shape[:2] == edited_roi.shape[:2]

    def test_skips_track_without_edited_roi(self, propagation_stage):
        track = TextTrack(
            track_id=0, source_text="A", target_text="B",
            source_lang="en", target_lang="es",
            detections={},
            edited_roi=None,
        )
        result = propagation_stage.run([track], {})
        assert result == {}

    def test_uses_frontalized_roi_when_homography_available(self, default_config):
        """When H_to_frontal is set, S4 should warp frame to canonical via warpPerspective."""
        stage = PropagationStage(default_config)
        frame = np.full((200, 300, 3), 100, dtype=np.uint8)

        quad = Quad(points=np.array([
            [50, 50], [250, 50], [250, 150], [50, 150]
        ], dtype=np.float32))
        H = np.eye(3, dtype=np.float64)
        det = TextDetection(
            frame_idx=0, quad=quad, bbox=quad.to_bbox(),
            text="HELLO", ocr_confidence=0.9,
            H_to_frontal=H,
            H_from_frontal=H,
            homography_valid=True,
        )
        edited_roi = np.full((80, 180, 3), 150, dtype=np.uint8)
        track = TextTrack(
            track_id=0, source_text="HELLO", target_text="HOLA",
            source_lang="en", target_lang="es",
            detections={0: det},
            reference_frame_idx=0,

            canonical_size=(180, 80),
            edited_roi=edited_roi,
        )
        with patch("src.stages.s4_propagation.stage.cv2.warpPerspective",
                    wraps=cv2.warpPerspective) as mock_warp:
            result = stage.run([track], {0: frame})

        # Verify warpPerspective was called for the frontalization path.
        # S4 may warp twice when the reference detection is also a target
        # (once to set up LCM ref background, once during the per-detection
        # loop), so we just check that every call used the right H + size.
        assert mock_warp.call_count >= 1
        for call in mock_warp.call_args_list:
            np.testing.assert_array_equal(call.args[1], H)
            assert call.args[2] == (180, 80)

        assert 0 in result
        assert len(result[0]) == 1
        assert result[0][0].roi_image.shape == (80, 180, 3)

    def test_falls_back_to_bbox_when_no_homography(self, default_config, synthetic_frame):
        """Without homography, S4 should fall back to bbox crop."""
        stage = PropagationStage(default_config)
        quad = Quad(points=np.array([
            [200, 150], [440, 150], [440, 250], [200, 250]
        ], dtype=np.float32))
        det = TextDetection(
            frame_idx=0, quad=quad, bbox=quad.to_bbox(),
            text="HELLO", ocr_confidence=0.9,
            # No homography fields set — defaults to None/False
        )
        edited_roi = np.full((100, 240, 3), 128, dtype=np.uint8)
        track = TextTrack(
            track_id=0, source_text="HELLO", target_text="HOLA",
            source_lang="en", target_lang="es",
            detections={0: det},
            reference_frame_idx=0,

            edited_roi=edited_roi,
        )
        result = stage.run([track], {0: synthetic_frame})
        assert 0 in result
        assert len(result[0]) == 1
        assert result[0][0].roi_image.shape[:2] == edited_roi.shape[:2]

    def test_falls_back_when_homography_invalid(self, default_config, synthetic_frame):
        """Even with H_to_frontal set, if homography_valid=False, fall back to bbox."""
        stage = PropagationStage(default_config)
        quad = Quad(points=np.array([
            [200, 150], [440, 150], [440, 250], [200, 250]
        ], dtype=np.float32))
        det = TextDetection(
            frame_idx=0, quad=quad, bbox=quad.to_bbox(),
            text="HELLO", ocr_confidence=0.9,
            H_to_frontal=np.eye(3, dtype=np.float64),
            H_from_frontal=np.eye(3, dtype=np.float64),
            homography_valid=False,  # marked invalid
        )
        edited_roi = np.full((100, 240, 3), 128, dtype=np.uint8)
        track = TextTrack(
            track_id=0, source_text="HELLO", target_text="HOLA",
            source_lang="en", target_lang="es",
            detections={0: det},
            reference_frame_idx=0,

            canonical_size=(240, 100),
            edited_roi=edited_roi,
        )
        result = stage.run([track], {0: synthetic_frame})
        assert 0 in result
        assert len(result[0]) == 1
        # Should still match edited_roi shape via bbox fallback
        assert result[0][0].roi_image.shape[:2] == edited_roi.shape[:2]


class TestGenerateTextMask:
    """Tests for PropagationStage._generate_text_mask()."""

    def test_returns_binary_uint8(self):
        """Mask should be uint8 with only 0 and 255 values."""
        roi = np.full((64, 128, 3), 200, dtype=np.uint8)
        cv2.putText(roi, "AB", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 2)
        mask = PropagationStage._generate_text_mask(roi)
        assert mask.dtype == np.uint8
        assert mask.shape == (64, 128)
        assert set(np.unique(mask)).issubset({0, 255})

    def test_text_pixels_are_white(self):
        """On a light background with dark text, text region should be 255."""
        roi = np.full((100, 200, 3), 240, dtype=np.uint8)
        cv2.putText(roi, "TEXT", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 2.0, (10, 10, 10), 3)
        mask = PropagationStage._generate_text_mask(roi)
        # Text center should be white (255)
        assert mask[70, 60] == 255 or mask[50, 60] == 255  # near text region

    def test_auto_invert_dark_background(self):
        """On a dark background with light text, text should still be minority (255)."""
        roi = np.full((100, 200, 3), 20, dtype=np.uint8)
        cv2.putText(roi, "HI", (30, 70), cv2.FONT_HERSHEY_SIMPLEX, 2.0, (240, 240, 240), 3)
        mask = PropagationStage._generate_text_mask(roi)
        # Text (minority) should be white; background should be mostly black
        white_ratio = np.mean(mask == 255)
        assert white_ratio < 0.5  # text is the minority

    def test_uniform_image_returns_all_zeros(self):
        """A uniform image has no text — Otsu falls back to all-zero or all-255, then auto-invert."""
        roi = np.full((64, 64, 3), 128, dtype=np.uint8)
        mask = PropagationStage._generate_text_mask(roi)
        assert mask.shape == (64, 64)
        assert mask.dtype == np.uint8
        # No text means mask should be all-zero (or nearly — dilation can't create mass from nothing)
        assert np.mean(mask == 255) < 0.01


class TestInpainterDispatch:
    """Tests for _get_inpainter() dispatching to the right backend."""

    def test_dispatch_srnet(self, default_config):
        default_config.propagation.inpainter_backend = "srnet"
        default_config.propagation.inpainter_checkpoint_path = None
        stage = PropagationStage(default_config)
        # No checkpoint → returns None with a warning
        result = stage._get_inpainter()
        assert result is None

    def test_dispatch_lama(self, default_config):
        default_config.propagation.inpainter_backend = "lama"
        default_config.propagation.inpainter_checkpoint_path = None
        stage = PropagationStage(default_config)
        # No checkpoint → returns None with a warning
        result = stage._get_inpainter()
        assert result is None

    def test_dispatch_none(self, default_config):
        default_config.propagation.inpainter_backend = "none"
        stage = PropagationStage(default_config)
        assert stage._get_inpainter() is None

    def test_dispatch_unknown_raises(self, default_config):
        default_config.propagation.inpainter_backend = "unknown"
        stage = PropagationStage(default_config)
        with pytest.raises(ValueError, match="Unknown inpainter_backend"):
            stage._get_inpainter()


class TestMaskPassingFlow:
    """Verify that _inpaint() generates and passes masks correctly."""

    def test_mask_passed_when_uses_text_mask_true(self, default_config):
        """When inpainter.uses_text_mask is True, a mask should be generated and passed."""
        stage = PropagationStage(default_config)
        mock_inpainter = MagicMock(spec=BaseBackgroundInpainter)
        mock_inpainter.uses_text_mask = True
        mock_inpainter.inpaint.return_value = np.zeros((64, 128, 3), dtype=np.uint8)

        roi = np.full((64, 128, 3), 200, dtype=np.uint8)
        cv2.putText(roi, "AB", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 2)

        stage._inpaint(mock_inpainter, roi)

        mock_inpainter.inpaint.assert_called_once()
        call_kwargs = mock_inpainter.inpaint.call_args
        assert call_kwargs.kwargs["text_mask"] is not None
        assert call_kwargs.kwargs["text_mask"].shape == (64, 128)

    def test_mask_none_when_uses_text_mask_false(self, default_config):
        """When inpainter.uses_text_mask is False, text_mask should be None."""
        stage = PropagationStage(default_config)
        mock_inpainter = MagicMock(spec=BaseBackgroundInpainter)
        mock_inpainter.uses_text_mask = False
        mock_inpainter.inpaint.return_value = np.zeros((64, 128, 3), dtype=np.uint8)

        roi = np.full((64, 128, 3), 200, dtype=np.uint8)
        stage._inpaint(mock_inpainter, roi)

        call_kwargs = mock_inpainter.inpaint.call_args
        assert call_kwargs.kwargs["text_mask"] is None
