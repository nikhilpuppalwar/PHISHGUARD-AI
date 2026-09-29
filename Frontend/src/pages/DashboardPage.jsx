import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage({ onNavigate, onSelectSubmission }) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAiSummary = async () => {
    setLoadingSummary(true);
    try {
      const summaryData = await api.analytics.getAiSummary();
      setAiSummary(summaryData);
    } catch (err) {
      console.warn('Failed to load AI summary:', err);
      setAiSummary({ summary: 'AI summary is temporarily unavailable. Core multi-agent telemetry remains fully operational.' });
    } finally {
      setLoadingSummary(false);
    }
  };

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
    fetchAiSummary();
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
      <div className="p-6 sm:p-7 rounded-xl bg-navy-900 text-white border border-navy-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-mono bg-navy-800 text-slate-200 border border-slate-700">
              <span>Role: <strong className="text-white font-semibold">{user?.profile?.role || 'Student'}</strong></span>
              <span className="text-slate-500">•</span>
              <span>Awareness: <strong className="text-white font-semibold">{user?.profile?.security_awareness || 'Standard'}</strong></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.profile?.preferred_name || 'Analyst'}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              PhishGuard AI detection pipeline is active. Evaluate suspicious emails, text messages, and links below.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('submit')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition"
            >
              <span className="material-symbols-outlined text-[19px]">add_moderator</span>
              <span>New Threat Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Security Summary Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[19px]">psychology</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight font-mono">
              System Telemetry Summary
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {aiSummary?.llm_provider && (
              <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                Engine: <strong className="text-slate-800 uppercase">{aiSummary.llm_provider}</strong>
              </span>
            )}
            <button
              onClick={fetchAiSummary}
              disabled={loadingSummary}
              className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition disabled:opacity-50"
              title="Refresh Telemetry Summary"
              aria-label="Refresh Telemetry Summary"
            >
              <span className={`material-symbols-outlined text-[18px] ${loadingSummary ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        <div>
          {loadingSummary ? (
            <div className="flex items-center gap-2.5 py-2 text-xs text-slate-500 font-mono">
              <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing multi-agent intelligence telemetry...</span>
            </div>
          ) : (
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-sans font-normal">
              {aiSummary?.summary || 'Telemetry status normal. Active models are trained on audited phishing corpora.'}
            </p>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono uppercase font-semibold text-slate-500">
            <span>Total Scanned</span>
            <span className="material-symbols-outlined text-[20px] text-slate-400">manage_search</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {analytics?.total_submissions || recentIncidents.length || 0}
          </div>
          <div className="text-xs text-slate-500">Inbound submissions analyzed</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono uppercase font-semibold text-slate-500">
            <span>High Risk Threats</span>
            <span className="material-symbols-outlined text-[20px] text-red-500">dangerous</span>
          </div>
          <div className="text-3xl font-extrabold text-red-600">
            {analytics?.high_risk_count || 0}
          </div>
          <div className="text-xs text-slate-500 font-mono">Score ≥ 75/100</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono uppercase font-semibold text-slate-500">
            <span>Average Risk Score</span>
            <span className="material-symbols-outlined text-[20px] text-amber-500">speed</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {analytics?.average_risk_score ? `${analytics.average_risk_score}/100` : '—'}
          </div>
          <div className="text-xs text-slate-500">Bayesian composite metric</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono uppercase font-semibold text-slate-500">
            <span>Active ML Agents</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-500">hub</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            3 + RAG
          </div>
          <div className="text-xs text-slate-500">Text, URL, Sender, Incident Vector</div>
        </div>
      </div>

      {/* Quick Submit Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Quick Threat Ingestion</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Paste suspicious email text, headers, SMS content, or a solitary link.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setQuickInput(sampleQuick)}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            Load Sample Internship Scam
          </button>
        </div>

        <form onSubmit={handleQuickSubmit} className="space-y-3.5">
          <label htmlFor="quick-threat-input" className="sr-only">Suspicious message or link</label>
          <textarea
            id="quick-threat-input"
            rows={3}
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Paste raw email, SMS, or URL here..."
            className="w-full p-3.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition leading-relaxed"
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-mono">
              Auto-extracts: Sender Headers, Clean Text, Embedded URLs, and Channels
            </span>
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition disabled:opacity-50 inline-flex items-center justify-center gap-1.5 self-end sm:self-auto"
            >
              <span>Analyze Threat</span>
              <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>

      {/* Recent Submissions Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Threat Triage Activity</h3>
            <p className="text-xs text-slate-500">Past risk assessments and verified feedback state.</p>
          </div>
          <button
            onClick={() => onNavigate('incidents')}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View All History →
          </button>
        </div>

        {recentIncidents.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <span className="material-symbols-outlined text-slate-300 text-[40px]">inbox</span>
            <div className="text-sm font-semibold text-slate-700">No submissions recorded yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Analyze your first suspicious email or link using the input box above to see analysis records here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono uppercase text-slate-600 text-xs">
                <tr>
                  <th className="py-3 px-4 font-bold">Date / Time</th>
                  <th className="py-3 px-4 font-bold">Channel</th>
                  <th className="py-3 px-4 font-bold">Classification</th>
                  <th className="py-3 px-4 font-bold">Threat Score</th>
                  <th className="py-3 px-4 font-bold">Severity</th>
                  <th className="py-3 px-4 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentIncidents.map((inc) => {
                  const isHigh = inc.overall_score >= 75;
                  const isMed = inc.overall_score >= 40 && inc.overall_score < 75;
                  return (
                    <tr key={inc.submission_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-700 text-xs sm:text-sm">
                        {new Date(inc.submitted_at).toLocaleDateString()} {new Date(inc.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 uppercase font-mono font-semibold text-slate-800 text-xs sm:text-sm">
                        {inc.channel}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 text-sm">
                        {inc.attack_type}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sm">
                        <span className={isHigh ? 'text-red-600' : isMed ? 'text-amber-600' : 'text-emerald-600'}>
                          {inc.overall_score}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wider ${
                          isHigh 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : isMed 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectSubmission(inc.submission_id)}
                          className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 text-xs font-semibold transition"
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
