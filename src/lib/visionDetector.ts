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
 * Run real-time detection on a video element
 */
export async function detectVideoFrame(video: HTMLVideoElement): Promise<RawDetection[]> {
  if (!video || video.readyState < 2 || video.videoWidth === 0) {
    return [];
  }

  const model = await loadVisionModel();
  const predictions = await model.detect(video, 10, 0.35);

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  return predictions.map((pred) => {
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
}

/**
 * Lightweight ByteTrack-style Tracker to assign persistent IDs
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
      // Find closest existing track of same category
      let bestMatchId: string | null = null;
      let minDistance = 0.25; // max association distance threshold

      for (const [id, track] of this.activeTracks.entries()) {
        if (matchedTrackIds.has(id)) continue;
        if (track.name !== det.name) continue;

        const dx = track.center.x - det.center.x;
        const dy = track.center.y - det.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDistance) {
          minDistance = dist;
          bestMatchId = id;
        }
      }

      if (bestMatchId) {
        // Update existing track
        matchedTrackIds.add(bestMatchId);
        const existing = this.activeTracks.get(bestMatchId)!;
        const prevCenter = existing.center;

        const dx = det.center.x - prevCenter.x;
        const dy = det.center.y - prevCenter.y;
        const isMoved = Math.sqrt(dx * dx + dy * dy) > 0.03;

        // Smooth position
        const smoothX = prevCenter.x * 0.4 + det.center.x * 0.6;
        const smoothY = prevCenter.y * 0.4 + det.center.y * 0.6;

        existing.center = { x: smoothX, y: smoothY };
        existing.box = det.box;
        existing.confidence = det.confidence;
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

    // Handle lost tracks
    for (const [id, track] of this.activeTracks.entries()) {
      if (!matchedTrackIds.has(id)) {
        track.lostFrames++;
        if (track.lostFrames > 12) {
          // Object truly left camera
          this.activeTracks.delete(id);
        } else if (track.lostFrames > 3) {
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
