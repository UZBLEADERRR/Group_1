import { useState, useEffect, useCallback, useRef } from 'react';
import { LiveCameraView, type LiveCameraRef } from './components/LiveCameraView';
import { BottomNavbar, type NavTab } from './components/BottomNavbar';
import { TrackedObjectsPanel } from './components/TrackedObjectsPanel';
import { SceneGraphPanel } from './components/SceneGraphPanel';
import { QueryConsole } from './components/QueryConsole';
import { CapstoneInfoModal } from './components/CapstoneInfoModal';
import { FaceRegistryModal } from './components/FaceRegistryModal';
import {
  Sparkles,
  Layers,
  GitFork,
  MessageSquare,
  ShieldCheck,
  X,
  Compass,
  CheckCircle,
  GraduationCap,
  UserCheck,
  Globe,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  TrackedObject,
  SceneGraph,
  QueryResult,
  RecognizedFace,
  OmniDetectedObject,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('camera');
  const [objects, setObjects] = useState<TrackedObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [sceneGraph, setSceneGraph] = useState<SceneGraph>({
    nodes: [],
    edges: [],
    updatedAt: Date.now(),
  });

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);
  const [isCapstoneModalOpen, setIsCapstoneModalOpen] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);

  // Face Recognition States
  const [recognizedFaces, setRecognizedFaces] = useState<RecognizedFace[]>([]);
  const [isFaceRecognitionActive, setIsFaceRecognitionActive] = useState(true);

  // Universal Omni Detection
  const [isOmniScanning, setIsOmniScanning] = useState(false);

  // Quick Questions Collapsed/Expanded State (defaults to false so it never blocks camera on mobile)
  const [showQuickQuestions, setShowQuickQuestions] = useState(false);

  const lastSyncTimeRef = useRef<number>(0);
  const cameraRef = useRef<LiveCameraRef>(null);
  const isRecognizingRef = useRef<boolean>(false);

  // Sync objects detected by real camera with backend scene engine
  const handleObjectsDetected = useCallback((detectedList: TrackedObject[]) => {
    setObjects(detectedList);

    // Throttle backend sync to once every 1.5 seconds
    const now = Date.now();
    if (now - lastSyncTimeRef.current > 1500 && detectedList.length > 0) {
      lastSyncTimeRef.current = now;
      fetch('/api/objects/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objects: detectedList }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.sceneGraph) {
            setSceneGraph(data.sceneGraph);
          }
        })
        .catch((err) => {
          console.debug('[Sync] Background sync tick:', err);
        });
    }
  }, []);

  // Fetch initial scene graph from backend
  const fetchSceneData = useCallback(async () => {
    try {
      const [sgRes, objRes] = await Promise.all([
        fetch('/api/scene-graph'),
        fetch('/api/objects'),
      ]);
      if (sgRes.ok) {
        const sg = await sgRes.json();
        setSceneGraph(sg);
      }
      if (objRes.ok) {
        const data = await objRes.json();
        if (data.objects && data.objects.length > 0 && objects.length === 0) {
          setObjects(data.objects);
        }
      }
    } catch (err) {
      console.warn('[App] Fetch error:', err);
    }
  }, [objects.length]);

  useEffect(() => {
    fetchSceneData();
  }, [fetchSceneData]);

  // Periodic Face Recognition Loop (every 4 seconds)
  useEffect(() => {
    if (!isFaceRecognitionActive) return;

    const faceInterval = setInterval(async () => {
      if (isRecognizingRef.current) return;
      const frame = cameraRef.current?.captureFrame();
      if (!frame) return;

      isRecognizingRef.current = true;
      try {
        const res = await fetch('/api/faces/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: frame }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.recognized && data.matches && data.matches.length > 0) {
            setRecognizedFaces(data.matches);
          } else {
            // Keep previous for a bit or clear
            setRecognizedFaces([]);
          }
        }
      } catch (e) {
        // Silent error in background face polling
      } finally {
        isRecognizingRef.current = false;
      }
    }, 3800);

    return () => clearInterval(faceInterval);
  }, [isFaceRecognitionActive]);

  // Universal Omni-Perception Scan: Detects everything in the room/scene
  const handleTriggerOmniScan = async () => {
    const frame = cameraRef.current?.captureFrame();
    if (!frame) {
      setQuickAnswer('Kameradan rasm olib bo‘lmadi.');
      return;
    }

    setIsOmniScanning(true);
    setQuickAnswer('Xona va butun atrof-muhit keng qamrovli AI orqali skanerlanmoqda...');

    try {
      const res = await fetch('/api/vision/omni-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: frame }),
      });

      if (res.ok) {
        const data = await res.json();
        const foundObjects: OmniDetectedObject[] = data.objects || [];

        if (foundObjects.length === 0) {
          setQuickAnswer('Hech qanday qo‘shimcha obyekt topilmadi.');
        } else {
          // Convert to persistent tracked objects with unique colors
          const PALETTE = ['#38bdf8', '#34d399', '#f472b6', '#a78bfa', '#fbbf24', '#f87171', '#4ade80', '#fb923c'];
          const now = Date.now();

          const convertedTracks: TrackedObject[] = foundObjects.map((item, idx) => ({
            id: `omni_${now}_${idx}`,
            name: item.name,
            category: item.category || 'general',
            confidence: item.confidence || 0.9,
            box: {
              x: item.box.x,
              y: item.box.y,
              width: item.box.width,
              height: item.box.height,
            },
            center: {
              x: item.box.x + item.box.width / 2,
              y: item.box.y + item.box.height / 2,
            },
            state: 'static',
            firstSeen: now,
            lastSeen: now,
            lostFrames: 0,
            velocity: { x: 0, y: 0 },
            history: [{ x: item.box.x + item.box.width / 2, y: item.box.y + item.box.height / 2, timestamp: now }],
            color: PALETTE[idx % PALETTE.length],
          }));

          // Merge with current objects
          setObjects((prev) => {
            const combined = [...prev, ...convertedTracks];
            // Sync with backend scene graph
            fetch('/api/objects/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ objects: combined }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.sceneGraph) setSceneGraph(d.sceneGraph);
              })
              .catch(() => {});
            return combined;
          });

          setQuickAnswer(`Skanerlash yakunlandi: ${foundObjects.length} ta yangi narsa (mebel, jihozlar, detallar) aniqlandi va sahnaga qo‘shildi!`);
        }
      } else {
        const err = await res.json();
        setQuickAnswer('Skanerlashda xato: ' + (err.error || 'Server javob bermadi'));
      }
    } catch (err: any) {
      setQuickAnswer('Omni skanerlash xatosi: ' + err.message);
    } finally {
      setIsOmniScanning(false);
    }
  };

  // Handle Gemini Multimodal Frame Analysis
  const handleCaptureAnalyze = async (base64: string) => {
    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      const res = await fetch('/api/vision/gemini-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();
      if (data.data) {
        setAiAnalysisResult(data.data);
      } else if (data.message) {
        setAiAnalysisResult({ summaryUz: data.message });
      }
    } catch (err: any) {
      console.error('[Gemini] Analysis error:', err);
      setAiAnalysisResult({
        summaryUz: 'AI tahlilida xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.',
      });
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Run Query
  const handleRunQuery = async (question: string): Promise<QueryResult | null> => {
    try {
      // First, try Gemini Vision if we can capture a frame
      const frameBase64 = cameraRef.current?.captureFrame();

      if (frameBase64) {
        const askRes = await fetch('/api/vision/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, imageBase64: frameBase64 }),
        });

        if (askRes.ok) {
          const data = await askRes.json();
          return {
            question,
            intent: 'gemini_vision',
            answer: data.answer,
            confidence: 0.99,
            verified: true,
            corrected: false,
            groundingDetails: {
              rule: 'Gemini Multimodal VLM',
              calculatedMetric: 'Kengaytirilgan Vizual Tahlil',
              threshold: 'Ochiq lug‘at va harakatlar',
            },
            timestamp: Date.now(),
          };
        }
      }

      // Fallback to basic geometric queries if frame fails or no Gemini
      if (objects.length > 0) {
        await fetch('/api/objects/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objects }),
        });
      }

      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (res.ok) {
        const result: QueryResult = await res.json();
        if (result.targetObjectId) {
          setSelectedObjectId(result.targetObjectId);
        }
        return result;
      }
    } catch (err) {
      console.warn('[App] Query error:', err);
    }
    return null;
  };

  // Quick 1-tap query right on camera screen
  const handleQuickQuestion = async (q: string) => {
    setQuickAnswer('Hisoblanmoqda...');
    const res = await handleRunQuery(q);
    if (res) {
      setQuickAnswer(res.answer);
    } else {
      setQuickAnswer('Javob topilmadi.');
    }
  };

  // Object management handlers
  const handleAddObject = async (name: string) => {
    try {
      const res = await fetch('/api/objects/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setObjects((prev) => [...prev, data.object]);
        fetchSceneData();
      }
    } catch (err) {
      console.warn('[App] Add error:', err);
    }
  };

  const handleRemoveObject = async (id: string) => {
    try {
      await fetch(`/api/objects/${id}`, { method: 'DELETE' });
      setObjects((prev) => prev.filter((o) => o.id !== id));
      if (selectedObjectId === id) setSelectedObjectId(null);
      fetchSceneData();
    } catch (err) {
      console.warn('[App] Remove error:', err);
    }
  };

  const handleResetScene = async () => {
    try {
      const res = await fetch('/api/objects/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setObjects(data.objects || []);
        setSelectedObjectId(null);
        fetchSceneData();
      }
    } catch (err) {
      console.warn('[App] Reset error:', err);
    }
  };

  const visibleObjects = objects.filter((o) => o.state !== 'occluded');

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col antialiased selection:bg-blue-500 selection:text-white pb-24 font-sans">
      
      {/* BACKGROUND CAMERA LAYER - Always rendered */}
      <LiveCameraView
        ref={cameraRef}
        onObjectsDetected={handleObjectsDetected}
        selectedObjectId={selectedObjectId}
        onSelectObject={setSelectedObjectId}
        onCaptureAnalyze={handleCaptureAnalyze}
        isAiAnalyzing={isAiAnalyzing}
        recognizedFaces={recognizedFaces}
        isFaceRecognitionActive={isFaceRecognitionActive}
        onToggleFaceRecognition={() => setIsFaceRecognitionActive((prev) => !prev)}
        onOpenFaceRegistry={() => setIsFaceModalOpen(true)}
        onTriggerOmniScan={handleTriggerOmniScan}
        isOmniScanning={isOmniScanning}
      />

      {/* Top Mobile-Friendly Header */}
      <header className="fixed top-0 inset-x-0 z-30 bg-gradient-to-b from-black/90 via-black/50 to-transparent pt-safe px-4 py-4 pb-8 pointer-events-none">
        <div className="max-w-2xl mx-auto flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                SMARTROOM AI
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">
                Physical AI Scene Understanding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCapstoneModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-bold text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Capstone G1</span>
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{visibleObjects.length} ta faol</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Overlay Area */}
      <main className="fixed bottom-[80px] inset-x-0 z-20 pointer-events-none flex flex-col justify-end px-3 mb-1">
        <div className="max-w-2xl w-full mx-auto overflow-y-auto scrollbar-none pointer-events-auto rounded-3xl">
        {/* TAB 1: CAMERA (Quick Tools Overlay) */}
        {activeTab === 'camera' && (
          <div className="flex flex-col gap-2">
            {/* Quick Answer Floating Toast (Dismissible with X) */}
            {quickAnswer && (
              <div className="p-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-blue-500/40 text-xs text-blue-100 shadow-2xl flex items-start justify-between gap-2 animate-fadeIn">
                <div className="flex items-start gap-2 flex-1">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{quickAnswer}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickAnswer(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0"
                  title="Yopish"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Compact Bottom Toolbar for Camera (Objects & Quick Savol Toggle) */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/75 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800/80 shadow-lg">
              {/* Detected Objects Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none flex-1">
                {visibleObjects.length === 0 ? (
                  <span className="text-[11px] text-slate-400 px-2 truncate">
                    Kamerani buyumlarga qarating...
                  </span>
                ) : (
                  visibleObjects.map((obj) => (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() =>
                        setSelectedObjectId(selectedObjectId === obj.id ? null : obj.id)
                      }
                      style={{
                        borderColor: selectedObjectId === obj.id ? obj.color : 'transparent',
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border text-[11px] font-medium shrink-0 transition-all ${
                        selectedObjectId === obj.id
                          ? 'ring-2 ring-white/60 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: obj.color }}
                      />
                      <span className="uppercase">{obj.name}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Toggle Quick Questions Button (Prevents blocking camera on mobile) */}
              <button
                type="button"
                onClick={() => setShowQuickQuestions((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                  showQuickQuestions
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-900/90 text-blue-300 border-blue-500/30 hover:bg-slate-800'
                }`}
                title="Tezkor savollar panelini ochish/yashirish"
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="text-[11px]">Savollar</span>
                {showQuickQuestions ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Quick Question Chips (Collapsible Drawer, so it NEVER blocks phone camera) */}
            {showQuickQuestions && (
              <div className="p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/70 shadow-2xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                    Tezkor Fazoviy Savollar
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQuickQuestions(false)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-slate-800"
                  >
                    <span>Yashirish</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {[
                    'Men kimman? (Yuzimni tani)',
                    'Qo‘limda suv yoki narsa bormi?',
                    'Ko‘zimni ochib yumdimmi?',
                    'Xonada nimalar bor?',
                    'Eng yaqin narsa nima?',
                    'Telefon qayerda?',
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickQuestion(q)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 active:scale-95 text-slate-200 text-[11px] font-medium transition-all text-left truncate"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OBJECTS */}
        {activeTab === 'objects' && (
          <div className="p-4 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
            <TrackedObjectsPanel
              objects={objects}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
              onAddObject={handleAddObject}
              onRemoveObject={handleRemoveObject}
              onResetScene={handleResetScene}
            />
          </div>
        )}

        {/* TAB 3: SCENE GRAPH */}
        {activeTab === 'graph' && (
          <div className="p-4 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
            <SceneGraphPanel
              sceneGraph={sceneGraph}
              objects={objects}
              onSelectObject={setSelectedObjectId}
            />
          </div>
        )}

        {/* TAB 4: CHAT / QUERY */}
        {activeTab === 'chat' && (
          <div className="p-4 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
            <QueryConsole onRunQuery={handleRunQuery} />
          </div>
        )}
        </div>
      </main>

      {/* Gemini AI Multimodal Analysis Modal / Drawer */}
      {aiAnalysisResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-100">
                  Gemini AI Vizual Tahlili
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAiAnalysisResult(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiAnalysisResult.summaryUz && (
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                {aiAnalysisResult.summaryUz}
              </p>
            )}

            {aiAnalysisResult.objects && aiAnalysisResult.objects.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">
                  Aniqlangan Obyektlar ({aiAnalysisResult.objects.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {aiAnalysisResult.objects.map((o: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                    >
                      <span className="font-bold uppercase text-blue-400">{o.name}</span>
                      <div className="text-[10px] text-slate-400">
                        {Math.round((o.confidence || 0.9) * 100)}% aniqlik
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysisResult.spatialRelations &&
              aiAnalysisResult.spatialRelations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">
                    Fazoviy Munosabatlar
                  </h4>
                  <div className="space-y-1.5">
                    {aiAnalysisResult.spatialRelations.map((r: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                      >
                        {r.description || `${r.source} ${r.predicate} ${r.target}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <button
              type="button"
              onClick={() => setAiAnalysisResult(null)}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold transition-all"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {isCapstoneModalOpen && (
        <CapstoneInfoModal onClose={() => setIsCapstoneModalOpen(false)} />
      )}

      {/* Face Registration & Management Modal */}
      <FaceRegistryModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        captureFrame={() => cameraRef.current?.captureFrame() || null}
        onFaceRegistered={() => {
          // Trigger immediate face recognition check
          if (cameraRef.current) {
            const frame = cameraRef.current.captureFrame();
            if (frame) {
              fetch('/api/faces/recognize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: frame }),
              })
                .then((r) => r.json())
                .then((d) => {
                  if (d.matches) setRecognizedFaces(d.matches);
                })
                .catch(() => {});
            }
          }
        }}
      />

      {/* Sticky Mobile Bottom Navigation */}
      <BottomNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        objectsCount={visibleObjects.length}
      />
    </div>
  );
}
