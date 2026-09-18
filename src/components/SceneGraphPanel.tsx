import React from 'react';
import { GitFork, ArrowRight, ShieldCheck } from 'lucide-react';
import type { SceneGraph, TrackedObject } from '../types';

interface SceneGraphPanelProps {
  sceneGraph: SceneGraph;
  objects: TrackedObject[];
  onSelectObject: (id: string | null) => void;
}

export function SceneGraphPanel({ sceneGraph, objects, onSelectObject }: SceneGraphPanelProps) {
  const getObjectName = (id: string) => {
    const found = objects.find((o) => o.id === id);
    return found ? `${found.name.toUpperCase()} [${id}]` : id;
  };

  const getPredicateBadge = (pred: string) => {
    switch (pred) {
      case 'on':
        return { label: 'USTIDA (ON)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'under':
        return { label: 'OSTIDA (UNDER)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
      case 'near':
        return { label: 'YONIDA (NEAR)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'left_of':
        return { label: 'CHAPIDA', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'right_of':
        return { label: 'O‘NGIDA', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      default:
        return { label: pred.toUpperCase(), color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Fazoviy Munosabatlar Grafi</h2>
            <p className="text-xs text-slate-400">
              Obyektlar orasidagi masofa va o‘zaro joylashuv ({sceneGraph.edges.length} ta bog‘lanish)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Real-time Hisoblangan</span>
        </div>
      </div>

      {/* Relations Cards */}
      {sceneGraph.edges.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <p className="text-sm font-medium text-slate-300">
            Hozircha fazoviy bog‘lanishlar yo‘q
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Kamera ko‘rinishida 2 yoki undan ortiq obyekt paydo bo‘lganda, ularning o‘zaro masofasi va fazoviy munosabati avtomatik shakllanadi.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sceneGraph.edges.map((edge) => {
            const badge = getPredicateBadge(edge.predicate);

            return (
              <div
                key={edge.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-wrap items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onSelectObject(edge.source)}
                    className="font-bold text-sm text-slate-100 hover:text-blue-400 transition-colors"
                  >
                    {getObjectName(edge.source)}
                  </button>

                  <span
                    className={`px-3 py-1 rounded-xl border text-xs font-bold uppercase tracking-wider ${badge.color}`}
                  >
                    {badge.label}
                  </span>

                  <ArrowRight className="w-4 h-4 text-slate-500" />

                  <button
                    type="button"
                    onClick={() => onSelectObject(edge.target)}
                    className="font-bold text-sm text-slate-100 hover:text-blue-400 transition-colors"
                  >
                    {getObjectName(edge.target)}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                    d = {edge.distance} birlik
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {Math.round(edge.confidence * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
