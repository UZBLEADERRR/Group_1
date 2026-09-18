import {
  CheckCircle2,
  Video,
  Target,
  Hash,
  Database,
  GitFork,
  MessageSquare,
  Compass,
} from 'lucide-react';

export function MilestoneTracker() {
  const milestones = [
    {
      id: 1,
      name: '1: Live Stream',
      desc: 'USB Camera → Browser Feed',
      icon: Video,
    },
    {
      id: 2,
      name: '2: Detection',
      desc: 'Open-vocabulary Bounding Boxes',
      icon: Target,
    },
    {
      id: 3,
      name: '3: Tracking',
      desc: 'ByteTrack Persistent IDs',
      icon: Hash,
    },
    {
      id: 4,
      name: '4: Memory',
      desc: 'Temporal History & Movement',
      icon: Database,
    },
    {
      id: 5,
      name: '5: Scene Graph',
      desc: 'ON, UNDER, NEAR Triples',
      icon: GitFork,
    },
    {
      id: 6,
      name: '6: Language',
      desc: 'Natural Language Reasoning',
      icon: MessageSquare,
    },
    {
      id: 7,
      name: '7: Geometry',
      desc: 'Euclidean Verification',
      icon: Compass,
    },
  ];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Physical AI Engineering Milestones (All 7 Active)
        </h3>
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Full Pipeline Operational
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
        {milestones.map((m) => {
          const Icon = m.icon;

          return (
            <div
              key={m.id}
              className="p-3 rounded-xl border flex flex-col justify-between transition-all bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-semibold text-xs text-slate-100 leading-tight mb-1">
                  {m.name}
                </div>
                <div className="text-[10px] text-slate-400 leading-snug">{m.desc}</div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Active
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
