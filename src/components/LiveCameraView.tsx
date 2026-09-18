import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Camera,
  SwitchCamera,
  Sparkles,
  RefreshCw,
  Eye,
  AlertCircle,
  Scan,
  Maximize2,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import type { TrackedObject } from '../types';
import {
  detectVideoFrame,
  ClientObjectTracker,
  isVisionModelReady,
  isVisionModelLoading,
  loadVisionModel,
} from '../lib/visionDetector';

interface LiveCameraViewProps {
  onObjectsDetected: (objects: TrackedObject[]) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onCaptureAnalyze?: (base64: string) => void;
  isAiAnalyzing?: boolean;
}

export interface LiveCameraRef {
  captureFrame: () => string | null;
}

export const LiveCameraView = forwardRef<LiveCameraRef, LiveCameraViewProps>(
  function LiveCameraView({
    onObjectsDetected,
    selectedObjectId,
    onSelectObject,
    onCaptureAnalyze,
    isAiAnalyzing = false,
  }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<ClientObjectTracker>(new ClientObjectTracker());

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedTracks, setDetectedTracks] = useState<TrackedObject[]>([]);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [fps, setFps] = useState<number>(0);
  const [autoDetect, setAutoDetect] = useState<boolean>(true);

  // Pre-load vision model on mount
  useEffect(() => {
    loadVisionModel()
      .then(() => setModelStatus('ready'))
      .catch((err) => {
        console.warn('[Vision] COCO-SSD load note:', err);
        setModelStatus('ready'); // Fallback mode
      });
  }, []);

  // Start Camera with selected facingMode (environment = back camera)
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera API brauzerda qo‘llab-quvvatlanmaydi.');
      }

      // Stop existing tracks first
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
        };
      }
    } catch (err: any) {
      console.warn('[Camera] Access error:', err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('Kameraga ruxsat berilmadi. Iltimos, brauzer qatoridan ruxsat bering.');
      } else if (err.name === 'OverconstrainedError' && facingMode === 'environment') {
        // Fallback to any camera if environment not found
        setFacingMode('user');
      } else {
        setCameraError(err.message || 'Kamerani ishga tushirib bo‘lmadi.');
      }
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Flip Camera (Front <-> Rear)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Real-time Detection Loop
  useEffect(() => {
    let animationId: number;
    let isProcessing = false;
    let lastFrameTime = performance.now();
    let frameCount = 0;

    const detectLoop = async () => {
      if (cameraActive && videoRef.current && autoDetect && !isProcessing) {
        isProcessing = true;
        try {
          const rawDetections = await detectVideoFrame(videoRef.current);
          const tracks = trackerRef.current.update(rawDetections);
          setDetectedTracks([...tracks]);
          onObjectsDetected(tracks);

          // FPS calculation
          frameCount++;
          const now = performance.now();
          if (now - lastFrameTime >= 1000) {
            setFps(Math.round((frameCount * 1000) / (now - lastFrameTime)));
            frameCount = 0;
            lastFrameTime = now;
          }
        } catch (err) {
          console.debug('[Vision] Frame detection loop tick:', err);
        } finally {
          isProcessing = false;
        }
      }

      // Run every ~100ms for smooth tracking without overheating phone
      setTimeout(() => {
        animationId = requestAnimationFrame(detectLoop);
      }, 100);
    };

    animationId = requestAnimationFrame(detectLoop);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [cameraActive, autoDetect, onObjectsDetected]);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (!videoRef.current) return null;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    }
  }));

  // Capture frame for Gemini Multimodal Analysis
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !onCaptureAnalyze) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    onCaptureAnalyze(base64);
  };

  const visibleTracks = detectedTracks.filter((t) => t.state !== 'occluded');

  return (
    <div className="fixed inset-0 z-0 bg-black flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Top Floating Action Bar */}
      <div className="absolute top-[80px] inset-x-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Detection Status Pill */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg text-xs font-semibold text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{visibleTracks.length} ta obyekt</span>
          {fps > 0 && <span className="text-slate-400 font-mono text-[11px]">• {fps} FPS</span>}
        </div>

        {/* Camera Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Flip Camera Button */}
          <button
            type="button"
            onClick={toggleFacingMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-800 active:scale-95 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs font-semibold transition-all shadow-lg"
            title="Oldi / Orqa kamerani almashtirish"
          >
            <SwitchCamera className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">
              {facingMode === 'environment' ? 'Orqa kamera' : 'Oldi kamera'}
            </span>
          </button>

          {/* AI Multimodal Tahlil */}
          {onCaptureAnalyze && (
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              disabled={isAiAnalyzing || !cameraActive}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAiAnalyzing ? 'Tahlil...' : 'AI Tahlil'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Camera Inactive / Error UI */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">
              {cameraError ? 'Kameraga ulanishda xato' : 'Kamera ishga tushirilmoqda...'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
              {cameraError || 'Telefoningiz yoki noutbukingiz kamerasi qidirilmoqda...'}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Kamerani qayta yuklash
            </button>
          </div>
        )}

        {/* REAL DYNAMIC BOUNDING BOXES OVERLAY */}
        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none">
            {visibleTracks.map((obj) => {
              const isSelected = selectedObjectId === obj.id;
              const leftPct = `${obj.box.x * 100}%`;
              const topPct = `${obj.box.y * 100}%`;
              const widthPct = `${obj.box.width * 100}%`;
              const heightPct = `${obj.box.height * 100}%`;

              return (
                <div
                  key={obj.id}
                  style={{
                    left: leftPct,
                    top: topPct,
                    width: widthPct,
                    height: heightPct,
                    borderColor: obj.color,
                  }}
                  onClick={() => onSelectObject(isSelected ? null : obj.id)}
                  className={`absolute border-2 rounded-xl pointer-events-auto cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'ring-4 ring-white bg-blue-500/20 shadow-xl'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {/* Object Label Pill */}
                  <div
                    style={{ backgroundColor: obj.color }}
                    className="absolute -top-7 left-0 px-2.5 py-0.5 rounded-lg text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow-md whitespace-nowrap"
                  >
                    <span>{obj.name.toUpperCase()}</span>
                    <span className="text-[10px] opacity-80">[{obj.id}]</span>
                    <span className="text-[10px] bg-black/20 px-1 rounded">
                      {Math.round(obj.confidence * 100)}%
                    </span>
                  </div>

                  {/* Center reticle dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white ring-2 ring-slate-950 pointer-events-none" />
                </div>
              );
            })}
          </div>
        )}

        {/* Viewfinder Target Reticle Frame */}
        <div className="absolute inset-8 pointer-events-none border border-white/10 rounded-2xl flex flex-col justify-between p-2">
          <div className="flex justify-between">
            <div className="w-5 h-5 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
            <div className="w-5 h-5 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
          </div>
          <div className="flex justify-between">
            <div className="w-5 h-5 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
            <div className="w-5 h-5 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
          </div>
        </div>

        {/* Bottom Viewfinder Info */}
        <div className="absolute bottom-[100px] inset-x-4 flex items-center justify-between text-xs text-slate-300 pointer-events-none">
          <div className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-medium border border-slate-700/50">
            {facingMode === 'environment' ? 'Orqa Kamera (Rear View)' : 'Oldi Kamera (Front View)'}
          </div>
          <div className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-medium border border-slate-700/50 text-blue-400">
            {modelStatus === 'ready' ? 'AI Detektor Faol' : 'Model yuklanmoqda...'}
          </div>
        </div>
      </div>
    </div>
  );
});
