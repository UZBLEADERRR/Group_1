import { useState, useEffect } from 'react';
import { Settings, Play, Square, RefreshCw, Sliders, Video, Monitor, Sparkles } from 'lucide-react';
import type { CameraConfig, CameraDeviceInfo, CameraSourceMode, CameraStatus } from '../types';

interface CameraControlsProps {
  config: CameraConfig;
  cameraStatus: CameraStatus | null;
  onConfigChange: (newConfig: Partial<CameraConfig>) => void;
  onStart: () => void;
  onStop: () => void;
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
}

export function CameraControls({
  config,
  cameraStatus,
  onConfigChange,
  onStart,
  onStop,
  selectedDeviceId,
  onDeviceChange,
}: CameraControlsProps) {
  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Discover browser media devices (cameras)
  const enumerateDevices = async () => {
    setIsScanning(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices
          .filter((d) => d.kind === 'videoinput')
          .map((d, index) => ({
            deviceId: d.deviceId,
            label: d.label || `USB Camera ${index + 1}`,
            kind: 'videoinput' as const,
          }));
        setDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          onDeviceChange(videoInputs[0].deviceId);
        }
      }
    } catch (err) {
      console.warn('[CameraControls] Could not enumerate devices:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    enumerateDevices();
  }, []);

  const isRunning = cameraStatus?.connected ?? true;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Settings className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Camera & Stream Configuration
          </h3>
        </div>

        {/* Start / Stop Stream Toggle */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30 text-xs font-semibold transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop Camera
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Camera
            </button>
          )}
        </div>
      </div>

      {/* Feed Source Mode Selector (Three Options) */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Perception Video Source
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Option 1: Browser USB Camera */}
          <button
            type="button"
            onClick={() => onConfigChange({ sourceMode: 'browser' })}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
              config.sourceMode === 'browser'
                ? 'bg-blue-600/20 border-blue-500 text-blue-200 ring-1 ring-blue-500/50'
                : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <Video className="w-4 h-4 text-blue-400" />
              {config.sourceMode === 'browser' && (
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              )}
            </div>
            <div className="font-semibold text-xs text-slate-200">Browser USB Cam</div>
            <div className="text-[11px] text-slate-400">Physical webcam via getUserMedia</div>
          </button>

          {/* Option 2: Server MJPEG Stream */}
          <button
            type="button"
            onClick={() => onConfigChange({ sourceMode: 'server_mjpeg' })}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
              config.sourceMode === 'server_mjpeg'
                ? 'bg-blue-600/20 border-blue-500 text-blue-200 ring-1 ring-blue-500/50'
                : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <Monitor className="w-4 h-4 text-indigo-400" />
              {config.sourceMode === 'server_mjpeg' && (
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              )}
            </div>
            <div className="font-semibold text-xs text-slate-200">Server Stream</div>
            <div className="text-[11px] text-slate-400">/api/camera/stream HTTP MJPEG</div>
          </button>

          {/* Option 3: Miniature Room Testbed */}
          <button
            type="button"
            onClick={() => onConfigChange({ sourceMode: 'synthetic_room' })}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
              config.sourceMode === 'synthetic_room'
                ? 'bg-blue-600/20 border-blue-500 text-blue-200 ring-1 ring-blue-500/50'
                : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {config.sourceMode === 'synthetic_room' && (
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              )}
            </div>
            <div className="font-semibold text-xs text-slate-200">Miniature Room Rig</div>
            <div className="text-[11px] text-slate-400">Overhead camera & test objects</div>
          </button>
        </div>
      </div>

      {/* Camera Selection Dropdown (When in browser mode) */}
      {config.sourceMode === 'browser' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Select USB Camera Device
            </label>
            <button
              type="button"
              onClick={enumerateDevices}
              className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
              Scan Devices
            </button>
          </div>
          <select
            value={selectedDeviceId}
            onChange={(e) => onDeviceChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {devices.length === 0 ? (
              <option value="">Default System Webcam</option>
            ) : (
              devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Resolution & FPS Target Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Resolution */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Target Resolution
          </label>
          <select
            value={`${config.width}x${config.height}`}
            onChange={(e) => {
              const [w, h] = e.target.value.split('x').map(Number);
              onConfigChange({ width: w, height: h });
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="1280x720">1280 × 720 (HD - Recommended)</option>
            <option value="640x360">640 × 360 (Fast Low-Compute)</option>
            <option value="1920x1080">1920 × 1080 (Full HD)</option>
          </select>
        </div>

        {/* Target FPS */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Target Frame Rate (FPS)
          </label>
          <select
            value={config.targetFps}
            onChange={(e) => onConfigChange({ targetFps: Number(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="10">10 FPS (Student Laptop Friendly)</option>
            <option value="15">15 FPS (Default Target)</option>
            <option value="20">20 FPS (Fluid Rate)</option>
            <option value="30">30 FPS (Full Sensor Rate)</option>
          </select>
        </div>
      </div>

      {/* Diagnostics Readout */}
      <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 text-[11px] font-mono text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>CAMERA_INDEX:</span>
          <span className="text-slate-200 font-semibold">{config.cameraIndex}</span>
        </div>
        <div className="flex justify-between">
          <span>FRAME_PIPELINE:</span>
          <span className="text-emerald-400">ACTIVE ({config.width}x{config.height})</span>
        </div>
        <div className="flex justify-between">
          <span>AUTO_RECONNECT:</span>
          <span className="text-blue-400">{config.autoReconnect ? 'ENABLED' : 'DISABLED'}</span>
        </div>
      </div>
    </div>
  );
}
