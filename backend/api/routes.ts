import { Router, Request, Response } from 'express';
import { cameraService } from '../camera/camera_service.js';
import { sceneEngine } from '../scene/scene_engine.js';
import { queryEngine } from '../query/query_engine.js';

export const apiRouter = Router();

// Camera Health & Status
apiRouter.get('/camera/status', (req: Request, res: Response) => {
  res.json(cameraService.getStatus());
});

// Update Camera Configuration
apiRouter.post('/camera/config', (req: Request, res: Response) => {
  const updatedStatus = cameraService.updateConfig(req.body);
  res.json({ success: true, status: updatedStatus });
});

// Start Camera Stream
apiRouter.post('/camera/start', (req: Request, res: Response) => {
  cameraService.start();
  res.json({ success: true, status: cameraService.getStatus() });
});

// Stop Camera Stream
apiRouter.post('/camera/stop', (req: Request, res: Response) => {
  cameraService.stop();
  res.json({ success: true, status: cameraService.getStatus() });
});

// Live MJPEG Camera Stream
apiRouter.get('/camera/stream', (req: Request, res: Response) => {
  cameraService.registerClient(res);
});

// Single Snapshot Frame
apiRouter.get('/camera/frame', (req: Request, res: Response) => {
  const buffer = cameraService.getLatestFrame();
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(buffer);
});

// Ingest Browser USB Camera Frames
apiRouter.post('/camera/ingest', (req: Request, res: Response) => {
  const { image } = req.body;
  if (image) {
    cameraService.ingestBrowserFrame(image);
  }
  res.json({ success: true });
});

// --- MILESTONE 2, 3, 4: Objects & Persistent Tracking ---
apiRouter.get('/objects', (req: Request, res: Response) => {
  res.json({
    objects: sceneEngine.getObjects(),
    count: sceneEngine.getObjects().length,
  });
});

apiRouter.post('/objects/sync', (req: Request, res: Response) => {
  const { objects } = req.body;
  if (Array.isArray(objects)) {
    sceneEngine.syncRealDetections(objects);
  }
  res.json({
    success: true,
    count: sceneEngine.getObjects().length,
    sceneGraph: sceneEngine.getSceneGraph(),
  });
});

// Gemini Multimodal Scene Perception
apiRouter.post('/vision/gemini-detect', async (req: Request, res: Response) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      aiAvailable: false,
      message: 'GEMINI_API_KEY sozlanmagan, lokal COCO-SSD detektori ishlatilmoqda.',
    });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const prompt = `You are SmartRoom AI, an embodied Physical AI vision system.
Analyze this camera image from the user's phone or room camera.
Identify key physical objects (e.g., laptop, phone, bottle, cup, chair, book, person).
Return a JSON array of objects with normalized 2D coordinates and spatial relationships:
Respond ONLY with a JSON object in this exact schema:
{
  "summaryUz": "Xonadagi asosiy obyektlar qisqa tavsifi",
  "objects": [
    {
      "name": "noutbuk",
      "category": "electronics",
      "confidence": 0.95,
      "box": { "x": 0.3, "y": 0.4, "width": 0.2, "height": 0.15 }
    }
  ],
  "spatialRelations": [
    { "source": "telefon", "predicate": "near", "target": "noutbuk", "description": "Telefon noutbuk yonida joylashgan" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        },
        { text: prompt },
      ],
    });

    const responseText = response.text || '{}';
    // parse json from text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summaryUz: responseText };

    res.json({
      aiAvailable: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('[Vision Gemini] Analysis error:', err);
    res.status(500).json({ error: err.message || 'AI tahlilida xatolik yuz berdi' });
  }
});

apiRouter.post('/vision/ask', async (req: Request, res: Response) => {
  const { question, imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Image is required for AI to see.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'GEMINI_API_KEY topilmadi.' });

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const prompt = `You are a highly capable AI vision assistant integrated into an augmented reality app.
The user is asking: "${question}"
Analyze the provided live camera frame carefully. Look for actions (e.g., holding water, blinking, smiling, pointing), specific objects, text, and environmental details.
Answer the question accurately, directly, and naturally in Uzbek. Keep your response conversational and to the point.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
        { text: prompt },
      ],
    });

    res.json({ answer: response.text });
  } catch (err: any) {
    console.error('[Vision Ask] Error:', err);
    res.status(500).json({ error: 'AI xatosi: ' + err.message });
  }
});

apiRouter.post('/objects/add', (req: Request, res: Response) => {
  const { name, x, y } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Object name is required' });
  }
  const created = sceneEngine.placeObject(name, x, y);
  res.json({ success: true, object: created });
});

apiRouter.post('/objects/:id/move', (req: Request, res: Response) => {
  const { id } = req.params;
  const { x, y } = req.body;
  if (x === undefined || y === undefined) {
    return res.status(400).json({ error: 'x and y coordinates are required' });
  }
  const success = sceneEngine.moveObject(id, Number(x), Number(y));
  res.json({ success });
});

apiRouter.post('/objects/:id/toggle-occlusion', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = sceneEngine.toggleOcclusion(id);
  res.json({ success });
});

apiRouter.delete('/objects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = sceneEngine.removeObject(id);
  res.json({ success });
});

apiRouter.post('/objects/reset', (req: Request, res: Response) => {
  sceneEngine.seedInitialRoomObjects();
  sceneEngine.recomputeSceneGraph();
  res.json({ success: true, objects: sceneEngine.getObjects() });
});

// --- Open-Vocabulary Concepts ---
apiRouter.get('/concepts', (req: Request, res: Response) => {
  res.json({ concepts: sceneEngine.getConcepts() });
});

apiRouter.post('/concepts', (req: Request, res: Response) => {
  const { concept } = req.body;
  const added = sceneEngine.addConcept(concept);
  res.json({ success: added, concepts: sceneEngine.getConcepts() });
});

// --- MILESTONE 5: Scene Graph ---
apiRouter.get('/scene-graph', (req: Request, res: Response) => {
  res.json(sceneEngine.getSceneGraph());
});

// --- MILESTONE 4: Temporal Events & History ---
apiRouter.get('/events', (req: Request, res: Response) => {
  res.json({ events: sceneEngine.getEvents(50) });
});

// --- MILESTONE 6 & 7: Natural Language Query & Geometric Verification ---
apiRouter.post('/query', (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question string is required' });
  }
  const result = queryEngine.processQuery(question);
  res.json(result);
});

// System Status Pipeline
apiRouter.get('/system/status', (req: Request, res: Response) => {
  const cam = cameraService.getStatus();
  const objects = sceneEngine.getObjects();
  const events = sceneEngine.getEvents();

  res.json({
    camera: cam.connected ? 'connected' : 'disconnected',
    detector: 'ready',
    tracker: 'ready',
    sceneGraph: 'active',
    fps: cam.fps,
    latencyMs: 14,
    activeObjectsCount: objects.filter((o) => o.state !== 'occluded').length,
    lastUpdateTimestamp: cam.lastFrameTime,
    eventsCount: events.length,
    concepts: sceneEngine.getConcepts(),
  });
});
