import { Box, Layers, HelpCircle, Terminal, CheckCircle2 } from 'lucide-react';

export function MiniatureRoomGuide() {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Physical Miniature Room Specification
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">University Assignment Spec</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Physical Objects Spec */}
        <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2.5">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-blue-400" />
            <span>Target Miniature Objects in Room</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            The system is designed for a miniature room observed by the USB camera with the following physical objects:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              🟫 Table (Central anchor)
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              🪑 2–3 Chairs (Left & Right)
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              💻 Laptop (On Table)
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              🧴 Bottle (Movable item)
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              🎒 Backpack (Near/Under table)
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              📦 Box / Cup / Phone
            </div>
          </div>
        </div>

        {/* Milestone 1 Verification Guide */}
        <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2.5">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Milestone 1 Verification Checklist</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span><strong>Webcam Connected:</strong> Live camera stream delivers frames continuously.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span><strong>Target FPS Pacing:</strong> Rate-limited to 15 FPS (configurable 10–30 FPS).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span><strong>Resolution Config:</strong> 1280×720 HD stream with real-time HUD indicators.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span><strong>Graceful Fallbacks:</strong> Handles camera disconnects or absence without crashes.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
