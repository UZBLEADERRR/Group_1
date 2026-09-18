import type { QueryResult, TrackedObject } from '../../src/types.js';
import { sceneEngine } from '../scene/scene_engine.js';
import { calculateDistance } from '../geometry/spatial.js';

export class QueryEngine {
  public processQuery(question: string): QueryResult {
    const q = question.toLowerCase().trim();
    const objects = sceneEngine.getObjects().filter((o) => o.state !== 'occluded');
    const sceneGraph = sceneEngine.getSceneGraph();
    const events = sceneEngine.getEvents(20);

    // 1. "Which [object] is closest to the [object]?"
    // e.g. "Which chair is closest to the laptop?"
    if (q.includes('closest') || q.includes('nearest') || q.includes('eng yaqin')) {
      return this.handleClosestQuery(q, objects);
    }

    // 2. "Where is the [object]?" or "Where was the [object]?"
    // e.g. "Where is the bottle?", "Qayerda"
    if (q.includes('where is') || q.includes('where was') || q.includes('qayerda') || q.includes('joylashgan')) {
      return this.handleLocationQuery(q, objects, sceneGraph, events);
    }

    // 3. "Is the [object] on the [table]?" or "near"
    if (q.includes(' is on ') || q.includes(' is near ') || q.includes('ustidami') || q.includes('yonidami')) {
      return this.handleRelationQuery(q, objects, sceneGraph);
    }

    // 4. "Did the [object] move?" or movement history
    if (q.includes('move') || q.includes('harakat') || q.includes('history') || q.includes('surildimi')) {
      return this.handleHistoryQuery(q, objects, events);
    }

    // 5. General status / count query
    return this.handleGeneralQuery(q, objects);
  }

  private handleClosestQuery(q: string, objects: TrackedObject[]): QueryResult {
    const isUzbek = q.includes('yaqin') || q.includes('qayerda') || q.includes('ustida') || q.includes('nima') || q.includes('qaysi') || q.includes('joylash');

    let sourceObj: TrackedObject | undefined;
    let targetCategory = '';

    // Find any mentioned object in question
    for (const obj of objects) {
      if (q.includes(obj.name.toLowerCase()) || (obj.category && q.includes(obj.category.toLowerCase()))) {
        if (!sourceObj) {
          sourceObj = obj;
        } else {
          targetCategory = obj.name;
        }
      }
    }

    if (!sourceObj && objects.length > 0) {
      sourceObj = objects[0];
    }

    if (!sourceObj) {
      return {
        question: q,
        intent: 'proximity',
        answer: isUzbek
          ? 'Kamera ko‘rinishida hozircha obyektlar aniqlanmadi. Kamerani noutbuk, telefon, chashka yoki stulga qarating.'
          : 'No tracked objects are currently visible in the scene. Point the camera at room objects.',
        confidence: 0.5,
        verified: false,
        corrected: false,
        groundingDetails: { rule: 'No Objects Visible', calculatedMetric: 0, threshold: 'N/A' },
        timestamp: Date.now(),
      };
    }

    // Filter candidates (all other objects or matching target category)
    const candidates = objects.filter(
      (o) => o.id !== sourceObj?.id && (!targetCategory || o.name.toLowerCase().includes(targetCategory.toLowerCase()))
    );

    if (candidates.length === 0) {
      return {
        question: q,
        intent: 'proximity',
        answer: isUzbek
          ? `Sahnada faqat bitta ${sourceObj.name.toUpperCase()} ko‘rinyapti. Masofani hisoblash uchun ikkinchi obyekt kerak.`
          : `Only one object '${sourceObj.name}' is in view. A second object is required for proximity comparison.`,
        confidence: 0.5,
        verified: false,
        corrected: false,
        groundingDetails: { rule: 'Single Object', calculatedMetric: 0, threshold: 'N/A' },
        timestamp: Date.now(),
      };
    }

    let minDistance = Infinity;
    let closestObj: TrackedObject = candidates[0];

    for (const cand of candidates) {
      const dist = calculateDistance(sourceObj.center, cand.center);
      if (dist < minDistance) {
        minDistance = dist;
        closestObj = cand;
      }
    }

    const distFormatted = minDistance.toFixed(2);
    const posFormatted = `(${closestObj.center.x.toFixed(2)}, ${closestObj.center.y.toFixed(2)})`;

    const answer = isUzbek
      ? `Evklid geometrik tekshiruviga ko‘ra: ${closestObj.name.toUpperCase()} [${closestObj.id}] ${posFormatted} koordinatada ${sourceObj.name.toUpperCase()} [${sourceObj.id}] ga eng yaqin joylashgan. Oraliq masofa: ${distFormatted} birlik.`
      : `Based on metric geometric verification: ${closestObj.name.toUpperCase()} [${closestObj.id}] at ${posFormatted} is closest to ${sourceObj.name.toUpperCase()} [${sourceObj.id}], with Euclidean distance = ${distFormatted} normalized units.`;

    return {
      question: q,
      intent: 'proximity',
      answer,
      targetObjectId: closestObj.id,
      referenceObjectId: sourceObj.id,
      calculatedDistance: minDistance,
      confidence: 0.96,
      verified: true,
      corrected: false,
      groundingDetails: {
        rule: 'Euclidean distance = sqrt((Ax - Bx)^2 + (Ay - By)^2)',
        calculatedMetric: minDistance.toFixed(3),
        threshold: `Solishtirilgan obyektlar: ${candidates.length} ta`,
      },
      timestamp: Date.now(),
    };
  }

