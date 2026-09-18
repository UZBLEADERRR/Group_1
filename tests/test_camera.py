"""
Unit Tests for SmartRoom AI - Camera Module (Milestone 1)
"""

import unittest
import time
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.camera.webcam import WebcamStream


class TestWebcamStream(unittest.TestCase):
    def setUp(self):
        self.stream = WebcamStream(
            camera_index=0,
            frame_width=1280,
            frame_height=720,
            target_fps=15,
            auto_reconnect=True,
        )

    def tearDown(self):
        if self.stream.is_running:
            self.stream.stop()

    def test_camera_initialization(self):
        """Test webcam stream initialization and properties."""
        self.assertEqual(self.stream.camera_index, 0)
        self.assertEqual(self.stream.frame_width, 1280)
        self.assertEqual(self.stream.frame_height, 720)
        self.assertEqual(self.stream.target_fps, 15)
        self.assertFalse(self.stream.is_running)

    def test_camera_discovery(self):
        """Test device scanning returns a valid list."""
        cameras = self.stream.discover_cameras(max_test=2)
        self.assertIsInstance(cameras, list)

    def test_camera_start_and_frame_capture(self):
        """Test starting camera and capturing consecutive frames."""
        started = self.stream.start()
        self.assertTrue(started)
        self.assertTrue(self.stream.is_running)

        success, frame = self.stream.read_frame()
        self.assertTrue(success)
        self.assertIsNotNone(frame)
        self.assertGreaterEqual(self.stream.frame_count, 1)

    def test_fps_calculation_and_pacing(self):
        """Test that frame reading respects target pacing and tracks FPS."""
        self.stream.start()
        start_t = time.time()
        frames_to_read = 3
        for _ in range(frames_to_read):
            self.stream.read_frame()
        elapsed = time.time() - start_t

        # At 15 FPS, 3 frames should take at least ~0.12s
        self.assertGreater(elapsed, 0.08)
        self.assertEqual(self.stream.frame_count, frames_to_read)

    def test_graceful_stop_and_status(self):
        """Test camera stopping and diagnostic health reporting."""
        self.stream.start()
        self.stream.read_frame()
        status = self.stream.get_status()

        self.assertIn("connected", status)
        self.assertIn("resolution", status)
        self.assertIn("actual_fps", status)
        self.assertIn("frames_captured", status)

        self.stream.stop()
        self.assertFalse(self.stream.is_running)


if __name__ == "__main__":
    unittest.main(verbosity=2)
