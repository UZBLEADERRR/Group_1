# SMARTROOM AI
**Real-Time Physical AI Scene Understanding System**
*University Mini-Project — Physical AI Scene Understanding Prototype*

---

## 1. Project Overview
SmartRoom AI observes a physical miniature room containing everyday objects (Table, 2–3 Chairs, Laptop, Bottle, Backpack, Box, Cup) through a USB webcam and incrementally builds a dynamic, grounded scene understanding pipeline:

```
USB WEBCAM
      ↓
Live Video Stream (Milestone 1 - Current)
      ↓
Frame Processing
      ↓
Object Detection / Open-Vocabulary (Milestone 2)
      ↓
Object Tracking (Milestone 3)
      ↓
Persistent Object Memory (Milestone 4)
      ↓
Dynamic Scene Graph (Milestone 5)
      ↓
Natural Language Reasoning (Milestone 6)
      ↓
Geometric Verification (Milestone 7)
      ↓
Web Dashboard
```

---

## 2. Milestone 1: Live Camera Stream

### Implemented Features:
1. **USB Webcam Connection:** Modular Python OpenCV capture (`backend/camera/webcam.py`) with device discovery, resolution negotiation (1280x720 default), and target FPS pacing (15 FPS).
2. **Browser Live Stream:** Direct HTML5 `navigator.mediaDevices.getUserMedia` integration supporting physical USB cameras connected to the user's computer.
3. **Backend MJPEG Video Server:** `/api/camera/stream` endpoint delivering real-time video frames with graceful fallback and synthetic room testbed.
4. **Configuration API:** Real-time `/api/camera/config` for changing camera index, resolution, and FPS.
5. **HUD & Coordinates:** Approximate 2D scene coordinates `[0, 1] × [0, 1]` with real-time FPS telemetry.

---

## 3. Technology Stack
- **Perception Backend:** Python 3 (OpenCV / V4L2) + Node.js (Express + TypeScript)
- **Frontend Dashboard:** React 19 + Vite + Tailwind CSS v4 + Lucide Icons
- **Video Transport:** Direct Browser WebRTC/getUserMedia + Backend HTTP MJPEG (`/api/camera/stream`)
- **Pacing:** 15 FPS target rate-limiting for stable execution on normal student laptops.

---

## 4. How to Run & Test

### Option A: Web Application (Full Dashboard)
```bash
# Start the full-stack server
npm run dev
```
Open `http://localhost:3000` in your browser.

### Option B: Python Webcam Module Test (CLI)
```bash
# Test the Python webcam capture class
python3 -m unittest tests/test_camera.py -v
```

### Option C: Integration API Test
```bash
# Verify all camera REST endpoints
npm run test:camera
```

---

## 5. How to View the Webcam in the Browser
1. Open the dashboard at `http://localhost:3000`.
2. Under **"Perception Video Source"**, select **"Browser USB Cam"**.
3. When prompted by the browser, click **"Allow"** to grant camera permission.
4. If multiple cameras are connected, choose your USB webcam from the **"Select USB Camera Device"** dropdown.
5. Your live webcam stream appears instantly with live FPS, resolution, and coordinate grid overlays.

---

## 6. Known Limitations (Milestone 1)
- Single RGB camera provides approximate 2D normalized room coordinates (`x ∈ [0, 1], y ∈ [0, 1]`), not metric 3D point clouds.
- In headless cloud containers without physical hardware cameras attached, the system automatically runs the **Miniature Room Testbed** or browser-streamed webcam.