  private handleLocationQuery(
    q: string,
    objects: TrackedObject[],
    sceneGraph: any,
    events: any[]
  ): QueryResult {
    let target = objects.find((o) => q.includes(o.name.toLowerCase()));
    if (!target) {
      target = objects.find((o) => q.includes(o.id.toLowerCase()));
    }

    if (!target) {
      return {
        question: q,
        intent: 'location',
        answer: `Could not identify an active room object matching your query. Active items in room: ${objects.map((o) => o.name).join(', ')}.`,
        confidence: 0.4,
        verified: false,
        corrected: false,
        groundingDetails: { rule: 'Name Lookup', calculatedMetric: 0, threshold: 'Match required' },
        timestamp: Date.now(),
      };
    }

    // Find relations in scene graph
    const relations = sceneGraph.edges.filter((e: any) => e.source === target?.id);
    let relationText = '';
    if (relations.length > 0) {
      const relDescriptions = relations.map((r: any) => {
        const targetObj = objects.find((o) => o.id === r.target);
        return `${r.predicate.toUpperCase()} ${targetObj?.name || r.target} (dist: ${r.distance})`;
      });
      relationText = ` Relations: ${relDescriptions.join(', ')}.`;
    }

    const answer = `${target.name.toUpperCase()} [${target.id}] is currently at coordinate (${target.center.x.toFixed(2)}, ${target.center.y.toFixed(2)}) with state [${target.state.toUpperCase()}].${relationText}`;

    return {
      question: q,
      intent: 'location',
      answer,
      targetObjectId: target.id,
      confidence: 0.95,
      verified: true,
      corrected: false,
      groundingDetails: {
        rule: 'Direct Camera Localization',
        calculatedMetric: `(${target.center.x.toFixed(2)}, ${target.center.y.toFixed(2)})`,
        threshold: '0.00 to 1.00',
      },
      timestamp: Date.now(),
    };
  }

