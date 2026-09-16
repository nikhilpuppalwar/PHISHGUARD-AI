import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function GlossaryPage({ onNavigate }) {
  const [attackTypes, setAttackTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.meta.getAttackTypes();
        setAttackTypes(data || []);
        if (data && data.length > 0) {
          setSelectedAttack(data[0]);
        }
      } catch (err) {
        console.error('Failed to load attack glossary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = attackTypes.filter((at) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return at.name.toLowerCase().includes(q) || at.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          Threat Encyclopedia (FR-18)
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Attack Type Glossary & Mitigation Reference
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Comprehensive reference guide to social engineering vectors, real-world forensic signatures, and defensive protocols.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <span className="material-symbols-outlined text-[18px]">search</span>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter attack categories (e.g. internship, credential, wire)..."
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
        />
      </div>

      {/* Glossary Split Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Category List */}
        <div className="lg:col-span-4 space-y-2.5">
          {filtered.map((at) => {
            const isSelected = selectedAttack?.attack_type_id === at.attack_type_id;
            return (
              <div
                key={at.attack_type_id}
                onClick={() => setSelectedAttack(at)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                    {at.name}
                  </h3>
                  <span className="material-symbols-outlined text-[18px] text-slate-400">
                    arrow_forward_ios
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {at.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Detail Card */}
        <div className="lg:col-span-8">
          {selectedAttack ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-red-100 text-red-600 material-symbols-outlined text-[20px]">
                    warning
                  </span>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                    Verified Attack Profile
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">{selectedAttack.name}</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {selectedAttack.description}
                </p>
              </div>

              {/* Sample Indicators */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-red-600 text-[18px]">find_in_page</span>
                  Sample Indicators & Forensic Red Flags:
                </div>
                <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-700 leading-relaxed">
                  {(selectedAttack.sample_indicators || []).map((ind, i) => (
                    <li key={i}>
                      <span className="font-medium text-slate-900">{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Defense and Mitigation Tips */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-900 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">shield</span>
                  Recommended Defense & Verification Protocol:
                </div>
                <ul className="space-y-1.5 pl-5 list-disc text-xs text-emerald-950 leading-relaxed">
                  {(selectedAttack.mitigation_tips || []).map((tip, i) => (
                    <li key={i}>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-slate-500 font-mono">
                  Referenced by FR-12 & FR-18 classification engines
                </span>
                <button
                  onClick={() => onNavigate('submit')}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  Test Sample of this Vector
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              Select an attack category from the left to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
