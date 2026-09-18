import React, { useState, useEffect } from 'react';
import { UserCheck, Trash2, Camera, UserPlus, Check, X, Shield, Sparkles } from 'lucide-react';
import type { RegisteredFace } from '../types';

interface FaceRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  captureFrame: () => string | null;
  onFaceRegistered?: () => void;
}

export function FaceRegistryModal({
  isOpen,
  onClose,
  captureFrame,
  onFaceRegistered,
}: FaceRegistryModalProps) {
  const [people, setPeople] = useState<RegisteredFace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Load existing faces
  const loadFaces = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/faces/list');
      if (res.ok) {
        const data = await res.json();
        setPeople(data.people || []);
      }
    } catch (e) {
      console.error('Error loading faces:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFaces();
      setSnapshot(null);
      setName('');
      setRole('');
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTakeSnapshot = () => {
    const frame = captureFrame();
    if (frame) {
      setSnapshot(frame);
      setStatusMsg('Rasm muvaffaqiyatli olindi! Endi ismingizni kiriting.');
    } else {
      setStatusMsg('Kameradan rasm olib bo‘lmadi. Kamera yoqilganligini tekshiring.');
    }
  };

  const handleSaveFace = async () => {
    if (!name.trim()) {
      setStatusMsg('Iltimos, ismingizni kiriting.');
      return;
    }
    if (!snapshot) {
      setStatusMsg('Iltimos, avval kameradan suratga oling.');
      return;
    }

    try {
      setIsSaving(true);
      setStatusMsg('AI yuz xususiyatlarini tahlil qilmoqda...');

      const res = await fetch('/api/faces/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim() || 'G1 A‘zosi',
          imageBase64: snapshot,
        }),
      });

      if (res.ok) {
        setStatusMsg('Tabriklaymiz! Yuz muvaffaqiyatli ro‘yxatdan o‘tkazildi.');
        setSnapshot(null);
        setName('');
        setRole('');
        loadFaces();
        if (onFaceRegistered) onFaceRegistered();
      } else {
        const err = await res.json();
        setStatusMsg('Xatolik: ' + (err.error || 'Saqlab bo‘lmadi'));
      }
    } catch (err: any) {
      setStatusMsg('Aloqa xatosi: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFace = async (id: string) => {
    try {
      const res = await fetch(`/api/faces/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPeople((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                Yuzni Ro‘yxatga Olish (Face ID)
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400">
                Kamera sizga qaraganda ismingizni aytib taniydi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 scrollbar-none">
          {/* Capture Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-3 text-center">
            {snapshot ? (
              <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl shadow-emerald-500/10">
                <img src={snapshot} alt="Yuz surati" className="w-full h-full object-cover" />
                <button
                  onClick={() => setSnapshot(null)}
                  className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-rose-600"
                  title="Qayta suratga olish"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Camera className="w-8 h-8 text-slate-500" />
                <span className="text-[11px]">Yuzingizni kameraga to‘g‘irlang</span>
              </div>
            )}

            <button
              onClick={handleTakeSnapshot}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              {snapshot ? 'Qayta suratga olish' : 'Hozirgi kadrni suratga olish'}
            </button>
          </div>

          {/* Form Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ismingiz (Familiya yoki Nickname) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Sarvarbek"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Roli yoki Guruhdagi Vazifasi
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Masalan: Capstone G1 Leader / Talaba"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {statusMsg && (
              <div className="text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                {statusMsg}
              </div>
            )}

            <button
              onClick={handleSaveFace}
              disabled={isSaving || !snapshot || !name.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <UserPlus className="w-4 h-4" />
              {isSaving ? 'Saqlanmoqda...' : 'Yuzni Ro‘yxatdan O‘tkazish'}
            </button>
          </div>

          {/* Registered Faces List */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Ro‘yxatdan o‘tgan shaxslar ({people.length})
              </span>
              {isLoading && <span className="text-[10px] text-slate-500">Yuklanmoqda...</span>}
            </h4>

            {people.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
                Hozircha hech kim ro‘yxatdan o‘tmagan. Yuqoridan o‘z yuzingizni qo‘shing!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {people.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.photoBase64}
                        alt={p.name}
                        className="w-9 h-9 rounded-full object-cover border border-emerald-500/50"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                        <div className="text-[10px] text-emerald-400 font-medium">{p.role || 'Foydalanuvchi'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFace(p.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
