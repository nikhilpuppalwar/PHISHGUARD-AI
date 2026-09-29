import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

export default function IncidentHistoryPage({ onNavigate, onSelectSubmission }) {
  const [incidents, setIncidents] = useState([]);
  const [channelFilter, setChannelFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (channelFilter && channelFilter !== 'all') {
        params.channel = channelFilter;
      }
      if (severityFilter && severityFilter !== 'all') {
        params.severity = severityFilter;
      }
      const data = await api.incidents.list(params);
      setIncidents(data || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
      setError(err.message || 'Unable to load incident history.');
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
      {/* Consistent Header & Breadcrumbs */}
      <PageHeader
        screenId="incidents"
        eyebrow="WORKSPACE"
        title="Incident History"
        description="Review past submissions, inspect risk scoring variances, and verify recorded analyst feedback."
        onNavigate={onNavigate}
      >
        <button
          onClick={() => onNavigate('submit')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Analyze Threat</span>
        </button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <label htmlFor="incident-search" className="sr-only">Search incidents</label>
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            id="incident-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender, attack, or text..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <label htmlFor="channel-filter" className="text-xs font-mono text-slate-500">Channel:</label>
            <select
              id="channel-filter"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="url">URL</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="severity-filter" className="text-xs font-mono text-slate-500">Severity:</label>
            <select
              id="severity-filter"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Severities</option>
              <option value="High Risk">High Risk</option>
              <option value="Medium Risk">Medium Risk</option>
              <option value="Low Risk">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incident List Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500 font-mono">
            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin inline-block mr-2" />
            Loading incident history...
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <span className="material-symbols-outlined text-red-500 text-[36px]">error</span>
            <div className="text-xs font-semibold text-slate-900">{error}</div>
            <button
              type="button"
              onClick={fetchIncidents}
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <span className="material-symbols-outlined text-slate-300 text-[36px]">folder_off</span>
            <div className="text-xs font-semibold text-slate-700">No incident records found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || channelFilter !== 'all' || severityFilter !== 'all'
                ? 'No submissions match your active filter criteria.'
                : 'No suspicious content has been submitted yet. Submit your first threat to start the log.'}
            </p>
            {(searchQuery || channelFilter !== 'all' || severityFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setChannelFilter('all');
                  setSeverityFilter('all');
                }}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono uppercase text-slate-500 text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Date / Time</th>
                  <th className="py-2.5 px-4 font-semibold">Channel</th>
                  <th className="py-2.5 px-4 font-semibold">Sender / Source</th>
                  <th className="py-2.5 px-4 font-semibold">Attack Type</th>
                  <th className="py-2.5 px-4 font-semibold">Threat Score</th>
                  <th className="py-2.5 px-4 font-semibold">Severity</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncidents.map((inc) => {
                  const isHigh = inc.overall_score >= 75;
                  const isMed = inc.overall_score >= 40 && inc.overall_score < 75;
                  return (
                    <tr key={inc.submission_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {new Date(inc.submitted_at).toLocaleDateString()} {new Date(inc.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono uppercase font-semibold text-slate-700">
                        {inc.channel}
                      </td>
                      <td className="py-3 px-4 text-slate-800 max-w-[180px] truncate" title={inc.sender}>
                        {inc.sender || 'Anonymous'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {inc.attack_type}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={isHigh ? 'text-red-600' : isMed ? 'text-amber-600' : 'text-emerald-600'}>
                          {inc.overall_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          isHigh 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : isMed 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectSubmission(inc.submission_id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium transition"
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
