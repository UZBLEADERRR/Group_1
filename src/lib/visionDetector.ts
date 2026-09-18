import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import type { TrackedObject, Vector2D } from '../types';

let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;
let modelLoaded = false;
let modelLoading = false;

// Uzbek translations for common COCO classes
export const LABEL_TRANSLATIONS: Record<string, string> = {
  'cell phone': 'telefon',
  'laptop': 'noutbuk',
  'bottle': 'butilka',
  'cup': 'chashka',
  'chair': 'stul',
  'person': 'inson',
  'backpack': 'ryukzak',
  'handbag': 'sumka',
  'book': 'kitob',
  'keyboard': 'klaviatura',
  'mouse': 'sichqoncha',
  'clock': 'soat',
  'tv': 'televizor',
  'remote': 'pult',
  'scissors': 'qaychi',
  'fork': 'sanchqi',
  'spoon': 'qoshiq',
  'bowl': 'kosa',
  'bed': 'krovat',
  'couch': 'divan',
  'potted plant': 'gul / o‘simlik',
  'dining table': 'stol',
  'vase': 'vaza',
};

const COLOR_PALETTE = [
  '#38bdf8', // sky
  '#f59e0b', // amber
  '#10b981', // emerald
  '#a855f7', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
  '#eab308', // yellow
  '#14b8a6', // teal
  '#f97316', // orange
];

export async function loadVisionModel(): Promise<cocoSsd.ObjectDetection> {
  if (modelPromise) return modelPromise;
  modelLoading = true;
  try {
    // Initialize TensorFlow.js backend
    await tf.ready();
    modelPromise = cocoSsd.load({ base: 'lite_mobilenet_v2' });
    const loaded = await modelPromise;
    modelLoaded = true;
    modelLoading = false;
    return loaded;
  } catch (err) {
    modelLoading = false;
    console.error('[VisionDetector] Failed to load COCO-SSD:', err);
    throw err;
  }
}

export function isVisionModelReady(): boolean {
  return modelLoaded;
}

export function isVisionModelLoading(): boolean {
  return modelLoading;
}

export interface RawDetection {
  name: string;
  translatedName: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
  center: Vector2D;
}

/**
 * Calculate Intersection-over-Union (IoU) between two bounding boxes
 */
