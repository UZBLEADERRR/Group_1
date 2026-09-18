import React from 'react';
import { X, GraduationCap, Users, BookOpen, Layers } from 'lucide-react';

interface CapstoneInfoModalProps {
  onClose: () => void;
}

export function CapstoneInfoModal({ onClose }: CapstoneInfoModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">Capstone Project Group 1</h2>
              <p className="text-xs text-slate-400">Sejong University • Semantic Scene Understanding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Overview */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Master Execution Plan
            </h3>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-300 leading-relaxed space-y-3">
              <p>
                This document serves as the central architectural blueprint for the 
                <strong> "Semantic Scene Understanding and Scene-Graph Reasoning" </strong> Capstone project.
              </p>
              <p>
                <strong>Professors:</strong> Abolghasem Sadeghi & Rajendra Dhakal<br />
                <strong>Institution:</strong> Sejong University
              </p>
              <p className="text-xs text-slate-400">
                It outlines the strategic pivot to a tabletop "Micro-World" and virtual environment, bypassing the complexities of mobile robotics and physical LiDAR while strictly adhering to the grading rubric and academic requirements.
              </p>
            </div>
          </div>

          {/* Division of Labor */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Division of Labor (7-Student Distribution)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs font-bold text-blue-400 mb-1">S1: Muzaffar</div>
                <div className="text-xs font-medium text-slate-200">Sensors & Data</div>
                <div className="text-[10px] text-slate-400 mt-1">Setup RealSense tripod, calibrate, and record ROS bags.</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs font-bold text-emerald-400 mb-1">S2: Sarvar</div>
                <div className="text-xs font-medium text-slate-200">3D Preprocessing</div>
                <div className="text-[10px] text-slate-400 mt-1">Clean depth data and project 2D masks into 3D space.</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs font-bold text-purple-400 mb-1">S3: Li</div>
                <div className="text-xs font-medium text-slate-200">Open-Vocab Perception</div>
                <div className="text-[10px] text-slate-400 mt-1">YOLO-World and MobileSAM wrappers for RGB frames.</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs font-bold text-amber-400 mb-1">S4: Jaloliddin</div>
                <div className="text-xs font-medium text-slate-200">Scene Graph Engine</div>
                <div className="text-[10px] text-slate-400 mt-1">Build NetworkX graph from 3D nodes and geometric edges.</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs font-bold text-rose-400 mb-1">S5: Sanjar</div>
                <div className="text-xs font-medium text-slate-200">Language Verifier</div>
                <div className="text-[10px] text-slate-400 mt-1">LLM query parsing into JSON and Python geometry script verification.</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs font-bold text-cyan-400 mb-1">S6: Shahzod</div>
                <div className="text-xs font-medium text-slate-200">Action & Tracking</div>
                <div className="text-[10px] text-slate-400 mt-1">Maintain object IDs (tracking) and translate into simulated ActionGoal.</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 md:col-span-2">
                <div className="text-xs font-bold text-indigo-400 mb-1">S7: Mirzohid</div>
                <div className="text-xs font-medium text-slate-200">Integration & UI</div>
                <div className="text-[10px] text-slate-400 mt-1">Combine all scripts into a single launch file and build the live dashboard.</div>
              </div>

            </div>
          </div>

          {/* Academic Framing */}
          <div className="space-y-2 pb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Academic Framing
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <li><strong>ConceptGraphs Grounding:</strong> Real-time heavy, open-vocabulary 3D scene graphs via zero-shot 2D foundation models.</li>
              <li><strong>SayPlan Verification:</strong> Preventing LLM hallucination in robotics via deterministic Euclidean math verification.</li>
              <li><strong>Sim-to-Real Resilience:</strong> Executing ActionGoals in a Digital Twin virtual environment for safety protocol validation.</li>
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
}