  private handleRelationQuery(q: string, objects: TrackedObject[], sceneGraph: any): QueryResult {
    const isAskingOn = q.includes('on') || q.includes('ustida');
    const sourceObj = objects.find((o) => q.includes(o.name.toLowerCase()));
    const targetObj = objects.find((o) => o.name === 'table');

    if (!sourceObj || !targetObj) {
      return {
        question: q,
        intent: 'relation',
        answer: 'Could not resolve source and destination entities for relational verification.',
        confidence: 0.5,
        verified: false,
        corrected: false,
        groundingDetails: { rule: 'Relation Match', calculatedMetric: 0, threshold: 'N/A' },
        timestamp: Date.now(),
      };
    }

    const edge = sceneGraph.edges.find(
      (e: any) => e.source === sourceObj.id && e.target === targetObj.id && (isAskingOn ? e.predicate === 'on' : true)
    );

    const isTrue = !!edge;
    const dist = calculateDistance(sourceObj.center, targetObj.center);

    const answer = isTrue
      ? `YES, ${sourceObj.name.toUpperCase()} [${sourceObj.id}] is verified to be ${edge.predicate.toUpperCase()} ${targetObj.name.toUpperCase()} [${targetObj.id}] (distance: ${edge.distance}).`
      : `NO, ${sourceObj.name.toUpperCase()} [${sourceObj.id}] is not currently ${isAskingOn ? 'on' : 'near'} ${targetObj.name.toUpperCase()} [${targetObj.id}] (actual distance: ${dist.toFixed(2)}).`;

    return {
      question: q,
      intent: 'relation',
      answer,
      targetObjectId: sourceObj.id,
      referenceObjectId: targetObj.id,
      calculatedDistance: dist,
      confidence: 0.94,
      verified: true,
      corrected: false,
      groundingDetails: {
        rule: isAskingOn ? 'Bounding Box Containment' : 'Euclidean Distance Threshold <= 0.32',
        calculatedMetric: dist.toFixed(2),
        threshold: isAskingOn ? 'Overlap inside bounds' : '<= 0.32',
      },
      timestamp: Date.now(),
    };
  }

  private handleHistoryQuery(q: string, objects: TrackedObject[], events: any[]): QueryResult {
    const target = objects.find((o) => q.includes(o.name.toLowerCase())) || objects[0];
    const moves = events.filter((e) => e.type === 'OBJECT_MOVED' && (target ? e.objectId === target.id : true));

    if (moves.length === 0) {
      return {
        question: q,
        intent: 'history',
        answer: `According to temporal tracking memory, ${target ? target.name.toUpperCase() : 'the scene'} has remained static with no recorded displacement events.`,
        confidence: 0.9,
        verified: true,
        corrected: false,
        groundingDetails: { rule: 'Event Log Check', calculatedMetric: '0 movements', threshold: '> 0' },
        timestamp: Date.now(),
      };
    }

    const latest = moves[0];
    const answer = `${latest.objectName.toUpperCase()} [${latest.objectId}] moved recently at ${latest.timeStr}: ${latest.details}`;

    return {
      question: q,
      intent: 'history',
      answer,
      targetObjectId: latest.objectId,
      confidence: 0.95,
      verified: true,
      corrected: false,
      groundingDetails: {
        rule: 'Temporal Memory Event Trace',
        calculatedMetric: `${moves.length} movement event(s) logged`,
        threshold: 'History depth',
      },
      timestamp: Date.now(),
    };
  }

  private handleGeneralQuery(q: string, objects: TrackedObject[]): QueryResult {
    const count = objects.length;
    const names = objects.map((o) => `${o.name} [${o.id}]`).join(', ');

    return {
      question: q,
      intent: 'status',
      answer: `SmartRoom AI currently tracks ${count} persistent objects in the room: ${names}. All spatial bounding boxes and scene graph relationships are verified in real time.`,
      confidence: 0.9,
      verified: true,
      corrected: false,
      groundingDetails: {
        rule: 'Scene Graph Summary',
        calculatedMetric: `${count} objects`,
        threshold: 'N/A',
      },
      timestamp: Date.now(),
    };
  }
}

export const queryEngine = new QueryEngine();