export function calculateIOU(
  boxA: { x: number; y: number; width: number; height: number },
  boxB: { x: number; y: number; width: number; height: number }
): number {
  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;
  const unionArea = areaA + areaB - interArea;

  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

/**
 * Non-Maximum Suppression (NMS) to eliminate duplicate/overlapping boxes
 */
function applyNMS(detections: RawDetection[], iouThreshold = 0.4): RawDetection[] {
  // Sort descending by confidence
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const keep: RawDetection[] = [];

  for (const det of sorted) {
    let duplicate = false;
    for (const chosen of keep) {
      const iou = calculateIOU(det.box, chosen.box);
      // Suppress if high IoU or one is strongly contained inside another
      if (iou > iouThreshold) {
        duplicate = true;
        break;
      }
    }
    if (!duplicate) {
      keep.push(det);
    }
  }

  return keep;
}

/**
 * Run real-time detection on a video element with NMS
 */
export async function detectVideoFrame(video: HTMLVideoElement): Promise<RawDetection[]> {
  if (!video || video.readyState < 2 || video.videoWidth === 0) {
    return [];
  }

  const model = await loadVisionModel();
  // Filter out low-confidence predictions to eliminate noise jitter
  const predictions = await model.detect(video, 12, 0.45);

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  const rawList = predictions.map((pred) => {
    const [px, py, pw, ph] = pred.bbox;
    // Normalize to 0..1
    const x = Math.max(0, Math.min(1, px / vw));
    const y = Math.max(0, Math.min(1, py / vh));
    const width = Math.max(0.01, Math.min(1 - x, pw / vw));
    const height = Math.max(0.01, Math.min(1 - y, ph / vh));

    const cx = x + width / 2;
    const cy = y + height / 2;

    const className = pred.class.toLowerCase();
    const translatedName = LABEL_TRANSLATIONS[className] || className;

    return {
      name: className,
      translatedName,
      confidence: Math.round(pred.score * 100) / 100,
      box: { x, y, width, height },
      center: { x: cx, y: cy },
    };
  });

  // Apply Non-Maximum Suppression to eliminate double/triple boxes on the same object
  return applyNMS(rawList, 0.4);
}

/**
 * Lightweight ByteTrack-style Tracker to assign persistent IDs and lock onto objects
 */
export class ClientObjectTracker {
  private activeTracks: Map<string, TrackedObject> = new Map();
  private nextId = 1;
  private colorIdx = 0;

  public update(detections: RawDetection[]): TrackedObject[] {
    const now = Date.now();
    const matchedTrackIds = new Set<string>();
    const updatedTracks: TrackedObject[] = [];

    for (const det of detections) {
      // Find best match among existing tracks: combination of IoU and centroid distance
      let bestMatchId: string | null = null;
      let highestScore = -1;

      for (const [id, track] of this.activeTracks.entries()) {
        if (matchedTrackIds.has(id)) continue;
        // Same category or generic object match
        const isSameCategory = track.category === det.name;
        if (!isSameCategory) continue;

        const iou = calculateIOU(track.box, det.box);
        const dx = track.center.x - det.center.x;
        const dy = track.center.y - det.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Score: high IoU and low distance
        const score = (iou * 0.7) + (Math.max(0, 1 - dist / 0.4) * 0.3);

        // Require decent spatial correlation (either IoU > 0.15 or centroid close < 0.25)
        if ((iou > 0.15 || dist < 0.25) && score > highestScore) {
          highestScore = score;
          bestMatchId = id;
        }
      }

      if (bestMatchId) {
        // Lock and update existing track with Exponential Moving Average (EMA) for zero-jitter
        matchedTrackIds.add(bestMatchId);
        const existing = this.activeTracks.get(bestMatchId)!;
        const prevCenter = existing.center;
        const prevBox = existing.box;

        const dx = det.center.x - prevCenter.x;
        const dy = det.center.y - prevCenter.y;
        const isMoved = Math.sqrt(dx * dx + dy * dy) > 0.04;

        // Smooth box and center: 70% history, 30% new detection -> prevents fluttering
        const smoothAlpha = 0.35;
        const smoothX = prevCenter.x * (1 - smoothAlpha) + det.center.x * smoothAlpha;
        const smoothY = prevCenter.y * (1 - smoothAlpha) + det.center.y * smoothAlpha;

        const smoothBox = {
          x: prevBox.x * (1 - smoothAlpha) + det.box.x * smoothAlpha,
          y: prevBox.y * (1 - smoothAlpha) + det.box.y * smoothAlpha,
          width: prevBox.width * (1 - smoothAlpha) + det.box.width * smoothAlpha,
          height: prevBox.height * (1 - smoothAlpha) + det.box.height * smoothAlpha,
        };

        existing.center = { x: smoothX, y: smoothY };
        existing.box = smoothBox;
        existing.confidence = Math.max(existing.confidence * 0.8, det.confidence);
        existing.lastSeen = now;
        existing.lostFrames = 0;
        existing.state = isMoved ? 'moving' : 'static';

        if (isMoved) {
          existing.history.push({ x: smoothX, y: smoothY, timestamp: now });
          if (existing.history.length > 20) existing.history.shift();
        }

        updatedTracks.push(existing);
      } else {
        // Create new persistent track
        const id = `obj_${String(this.nextId++).padStart(3, '0')}`;
        matchedTrackIds.add(id);

        const color = COLOR_PALETTE[this.colorIdx % COLOR_PALETTE.length];
        this.colorIdx++;

        const newObj: TrackedObject = {
          id,
          name: det.translatedName,
          category: det.name,
          confidence: det.confidence,
          box: det.box,
          center: det.center,
          state: 'new',
          firstSeen: now,
          lastSeen: now,
          lostFrames: 0,
          velocity: { x: 0, y: 0 },
          history: [{ x: det.center.x, y: det.center.y, timestamp: now }],
          color,
        };

        this.activeTracks.set(id, newObj);
        updatedTracks.push(newObj);
      }
    }

    // Handle lost tracks with hysteresis: keep locked for 16 frames before dropping
    for (const [id, track] of this.activeTracks.entries()) {
      if (!matchedTrackIds.has(id)) {
        track.lostFrames++;
        if (track.lostFrames > 16) {
          // Object truly left camera
          this.activeTracks.delete(id);
        } else if (track.lostFrames > 2) {
          track.state = 'occluded';
          updatedTracks.push(track);
        } else {
          updatedTracks.push(track);
        }
      }
    }

    return updatedTracks;
  }

  public getTracks(): TrackedObject[] {
    return Array.from(this.activeTracks.values());
  }

  public clear(): void {
    this.activeTracks.clear();
    this.nextId = 1;
  }
}
