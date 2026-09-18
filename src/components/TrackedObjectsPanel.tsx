import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Navigation,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { TrackedObject } from '../types';

interface TrackedObjectsPanelProps {
  objects: TrackedObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onAddObject: (name: string) => void;
  onRemoveObject: (id: string) => void;
  onResetScene: () => void;
}

export function TrackedObjectsPanel({
  objects,
  selectedObjectId,
  onSelectObject,
  onAddObject,
  onRemoveObject,
  onResetScene,
}: TrackedObjectsPanelProps) {
  const [newConcept, setNewConcept] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcept.trim()) return;
    onAddObject(newConcept.trim().toLowerCase());
    setNewConcept('');
  };

  const visibleObjects = objects.filter((o) => o.state !== 'occluded');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Aniqlangan Obyektlar</h2>
            <p className="text-xs text-slate-400">
              Kamera tomonidan real vaqtda kuzatilayotgan buyumlar ({visibleObjects.length})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetScene}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-medium transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tozalash
        </button>
      </div>

      {/* Add Custom Concept */}
      <form onSubmit={handleAddSubmit} className="flex gap-2">
        <input
          type="text"
          value={newConcept}
          onChange={(e) => setNewConcept(e.target.value)}
          placeholder="Obyekt nomi (masalan: telefon, kitob, chashka)..."
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!newConcept.trim()}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
        >
          Qo‘shish
        </button>
      </form>

      {/* Objects Grid / List */}
      {visibleObjects.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-300">
            Hozircha obyektlar ko‘rinmadi
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Kamerani noutbuk, telefon, chashka, stul yoki boshqa buyumlarga qarating.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleObjects.map((obj) => {
            const isSelected = selectedObjectId === obj.id;

            return (
              <div
                key={obj.id}
                onClick={() => onSelectObject(isSelected ? null : obj.id)}
                style={{ borderLeftColor: obj.color }}
                className={`p-4 rounded-2xl border-l-4 border bg-slate-900/80 backdrop-blur-sm cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                      {obj.name}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {obj.id}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveObject(obj.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      ({obj.center.x.toFixed(2)}, {obj.center.y.toFixed(2)})
                    </span>
                  </div>
                  <span className="text-emerald-400 font-semibold font-sans">
                    {Math.round(obj.confidence * 100)}% aniqlik
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
