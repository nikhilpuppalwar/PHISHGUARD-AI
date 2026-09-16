import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage({ onNavigate, onSelectSubmission }) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [quickInput, setQuickInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [anData, incData] = await Promise.all([
          api.analytics.get().catch(() => null),
          api.incidents.list({ limit: 5 }).catch(() => [])
        ]);
        setAnalytics(anData);
        setRecentIncidents(incData || []);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onNavigate('submit', { initialText: quickInput });
  };

  const sampleQuick = "Congratulations! You have been selected for the Summer Analyst internship program. Pay ₹2,000 within 2 hours using bit.ly/internship-fee-2024 to reserve your slot.";

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0B1220] via-[#14233D] to-[#0B1220] text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Role: {user?.profile?.role || 'Student'} • Tier: {user?.profile?.security_awareness || 'Beginner'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.profile?.preferred_name || 'Alex'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              PhishGuard AI multi-agent defense pipeline is active and monitoring for inbound social engineering threats.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('submit')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
            >
              <span className="material-symbols-outlined text-[18px]">add_moderator</span>
              <span>New Threat Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-slate-500">Total Scanned</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 material-symbols-outlined text-[20px]">
              manage_search
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {analytics?.total_submissions || recentIncidents.length || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Inbound communication triage</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-slate-500">High Risk Attacks</span>
            <span className="p-2 rounded-lg bg-red-50 text-red-600 material-symbols-outlined text-[20px]">
              dangerous
            </span>
          </div>
          <div className="text-3xl font-extrabold text-red-600">
            {analytics?.high_risk_count || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Confirmed malicious signatures</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-slate-500">Average Risk Score</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600 material-symbols-outlined text-[20px]">
              speed
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {analytics?.average_risk_score ? `${analytics.average_risk_score}/100` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Bayesian composite metric</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-slate-500">Active ML Agents</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 material-symbols-outlined text-[20px]">
              hub
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">3 + RAG</div>
          <div className="text-[11px] text-slate-500 font-mono">Parallel inference operational</div>
        </div>
      </div>

      {/* Quick Submit Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Quick Unified Threat Ingestion</h3>
            <p className="text-xs text-slate-500">
              Paste any raw email, message snippet, or link. The AI automatically extracts text, URLs, and sender headers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setQuickInput(sampleQuick)}
            className="text-xs text-blue-600 hover:text-blue-800 font-mono font-medium underline"
          >
            Load Sample Internship Scam
          </button>
        </div>

        <form onSubmit={handleQuickSubmit} className="space-y-3">
          <textarea
            rows={3}
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Paste suspicious raw email with headers, SMS text, or URL here..."
            className="w-full p-3.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-detects: Email Headers • Shortened Links • Advance Fee Demands
            </span>
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>Launch Multi-Agent Triage</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>

      {/* Recent Submissions Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Threat Triage Activity</h3>
            <p className="text-xs text-slate-500">Historical analysis assessments and feedback confirmation state.</p>
          </div>
          <button
            onClick={() => onNavigate('incidents')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View All History →
          </button>
        </div>

        {recentIncidents.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <span className="material-symbols-outlined text-slate-300 text-[40px]">inbox</span>
            <p className="text-xs text-slate-500">No threat analyses yet. Paste a suspicious message above to test!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono uppercase text-slate-500 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentIncidents.map((inc) => {
                  const isHigh = inc.overall_score >= 75;
                  const isMed = inc.overall_score >= 40 && inc.overall_score < 75;
                  return (
                    <tr key={inc.submission_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {new Date(inc.submitted_at).toLocaleDateString()} {new Date(inc.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 uppercase font-mono font-semibold text-slate-700">
                        {inc.channel}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {inc.attack_type}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={isHigh ? 'text-red-600' : isMed ? 'text-amber-600' : 'text-emerald-600'}>
                          {inc.overall_score}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isHigh ? 'bg-red-50 text-red-700' : isMed ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectSubmission(inc.submission_id)}
                          className="px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
