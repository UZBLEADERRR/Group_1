import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  Compass,
  Calculator,
} from 'lucide-react';
import type { QueryResult } from '../types';

interface QueryConsoleProps {
  onRunQuery: (question: string) => Promise<QueryResult | null>;
}

export function QueryConsole({ onRunQuery }: QueryConsoleProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QueryResult | null>(null);

  const sampleQueries = [
    'Qaysi narsa eng yaqin?',
    'Telefon qayerda joylashgan?',
    'Noutbuk ustidami?',
    'Xonada nimalar ko‘rinyapti?',
    'Which object is closest to the laptop?',
  ];

  const handleSubmit = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const queryText = customQ || question;
    if (!queryText.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const result = await onRunQuery(queryText);
      if (result) {
        setLastResult(result);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">AI Savol-Javob & Geometrik Tekshiruv</h2>
            <p className="text-xs text-slate-400">
              Kameradagi jismoniy obyektlar haqida tabiiy tilda so‘rang
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" />
          <span>Matematik Tasdiqlangan</span>
        </div>
      </div>

      {/* Preset Queries Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {sampleQueries.map((sq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setQuestion(sq);
              handleSubmit(undefined, sq);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 active:scale-95 text-slate-200 text-xs font-medium transition-all"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Query Form */}
      <form onSubmit={(e) => handleSubmit(e)} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Savolingizni yozing (masalan: telefon qayerda? / qaysi narsa yaqin?)..."
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/30"
        >
          {isLoading ? (
            <Sparkles className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Hisoblanmoqda...' : 'So‘rash'}</span>
        </button>
      </form>

      {/* Result Card */}
      {lastResult && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Sun'iy Intellekt Javobi
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-sans font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tasdiqlangan
              </span>
              <span className="text-slate-400">
                {Math.round(lastResult.confidence * 100)}%
              </span>
            </div>
          </div>

          <div className="text-sm text-slate-100 font-medium leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            {lastResult.answer}
          </div>

          {/* Mathematical / Geometric Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono text-slate-400 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-slate-500">Formula: </span>
                <span className="text-slate-200">{lastResult.groundingDetails.rule}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-slate-500">Hisoblangan Masofa: </span>
                <span className="text-emerald-300 font-bold">
                  {lastResult.groundingDetails.calculatedMetric}
                </span>
                <span className="text-slate-500 ml-2">• </span>
                <span className="text-slate-300">{lastResult.groundingDetails.threshold}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
