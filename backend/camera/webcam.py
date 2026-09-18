"""
SmartRoom AI - Camera Module
Handles USB Webcam capture, device discovery, resolution/FPS configuration,
and frame streaming with graceful failure handling.
"""

import os
import sys
import time
from typing import Optional, Tuple, Dict, Any, Generator

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False


class WebcamStream:
    """
    Modular webcam capture class for Physical AI SmartRoom.
    Supports physical USB cameras, device discovery, FPS pacing, and graceful fallbacks.
    """

    def __init__(
        self,
        camera_index: int = 0,
        frame_width: int = 1280,
        frame_height: int = 720,
        target_fps: int = 15,
        auto_reconnect: bool = True,
    ):
        self.camera_index = camera_index
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.target_fps = target_fps
        self.auto_reconnect = auto_reconnect

        self.cap = None
        self.is_running = False
        self.frame_count = 0
        self.start_time = 0.0
        self.last_frame_time = 0.0
        self.actual_fps = 0.0
        self.last_frame = None

    def discover_cameras(self, max_test: int = 4) -> list:
        """Scan available video devices."""
        available = []
        if not OPENCV_AVAILABLE:
            # Check /dev/video* on Linux systems
            for i in range(max_test):
                dev_path = f"/dev/video{i}"
                if os.path.exists(dev_path):
                    available.append({"index": i, "path": dev_path, "type": "v4l2"})
            return available

        for i in range(max_test):
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                available.append({
                    "index": i,
                    "backend": "OpenCV",
                    "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                    "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                })
                cap.release()
        return available

    def start(self) -> bool:
        """Initialize and open the camera connection."""
        self.is_running = True
        self.start_time = time.time()

        if not OPENCV_AVAILABLE:
            print("[WebcamStream] Notice: OpenCV not installed in current environment. Using synthetic camera stream.")
            return True

        print(f"[WebcamStream] Connecting to USB Camera index={self.camera_index}...")
        self.cap = cv2.VideoCapture(self.camera_index)

        if not self.cap.isOpened():
            print(f"[WebcamStream] Warning: Unable to open /dev/video{self.camera_index}. Entering graceful fallback mode.")
            return False

        # Set resolution and target FPS
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.frame_width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frame_height)
        self.cap.set(cv2.CAP_PROP_FPS, self.target_fps)

        # Read back actual configured parameters
        actual_w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        print(f"[WebcamStream] Camera opened successfully. Resolution: {actual_w}x{actual_h} @ {self.target_fps} FPS target.")
        return True

    def read_frame(self) -> Tuple[bool, Optional[Any]]:
        """Read a single frame with rate limiting and fallback."""
        if not self.is_running:
            return False, None

        now = time.time()
        # Rate limit to target FPS
        min_interval = 1.0 / max(1, self.target_fps)
        elapsed_since_last = now - self.last_frame_time
        if elapsed_since_last < min_interval:
            time.sleep(min_interval - elapsed_since_last)
            now = time.time()

        if self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                self.frame_count += 1
                self._update_fps(now)
                self.last_frame = frame
                return True, frame
            elif self.auto_reconnect:
                print("[WebcamStream] Frame drop detected. Attempting auto-reconnect...")
                self.cap.release()
                time.sleep(0.5)
                self.start()

        # Fallback synthetic frame when no physical camera is attached
        self.frame_count += 1
        self._update_fps(now)
        return True, self._generate_fallback_frame()

    def _update_fps(self, now: float) -> None:
        delta = now - self.last_frame_time
        if delta > 0:
            instant_fps = 1.0 / delta
            self.actual_fps = self.actual_fps * 0.85 + instant_fps * 0.15
        self.last_frame_time = now

    def _generate_fallback_frame(self) -> Dict[str, Any]:
        """Returns structured metadata for synthetic room frame."""
        return {
            "type": "synthetic_miniature_room",
            "frame_id": self.frame_count,
            "timestamp": time.time(),
            "resolution": (self.frame_width, self.frame_height),
            "camera_index": self.camera_index,
            "fps": round(self.actual_fps, 1),
        }

    def stop(self) -> None:
        """Release camera resources."""
        self.is_running = False
        if self.cap and self.cap.isOpened():
            self.cap.release()
            self.cap = None
        print(f"[WebcamStream] Camera index={self.camera_index} stopped. Total frames: {self.frame_count}")

    def get_status(self) -> Dict[str, Any]:
        """Return diagnostic health and status dict."""
        return {
            "connected": self.is_running,
            "camera_index": self.camera_index,
            "resolution": f"{self.frame_width}x{self.frame_height}",
            "target_fps": self.target_fps,
            "actual_fps": round(self.actual_fps, 1),
            "frames_captured": self.frame_count,
            "hardware_opened": bool(self.cap and self.cap.isOpened()),
        }


if __name__ == "__main__":
    stream = WebcamStream(camera_index=0, frame_width=1280, frame_height=720, target_fps=15)
    print("Testing WebcamStream...")
    stream.start()
    for _ in range(5):
        success, frame = stream.read_frame()
        print(f"Captured frame #{stream.frame_count}, success={success}, fps={stream.actual_fps:.1f}")
        time.sleep(0.05)
    print("Camera Status:", stream.get_status())
    stream.stop()
