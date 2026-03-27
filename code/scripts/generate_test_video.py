#!/usr/bin/env python3
"""Generate a synthetic test video with plain text for end-to-end pipeline testing.

Creates a 3-second, 30fps video (90 frames) with "HELLO WORLD" in black text
on a white background. A subtle camera pan (5px drift) gives the tracker
something to work with.

Usage:
    python code/scripts/generate_test_video.py [--output path] [--duration 3] [--fps 30]
"""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np


def generate_test_video(
    output_path: str,
    duration: float = 3.0,
    fps: int = 30,
    width: int = 640,
    height: int = 480,
    text: str = "HELLO WORLD",
) -> None:
    """Generate a synthetic video with centered text and slight camera pan."""
    total_frames = int(duration * fps)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    # Use mp4v codec — universally available on macOS/Linux/Windows
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output), fourcc, fps, (width, height))

    if not writer.isOpened():
        raise RuntimeError(f"Failed to open video writer for {output}")

    # Font settings — large, readable text
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 2.0
    thickness = 4
    text_size, baseline = cv2.getTextSize(text, font, font_scale, thickness)
    text_w, text_h = text_size

    # Center position (baseline reference)
    base_x = (width - text_w) // 2
    base_y = (height + text_h) // 2

    # Subtle pan: 5px horizontal drift over entire video
    max_drift = 5.0

    for i in range(total_frames):
        frame = np.full((height, width, 3), 240, dtype=np.uint8)  # light gray bg

        # Linear horizontal drift
        drift = max_drift * (i / max(total_frames - 1, 1))
        x = int(base_x + drift)
        y = base_y

        cv2.putText(frame, text, (x, y), font, font_scale, (0, 0, 0), thickness)
        writer.write(frame)

    writer.release()
    print(f"Generated {total_frames} frames ({duration}s @ {fps}fps) -> {output}")


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic test video")
    parser.add_argument(
        "--output", type=str, default="test_data/input_test.mp4",
        help="Output video path (default: test_data/input_test.mp4)",
    )
    parser.add_argument("--duration", type=float, default=3.0, help="Duration in seconds")
    parser.add_argument("--fps", type=int, default=30, help="Frames per second")
    args = parser.parse_args()

    generate_test_video(args.output, duration=args.duration, fps=args.fps)


if __name__ == "__main__":
    main()
