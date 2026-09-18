import { Camera, Cpu, Activity, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CameraStatus } from '../types';

interface SystemStatusBarProps {
  cameraStatus: CameraStatus | null;
  activeSource: string;
  measuredFps: number;
}

export function SystemStatusBar({ cameraStatus, activeSource, measuredFps }: SystemStatusBarProps) {
  const isConnected = cameraStatus?.connected ?? false;
  const displayFps = measuredFps > 0 ? measuredFps : (cameraStatus?.fps ?? 15.0);

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Project Concept */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">SMARTROOM AI</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                MILESTONE 1
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Real-Time Physical AI Scene Understanding System · Miniature Room Testbed
            </p>
          </div>
        </div>

        {/* Real-Time Metrics & Telemetry */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Camera Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            {isConnected ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            )}
            <span className="text-slate-400">Camera:</span>
            <span className={`font-semibold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </span>
          </div>

          {/* AI Perception Engine */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Perception:</span>
            <span className="font-semibold text-indigo-400">● Running</span>
          </div>

          {/* FPS Telemetry */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">FPS:</span>
            <span className="font-bold text-amber-300">{displayFps.toFixed(1)}</span>
            <span className="text-slate-500 text-[10px]">({cameraStatus?.targetFps ?? 15} target)</span>
          </div>

          {/* Active Feed Mode Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/60 text-xs text-blue-300">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="capitalize font-medium">{activeSource.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
