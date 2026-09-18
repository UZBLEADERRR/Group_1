import type {
  TrackedObject,
  SceneGraph,
  SceneGraphEdge,
  SpatialPredicate,
  SceneEvent,
} from '../../src/types.js';
import { calculateDistance, isContained, getDirectionalRelation } from '../geometry/spatial.js';

export class SceneEngine {
  private objects: Map<string, TrackedObject> = new Map();
  private nextIdNumber: number = 1;
  private sceneGraph: SceneGraph = { nodes: [], edges: [], updatedAt: Date.now() };
  private events: SceneEvent[] = [];
  private concepts: Set<string> = new Set([
    'table',
    'chair',
    'laptop',
    'phone',
    'bottle',
    'backpack',
    'box',
    'cup',
    'book',
  ]);

  private colorPalette: string[] = [
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

  constructor() {
    this.seedInitialRoomObjects();
    this.recomputeSceneGraph();
  }

  public getConcepts(): string[] {
    return Array.from(this.concepts);
  }

  public addConcept(concept: string): boolean {
    const clean = concept.trim().toLowerCase();
    if (!clean) return false;
    this.concepts.add(clean);
    return true;
  }

  public getObjects(): TrackedObject[] {
    return Array.from(this.objects.values());
  }

  public getSceneGraph(): SceneGraph {
    return this.sceneGraph;
  }

  public getEvents(limit: number = 50): SceneEvent[] {
    return this.events.slice(-limit).reverse();
  }

  public seedInitialRoomObjects(): void {
    this.objects.clear();
    this.nextIdNumber = 1;

    const initial = [
      { name: 'table', category: 'furniture', x: 0.30, y: 0.28, w: 0.40, h: 0.35, conf: 0.94 },
      { name: 'chair', category: 'furniture', x: 0.16, y: 0.32, w: 0.12, h: 0.22, conf: 0.91 },
      { name: 'chair', category: 'furniture', x: 0.72, y: 0.32, w: 0.12, h: 0.22, conf: 0.89 },
      { name: 'laptop', category: 'electronics', x: 0.35, y: 0.33, w: 0.13, h: 0.14, conf: 0.96 },
      { name: 'backpack', category: 'accessory', x: 0.45, y: 0.65, w: 0.14, h: 0.18, conf: 0.88 },
    ];

    const now = Date.now();
    for (const item of initial) {
      const id = this.generateNextId();
      const center = { x: item.x + item.w / 2, y: item.y + item.h / 2 };
      const obj: TrackedObject = {
        id,
        name: item.name,
        category: item.category,
        confidence: item.conf,
        box: { x: item.x, y: item.y, width: item.w, height: item.h },
        center,
        state: 'static',
        firstSeen: now,
        lastSeen: now,
        lostFrames: 0,
        velocity: { x: 0, y: 0 },
        history: [{ x: center.x, y: center.y, timestamp: now, locationLabel: 'Room Floor' }],
        color: this.colorPalette[(this.nextIdNumber - 2) % this.colorPalette.length],
      };
      this.objects.set(id, obj);
    }

    this.logEvent('OBJECT_APPEARED', 'System', 'Initial Miniature Room objects populated');
  }

  public syncRealDetections(realObjects: TrackedObject[]): void {
    if (!realObjects || realObjects.length === 0) return;
    for (const item of realObjects) {
      this.concepts.add(item.name.toLowerCase());
      const existing = this.objects.get(item.id);
      if (!existing) {
        this.logEvent('OBJECT_APPEARED', item.id, `KAMERA ANQLADI: ${item.name.toUpperCase()} [${item.id}]`);
      } else if (item.state === 'moving') {
        this.logEvent('OBJECT_MOVED', item.id, `${item.name.toUpperCase()} surildi: (${item.center.x.toFixed(2)}, ${item.center.y.toFixed(2)})`);
      }
      this.objects.set(item.id, item);
    }
    this.recomputeSceneGraph();
  }

  public placeObject(name: string, x?: number, y?: number): TrackedObject {
    const id = this.generateNextId();
    const cleanName = name.trim().toLowerCase();
    this.concepts.add(cleanName);

    const posX = x !== undefined ? Math.max(0.05, Math.min(0.85, x)) : 0.52;
    const posY = y !== undefined ? Math.max(0.05, Math.min(0.85, y)) : 0.35;
    const w = cleanName === 'bottle' ? 0.08 : cleanName === 'phone' ? 0.07 : 0.12;
    const h = cleanName === 'bottle' ? 0.15 : cleanName === 'phone' ? 0.12 : 0.12;

    const now = Date.now();
    const center = { x: posX + w / 2, y: posY + h / 2 };

    const newObj: TrackedObject = {
      id,
      name: cleanName,
      category: 'movable_object',
      confidence: 0.93,
      box: { x: posX, y: posY, width: w, height: h },
      center,
      state: 'new',
      firstSeen: now,
      lastSeen: now,
      lostFrames: 0,
      velocity: { x: 0, y: 0 },
      history: [{ x: center.x, y: center.y, timestamp: now, locationLabel: 'table' }],
      color: this.colorPalette[(this.nextIdNumber - 2) % this.colorPalette.length],
    };

    this.objects.set(id, newObj);
    this.logEvent('OBJECT_APPEARED', id, `NEW OBJECT DETECTED: ${cleanName.toUpperCase()} (${id}) placed into room`);
    this.recomputeSceneGraph();
    return newObj;
  }

  public moveObject(id: string, targetX: number, targetY: number): boolean {
    const obj = this.objects.get(id);
    if (!obj) return false;

    const oldPos = { ...obj.center };
    const now = Date.now();

    const clampedX = Math.max(0.05, Math.min(0.9, targetX));
    const clampedY = Math.max(0.05, Math.min(0.9, targetY));

    obj.box.x = clampedX - obj.box.width / 2;
    obj.box.y = clampedY - obj.box.height / 2;
    obj.center = { x: clampedX, y: clampedY };
    obj.state = 'moving';
    obj.lastSeen = now;

    obj.history.push({
      x: clampedX,
      y: clampedY,
      timestamp: now,
      locationLabel: `(${clampedX.toFixed(2)}, ${clampedY.toFixed(2)})`,
    });

    if (obj.history.length > 20) {
      obj.history.shift();
    }

    this.logEvent(
      'OBJECT_MOVED',
      id,
      `${obj.name} (${id}) moved from (${oldPos.x.toFixed(2)}, ${oldPos.y.toFixed(2)}) to (${clampedX.toFixed(2)}, ${clampedY.toFixed(2)})`,
      oldPos,
      obj.center
    );

    this.recomputeSceneGraph();
    return true;
  }

  public toggleOcclusion(id: string): boolean {
    const obj = this.objects.get(id);
    if (!obj) return false;

    if (obj.state !== 'occluded') {
      obj.state = 'occluded';
      this.logEvent('OBJECT_DISAPPEARED', id, `${obj.name} (${id}) occluded / hidden temporarily`);
    } else {
      obj.state = 'static';
      obj.lastSeen = Date.now();
      this.logEvent('OBJECT_REAPPEARED', id, `OBJECT REAPPEARED: ${obj.name} retaining persistent ID ${id}`);
    }

    this.recomputeSceneGraph();
    return true;
  }

  public removeObject(id: string): boolean {
    const obj = this.objects.get(id);
    if (!obj) return false;

    this.objects.delete(id);
    this.logEvent('OBJECT_DISAPPEARED', id, `${obj.name} (${id}) removed from room`);
    this.recomputeSceneGraph();
    return true;
  }

  public recomputeSceneGraph(): SceneGraph {
    const activeObjects = Array.from(this.objects.values()).filter((o) => o.state !== 'occluded');
    const edges: SceneGraphEdge[] = [];
    const now = Date.now();

    for (const source of activeObjects) {
      for (const target of activeObjects) {
        if (source.id === target.id) continue;

        const dist = calculateDistance(source.center, target.center);

        // ON relationship (contained inside table)
        if (target.name === 'table' && source.name !== 'table') {
          if (isContained(source.box, target.box)) {
            edges.push({
              id: `${source.id}_on_${target.id}`,
              source: source.id,
              predicate: 'on',
              target: target.id,
              confidence: 0.92,
              distance: Math.round(dist * 100) / 100,
              timestamp: now,
            });
            continue;
          } else if (source.center.y > target.box.y + target.box.height && Math.abs(source.center.x - target.center.x) < 0.25) {
            edges.push({
              id: `${source.id}_under_${target.id}`,
              source: source.id,
              predicate: 'under',
              target: target.id,
              confidence: 0.86,
              distance: Math.round(dist * 100) / 100,
              timestamp: now,
            });
            continue;
          }
        }

        // NEAR relationship (threshold <= 0.32)
        if (dist <= 0.32) {
          edges.push({
            id: `${source.id}_near_${target.id}`,
            source: source.id,
            predicate: 'near',
            target: target.id,
            confidence: Math.max(0.7, 1 - dist),
            distance: Math.round(dist * 100) / 100,
            timestamp: now,
          });
        }

        // Directional relationships (left_of / right_of)
        if (source.category === target.category && Math.abs(source.center.y - target.center.y) < 0.15) {
          const dir = getDirectionalRelation(source.center, target.center);
          edges.push({
            id: `${source.id}_${dir}_${target.id}`,
            source: source.id,
            predicate: dir,
            target: target.id,
            confidence: 0.89,
            distance: Math.round(dist * 100) / 100,
            timestamp: now,
          });
        }
      }
    }

    this.sceneGraph = {
      nodes: activeObjects,
      edges,
      updatedAt: now,
    };

    return this.sceneGraph;
  }

  private generateNextId(): string {
    const id = `obj_${String(this.nextIdNumber).padStart(3, '0')}`;
    this.nextIdNumber++;
    return id;
  }

  private logEvent(
    type: SceneEvent['type'],
    objectId: string,
    details: string,
    from?: { x: number; y: number },
    to?: { x: number; y: number }
  ): void {
    const obj = this.objects.get(objectId);
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });

    this.events.push({
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      objectId,
      objectName: obj ? obj.name : objectId,
      timestamp: Date.now(),
      timeStr,
      details,
      from,
      to,
    });
  }
}

export const sceneEngine = new SceneEngine();
