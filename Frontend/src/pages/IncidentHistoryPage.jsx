import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function IncidentHistoryPage({ onNavigate, onSelectSubmission }) {
  const [incidents, setIncidents] = useState([]);
  const [channelFilter, setChannelFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.incidents.list({
        channel: channelFilter !== 'all' ? channelFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
      });
      setIncidents(data || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [channelFilter, severityFilter]);

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (inc.attack_type && inc.attack_type.toLowerCase().includes(q)) ||
      (inc.sender && inc.sender.toLowerCase().includes(q)) ||
      (inc.raw_snippet && inc.raw_snippet.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Threat History Database
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Incident History & Evidence Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit past submissions, compare risk variations, and review recorded feedback labels.
          </p>
        </div>

        <button
          onClick={() => onNavigate('submit')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_moderator</span>
          <span>New Submission</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender, attack, or text..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-slate-500">Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="url">URL</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-slate-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Severities</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incident List */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-mono flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Loading incident history...
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-slate-300 text-[48px]">history</span>
            <h3 className="text-base font-bold text-slate-800">No Incidents Found</h3>
            <p className="text-xs text-slate-500">
              No previous analyses match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono uppercase text-slate-500 text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4">Sender / Origin</th>
                  <th className="py-3.5 px-4">Attack Classification</th>
                  <th className="py-3.5 px-4">Threat Score</th>
                  <th className="py-3.5 px-4">Feedback</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncidents.map((inc) => {
                  const isHigh = inc.overall_score >= 75;
                  const isMed = inc.overall_score >= 40 && inc.overall_score < 75;
                  return (
                    <tr key={inc.submission_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(inc.submitted_at).toLocaleDateString()} {new Date(inc.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 uppercase">
                          {inc.channel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 max-w-[180px] truncate">
                        {inc.sender || 'Anonymous'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[200px] truncate">
                        {inc.attack_type}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                        <span className={isHigh ? 'text-red-600' : isMed ? 'text-amber-600' : 'text-emerald-600'}>
                          {inc.overall_score}/100
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1 font-normal">({inc.severity})</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inc.has_feedback ? (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                            {inc.feedback_verdict?.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">Unconfirmed</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectSubmission(inc.submission_id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
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
