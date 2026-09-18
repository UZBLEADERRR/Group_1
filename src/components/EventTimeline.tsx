import React from 'react';
import { History, Activity, Clock, ArrowRight, EyeOff, Eye } from 'lucide-react';
import type { SceneEvent } from '../types';

interface EventTimelineProps {
  events: SceneEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  const getEventBadge = (type: SceneEvent['type']) => {
    switch (type) {
      case 'OBJECT_APPEARED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'OBJECT_DISAPPEARED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'OBJECT_MOVED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'OBJECT_REAPPEARED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <History className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Temporal Memory & Scene Event Log (Milestone 4)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {events.length} Events Recorded
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No events recorded yet. Move or toggle objects to log changes.
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold tracking-wider mt-0.5 whitespace-nowrap ${getEventBadge(
                    evt.type
                  )}`}
                >
                  {evt.type.replace('OBJECT_', '')}
                </span>

                <div>
                  <div className="font-semibold text-slate-200 text-xs">
                    {evt.details}
                  </div>
                  {evt.from && evt.to && (
                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                      <span>({evt.from.x.toFixed(2)}, {evt.from.y.toFixed(2)})</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-amber-300">
                        ({evt.to.x.toFixed(2)}, {evt.to.y.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 whitespace-nowrap">
                <Clock className="w-3 h-3" />
                <span>{evt.timeStr}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
