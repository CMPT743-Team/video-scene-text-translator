"""Stage 2: Frontalization.

Computes homography from each frame's quad to a canonical frontal
rectangle and stores the matrices in TextDetection fields.
"""

from __future__ import annotations

import logging

from src.config import PipelineConfig
from src.data_types import TextTrack
from src.utils.geometry import canonical_rect_from_quad, compute_homography

logger = logging.getLogger(__name__)


class FrontalizationStage:
    def __init__(self, config: PipelineConfig):
        self.config = config.frontalization

    def compute_homographies(
        self,
        track: TextTrack,
    ) -> None:
        """Compute homography from each frame's quad to the canonical rect.

        Writes H_to_frontal and H_from_frontal directly into each
        TextDetection. Also sets track.canonical_size.

        The canonical rectangle is derived from the reference quad's
        dimensions (average edge lengths), and all frames map to this
        same canonical space.
        """
        if track.reference_quad is None:
            logger.warning(
                "Track %d has no reference quad, skipping", track.track_id
            )
            return

        try:
            dst_points, canonical_size = canonical_rect_from_quad(
                track.reference_quad
            )
        except ValueError:
            logger.warning(
                "Track %d has degenerate reference quad, skipping",
                track.track_id,
            )
            return

        track.canonical_size = canonical_size

        for _frame_idx, det in track.detections.items():
            grid = det.tracked_grid_points
            if grid is not None and grid.shape[0] > 4:
                # Multi-point homography fitting: use all tracked grid
                # points (4 corners + N×N interior) for a least-squares /
                # RANSAC fit. Generate matching destination grid points on
                # the canonical rectangle using the same bilinear layout.
                from src.stages.s1_detection.tracker import generate_quad_grid

                grid_size = int(round((grid.shape[0] - 4) ** 0.5))
                dst_grid = generate_quad_grid(dst_points, grid_size)
                src_pts = grid
                dst_pts = dst_grid
            else:
                src_pts = det.quad.points
                dst_pts = dst_points

            H_to_frontal, H_from_frontal, is_valid = compute_homography(
                src_points=src_pts,
                dst_points=dst_pts,
                method=self.config.homography_method,
                ransac_threshold=self.config.ransac_reproj_threshold,
            )
            det.H_to_frontal = H_to_frontal
            det.H_from_frontal = H_from_frontal
            det.homography_valid = is_valid

    def run(
        self,
        tracks: list[TextTrack],
    ) -> list[TextTrack]:
        """Compute canonical homographies for all tracks.

        Args:
            tracks: TextTracks with dense detections (gap-filled by S1).

        Returns:
            Same tracks with homography fields populated on each detection.
        """
        logger.info("S2: Computing frontalization for %d tracks", len(tracks))

        for track in tracks:
            self.compute_homographies(track)

        return tracks
