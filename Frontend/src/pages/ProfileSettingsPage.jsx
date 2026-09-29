import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import {
  User,
  Briefcase,
  Globe,
  Shield,
  Sliders,
  Sparkles,
  Bot,
  Edit3,
  Check,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Server,
  Zap,
  Layers,
  Cpu,
  Eye,
  EyeOff,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  Send,
  History,
  Tag,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const FALLBACK_PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    default_model: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    requires_key: true,
    description: 'Google DeepMind high-speed multimodal models with rich reasoning.'
  },
  {
    id: 'groq',
    name: 'Groq',
    default_model: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    base_url: 'https://api.groq.com/openai/v1',
    requires_key: true,
    description: 'Ultra-low-latency LPU inference for Meta Llama and Mixtral.'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    default_model: 'anthropic/claude-3.5-sonnet',
    models: [
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-r1',
      'google/gemini-2.0-flash-exp:free'
    ],
    base_url: 'https://openrouter.ai/api/v1',
    requires_key: true,
    description: 'Unified gateway to Claude, DeepSeek, Llama, and Gemini models.'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    default_model: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    base_url: 'https://api.anthropic.com/v1',
    requires_key: true,
    description: 'State-of-the-art security analysis and reasoning from Anthropic.'
  },
  {
    id: 'openai',
    name: 'ChatGPT / OpenAI',
    default_model: 'gpt-4o-mini',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
    base_url: 'https://api.openai.com/v1',
    requires_key: true,
    description: 'OpenAI flagship models with structured JSON outputs.'
  },
  {
    id: 'ollama',
    name: 'Ollama (Local LLM)',
    default_model: 'llama3.2',
    models: ['llama3.2', 'llama3', 'mistral', 'gemma2', 'phi3'],
    base_url: 'http://localhost:11434',
    requires_key: false,
    description: 'Local, completely offline, zero-data-leakage open source LLMs.'
  },
  {
    id: 'huggingface',
    name: 'Hugging Face Inference',
    default_model: 'meta-llama/Llama-3.2-3B-Instruct',
    models: ['meta-llama/Llama-3.2-3B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3'],
    base_url: 'https://api-inference.huggingface.co/models',
    requires_key: true,
    description: 'Direct serverless inference on open weights models.'
  }
];

export default function ProfileSettingsPage({ onNavigate }) {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [completionData, setCompletionData] = useState({
    completion_percentage: 20,
    completed_fields: [],
    missing_fields: [],
    message: ''
  });
  const [completenessDetails, setCompletenessDetails] = useState(null);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState('');

  // Manual inline edit state
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Conversational Profile Assistant modal state (Spec §13, §14)
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // LLM Gateway Settings State
  const [providers, setProviders] = useState(FALLBACK_PROVIDERS);
  const [selectedProviderId, setSelectedProviderId] = useState('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [customModel, setCustomModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savingCred, setSavingCred] = useState(false);
  const [dbCreds, setDbCreds] = useState([]);
  const [credSuccessMsg, setCredSuccessMsg] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [prof, comp, cDetail, hist, pList, cList] = await Promise.all([
        api.profile.get().catch(() => null),
        api.profile.getCompletion().catch(() => null),
        api.profile.getCompleteness().catch(() => null),
        api.profile.getHistory().catch(() => []),
        api.llm.getProviders().catch(() => FALLBACK_PROVIDERS),
        api.llm.getCredentials().catch(() => [])
      ]);

      if (prof) setProfile(prof);
      if (comp) setCompletionData(comp);
      if (cDetail) setCompletenessDetails(cDetail);
      if (hist) setHistoryEntries(hist);
      if (pList && pList.length > 0) setProviders(pList);
      if (cList) {
        setDbCreds(cList);
        const active = cList.find((c) => c.is_active);
        if (active) {
          setSelectedProviderId(active.provider);
          setSelectedModel(active.model_name);
          if (active.base_url) setBaseUrl(active.base_url);
        }
      }
    } catch (e) {
      console.error('Error loading profile data:', e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // --- Manual Field Editing ---
  const startEditing = (field, currentVal) => {
    setEditingField(field);
    if (Array.isArray(currentVal)) {
      setEditValue(currentVal.join(', '));
    } else {
      setEditValue(currentVal !== null && currentVal !== undefined ? currentVal : '');
    }
  };

  const saveField = async (field) => {
    try {
      let val = editValue;
      if (field === 'common_services' || field === 'online_activities' || field === 'common_communication_types') {
        val = editValue
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (field === 'banking_usage' || field === 'online_shopping' || field === 'work_email_usage') {
        val = editValue === true || editValue === 'true';
      }

      const updated = await api.profile.patchField(field, val);
      setProfile(updated);
      const [comp, cDetail, hist] = await Promise.all([
        api.profile.getCompletion().catch(() => null),
        api.profile.getCompleteness().catch(() => null),
        api.profile.getHistory().catch(() => [])
      ]);
      if (comp) setCompletionData(comp);
      if (cDetail) setCompletenessDetails(cDetail);
      if (hist) setHistoryEntries(hist);
      await refreshProfile();
      setEditingField(null);
      showToast(`Updated ${field.replace('_', ' ')} successfully!`);
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // --- Conversational Profile Editing ("Edit Profile with AI" - Spec §13, §14) ---
  const openAiEditModal = (prefill = '') => {
    setShowAiModal(true);
    if (prefill) {
      setAiInput(prefill);
    }
    if (aiChatMessages.length === 0) {
      setAiChatMessages([
        {
          role: 'assistant',
          content: `👋 Hi ${profile?.preferred_name || 'there'}! I'm your Conversational Profile Assistant.\n\nYou can update your profile in plain English:\n• "I changed my role to Software Developer"\n• "Add AWS and GitHub to my services"\n• "Remove Instagram from my platforms"\n• "I don't use online banking"\n• "Set my explanation style to Technical"\n\nWhat would you like to update?`
        }
      ]);
    }
  };

  const handleSendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userText = aiInput.trim();
    setAiInput('');
    setAiChatMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setAiLoading(true);
    setPendingConfirmation(null);

    try {
      const res = await api.profile.assistant(userText);
      const botMsg = {
        role: 'assistant',
        content: res.assistant_message
      };
      setAiChatMessages((prev) => [...prev, botMsg]);

      if (res.requires_confirmation) {
        setPendingConfirmation({
          changes: res.proposed_changes || res.changes,
          prompt: res.confirmation_prompt || res.assistant_message,
          diff: res.preview_diff
        });
      } else {
        // Direct safe update (Spec §13)
        if (res.updated_profile) {
          setProfile(res.updated_profile);
        }
        const [comp, cDetail, hist] = await Promise.all([
          api.profile.getCompletion().catch(() => null),
          api.profile.getCompleteness().catch(() => null),
          api.profile.getHistory().catch(() => [])
        ]);
        if (comp) setCompletionData(comp);
        if (cDetail) setCompletenessDetails(cDetail);
        if (hist) setHistoryEntries(hist);
        await refreshProfile();
        showToast(res.history_entry ? `✓ ${res.history_entry}` : 'Profile updated conversationally!');
      }
    } catch (err) {
      setAiChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I ran into an issue updating your profile: ${err.message}`
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmAiChanges = async (confirmed) => {
    if (!pendingConfirmation) return;
    setAiLoading(true);
    try {
      const res = await api.profile.confirmAssistant(
        'edit_session',
        confirmed,
        pendingConfirmation.changes
      );

      setAiChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.message
        }
      ]);

      if (confirmed && res.profile) {
        setProfile(res.profile);
        const [comp, cDetail, hist] = await Promise.all([
          api.profile.getCompletion().catch(() => null),
          api.profile.getCompleteness().catch(() => null),
          api.profile.getHistory().catch(() => [])
        ]);
        if (comp) setCompletionData(comp);
        if (cDetail) setCompletenessDetails(cDetail);
        if (hist) setHistoryEntries(hist);
        await refreshProfile();
        showToast('✓ Confirmed changes applied to Database & User Profile RAG!');
      }
    } catch (err) {
      alert(`Error confirming changes: ${err.message}`);
    } finally {
      setPendingConfirmation(null);
      setAiLoading(false);
    }
  };

  // --- LLM Gateway Handlers ---
  const handleSelectProvider = (provId) => {
    setSelectedProviderId(provId);
    const prov = providers.find((p) => p.id === provId);
    if (prov) {
      setSelectedModel(prov.default_model);
      setCustomModel('');
      setBaseUrl(prov.base_url || '');
      setTestResult(null);
      setApiKey('');
    }
  };

  const handleTestAI = async () => {
    const activeModel = customModel.trim() || selectedModel;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.llm.testConnection({
        provider: selectedProviderId,
        model_name: activeModel,
        api_key: apiKey.trim(),
        base_url: baseUrl.trim() || null
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message || 'Connection attempt failed.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveCredential = async () => {
    const activeModel = customModel.trim() || selectedModel;
    setSavingCred(true);
    setCredSuccessMsg('');
    try {
      await api.llm.saveCredential({
        provider: selectedProviderId,
        model_name: activeModel,
        api_key: apiKey.trim(),
        base_url: baseUrl.trim() || null,
        is_active: true
      });
      const provName = providers.find((p) => p.id === selectedProviderId)?.name || selectedProviderId;
      setCredSuccessMsg(`Saved and activated ${provName} (${activeModel}) in database!`);
      setApiKey('');
      const cList = await api.llm.getCredentials();
      if (cList) setDbCreds(cList);
      setTimeout(() => setCredSuccessMsg(''), 4000);
    } catch (err) {
      alert(`Failed to save credential: ${err.message}`);
    } finally {
      setSavingCred(false);
    }
  };

  const handleActivateCred = async (credId) => {
    try {
      await api.llm.activateCredential(credId);
      const cList = await api.llm.getCredentials();
      if (cList) setDbCreds(cList);
      showToast('Activated primary LLM credential!');
    } catch (err) {
      alert(`Activation failed: ${err.message}`);
    }
  };

  const handleDeleteCred = async (credId) => {
    if (!confirm('Remove this saved credential from the database?')) return;
    try {
      await api.llm.deleteCredential(credId);
      const cList = await api.llm.getCredentials();
      if (cList) setDbCreds(cList);
      showToast('Credential removed.');
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const activeCredObj = dbCreds.find((c) => c.is_active);
  const currentProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  // Helper for rendering empty/missing field values (Spec §16)
  const renderValueOrFallback = (val, placeholder = 'Not provided') => {
    if (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
      return <span className="text-slate-400 italic text-xs">{placeholder}</span>;
    }
    return val;
  };

  // Dynamic threat exposure categories based on role (Spec §16, §17)
  const getRoleThreatThemes = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('student')) {
      return ['Internship & Recruitment Scams', 'College Tuition / Financial Aid Phishing', 'Academic Portal Credential Harvesters', 'Emergency Wire Transfer Traps'];
    }
    if (r.includes('developer') || r.includes('engineer')) {
      return ['GitHub / GitLab Access Token Thefts', 'Cloud Infrastructure (AWS/GCP) Phishing', 'Malicious Open-Source Package Lures', 'API Key Exposure Traps'];
    }
    if (r.includes('employee') || r.includes('business') || r.includes('manager')) {
      return ['Business Email Compromise (BEC)', 'Fake Vendor Wire Invoices', 'Payroll / HR Direct Deposit Scams', 'Executive Display Name Spoofing'];
    }
    return ['Credential Harvesting Lookalikes', 'Fake Delivery / Parcel SMS', 'Urgent Account Suspension Alerts', 'Payment Gateway Impersonation'];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Consistent Header & Breadcrumbs */}
      <PageHeader
        screenId="profile"
        eyebrow="SECURITY CALIBRATION"
        title="Profile & Settings"
        description="Dynamic conversational security profile, User Profile RAG memory, and LLM provider credentials."
        onNavigate={onNavigate}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openAiEditModal()}
            className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Edit Profile with AI</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('onboarding')}
            className="px-3.5 py-2 rounded-md border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Retake Profiling Wizard</span>
          </button>
        </div>
      </PageHeader>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 font-medium shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MEANINGFUL PROFILE COMPLETENESS BY DIMENSION (Spec §15) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold font-mono text-lg border border-blue-100">
              {completenessDetails?.completion_percentage || completionData.completion_percentage}%
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Security Profile Completeness</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                  Dimension-Calibrated
                </span>
              </h3>
              <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                Calculated from core threat-personalization dimensions rather than generic form fields.
              </p>
            </div>
          </div>

          {/* Action button if profile incomplete */}
          {completenessDetails?.missing_dimensions?.length > 0 && (
            <button
              onClick={() => openAiEditModal(`Configure my missing profile dimensions: ${completenessDetails.missing_dimensions.join(', ')}`)}
              className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold border border-blue-200 flex items-center gap-2 transition self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Complete Profile with AI</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${completenessDetails?.completion_percentage || completionData.completion_percentage}%` }}
          />
        </div>

        {/* Dimension Chips Breakdown (Spec §15) */}
        {completenessDetails?.dimensions && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-mono text-slate-600 uppercase tracking-wider block mb-2.5 font-bold">
              Security Dimensions Status
            </span>
            <div className="flex flex-wrap gap-2">
              {completenessDetails.dimensions.map((dim) => {
                const isDone = dim.status === 'completed';
                return (
                  <div
                    key={dim.dimension}
                    className={`text-sm px-3 py-1.5 rounded-lg border flex items-center gap-2 transition ${
                      isDone
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                    title={dim.description}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                    )}
                    <span className="font-semibold">{dim.dimension}</span>
                    {!isDone && (
                      <span className="text-xs text-amber-700 font-mono font-bold">(Missing)</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missing Dimension Recommendation */}
        {completenessDetails?.recommendation && (
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{completenessDetails.recommendation}</span>
            </div>
            <button
              onClick={() => openAiEditModal(`Configure my ${completenessDetails.missing_dimensions[0]}`)}
              className="text-xs font-bold text-amber-900 underline hover:no-underline whitespace-nowrap"
            >
              Add with AI →
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC PROFILE SECTIONS (Spec §16 & §17 - Data-Driven, No Fake Values) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Personal & Professional Identity */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Personal & Professional Identity</span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">Spec §16</span>
          </div>

          <div className="space-y-3.5">
            {/* Preferred Name */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Preferred Name</span>
                {editingField === 'preferred_name' ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <button onClick={() => saveField('preferred_name')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-900">
                    {renderValueOrFallback(profile?.preferred_name, 'Not provided')}
                  </span>
                )}
              </div>
              {editingField !== 'preferred_name' && (
                <button
                  onClick={() => startEditing('preferred_name', profile?.preferred_name)}
                  className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Role */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Primary Role</span>
                {editingField === 'role' ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      {['Student', 'Software Developer', 'Developer', 'Employee', 'Business Owner', 'IT Professional', 'Teacher', 'Security Analyst'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button onClick={() => saveField('role')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {renderValueOrFallback(profile?.role, 'Not provided')}
                  </span>
                )}
              </div>
              {editingField !== 'role' && (
                <button
                  onClick={() => startEditing('role', profile?.role)}
                  className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Industry Domain */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Industry Domain</span>
                {editingField === 'industry' ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="e.g. Higher Education, Cybersecurity, Finance"
                      className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <button onClick={() => saveField('industry')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-slate-900">
                    {renderValueOrFallback(profile?.industry, 'Not configured')}
                  </span>
                )}
              </div>
              {editingField !== 'industry' && (
                <button
                  onClick={() => startEditing('industry', profile?.industry)}
                  className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Organization Type */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Organization Type</span>
                {editingField === 'organization_type' ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="e.g. University, Tech Startup, Enterprise"
                      className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <button onClick={() => saveField('organization_type')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-slate-900">
                    {renderValueOrFallback(profile?.organization_type, 'Not configured')}
                  </span>
                )}
              </div>
              {editingField !== 'organization_type' && (
                <button
                  onClick={() => startEditing('organization_type', profile?.organization_type)}
                  className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Digital Behavior & Account Ecosystems */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Globe className="w-4 h-4 text-cyan-600" />
              <span>Digital Behavior & Account Ecosystems</span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">Spec §16</span>
          </div>

          <div className="space-y-3.5">
            {/* Common Services */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Monitored Services & Platforms</span>
                {editingField !== 'common_services' && (
                  <button
                    onClick={() => startEditing('common_services', profile?.common_services)}
                    className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {editingField === 'common_services' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Separate with commas, e.g. Google, GitHub, AWS, Microsoft"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveField('common_services')} className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md">
                      Save
                    </button>
                    <button onClick={() => setEditingField(null)} className="px-3.5 py-1.5 bg-slate-200 text-slate-700 text-xs rounded-md">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.common_services && profile.common_services.length > 0 ? (
                    profile.common_services.map((s, i) => (
                      <span key={i} className="text-xs font-semibold bg-cyan-50 text-cyan-900 px-3 py-1 rounded-full border border-cyan-200">
                        {s}
                      </span>
                    ))
                  ) : (
                    renderValueOrFallback(null, 'Not configured')
                  )}
                </div>
              )}
            </div>

            {/* Online Activities */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Primary Digital Activities</span>
                {editingField !== 'online_activities' && (
                  <button
                    onClick={() => startEditing('online_activities', profile?.online_activities)}
                    className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {editingField === 'online_activities' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Separate with commas, e.g. Education, Online Banking, Social Media"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveField('online_activities')} className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md">
                      Save
                    </button>
                    <button onClick={() => setEditingField(null)} className="px-3.5 py-1.5 bg-slate-200 text-slate-700 text-xs rounded-md">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.online_activities && profile.online_activities.length > 0 ? (
                    profile.online_activities.map((a, i) => (
                      <span key={i} className="text-xs font-semibold bg-blue-50 text-blue-900 px-3 py-1 rounded-full border border-blue-200">
                        {a}
                      </span>
                    ))
                  ) : (
                    renderValueOrFallback(null, 'Not configured')
                  )}
                </div>
              )}
            </div>

            {/* Common Communications */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Common Communication Channels</span>
                {editingField !== 'common_communication_types' && (
                  <button
                    onClick={() => startEditing('common_communication_types', profile?.common_communication_types)}
                    className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {editingField === 'common_communication_types' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Separate with commas, e.g. University Email, LinkedIn Messages"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveField('common_communication_types')} className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md">
                      Save
                    </button>
                    <button onClick={() => setEditingField(null)} className="px-3.5 py-1.5 bg-slate-200 text-slate-700 text-xs rounded-md">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.common_communication_types && profile.common_communication_types.length > 0 ? (
                    profile.common_communication_types.map((c, i) => (
                      <span key={i} className="text-xs font-semibold bg-slate-100 text-slate-900 px-3 py-1 rounded-full border border-slate-200">
                        {c}
                      </span>
                    ))
                  ) : (
                    renderValueOrFallback(null, 'Not configured')
                  )}
                </div>
              )}
            </div>

            {/* Activity Toggles: Banking, Shopping, Work Email */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {[
                { field: 'banking_usage', label: 'Online Banking', value: profile?.banking_usage },
                { field: 'online_shopping', label: 'Online Shopping', value: profile?.online_shopping },
                { field: 'work_email_usage', label: 'Work Email', value: profile?.work_email_usage }
              ].map((item) => (
                <button
                  key={item.field}
                  type="button"
                  onClick={async () => {
                    const newVal = !item.value;
                    const upd = await api.profile.patchField(item.field, newVal);
                    setProfile(upd);
                    const [cDetail, hist] = await Promise.all([
                      api.profile.getCompleteness().catch(() => null),
                      api.profile.getHistory().catch(() => [])
                    ]);
                    if (cDetail) setCompletenessDetails(cDetail);
                    if (hist) setHistoryEntries(hist);
                    showToast(`Toggled ${item.label} to ${newVal ? 'Active' : 'Inactive'}`);
                  }}
                  className={`p-3 rounded-xl border text-center transition ${
                    item.value
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="text-xs font-mono uppercase font-bold">{item.label}</div>
                  <div className="text-xs font-bold mt-1">{item.value ? '✓ Active' : '✕ Inactive'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Security Calibrations & Explanations */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Security Calibrations & Explanations</span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">Spec §16</span>
          </div>

          <div className="space-y-3.5">
            {/* Security Awareness Tier */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Security Awareness Tier</span>
                {editingField === 'security_awareness' ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      {['Beginner', 'Intermediate', 'Advanced', 'Security Professional'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button onClick={() => saveField('security_awareness')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    {renderValueOrFallback(profile?.security_awareness, 'Beginner')}
                  </span>
                )}
              </div>
              {editingField !== 'security_awareness' && (
                <button
                  onClick={() => startEditing('security_awareness', profile?.security_awareness)}
                  className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Technical Experience */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Technical Experience</span>
                {editingField === 'technical_experience' ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button onClick={() => saveField('technical_experience')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-900">
                    {renderValueOrFallback(profile?.technical_experience, 'Intermediate')}
                  </span>
                )}
              </div>
              {editingField !== 'technical_experience' && (
                <button
                  onClick={() => startEditing('technical_experience', profile?.technical_experience)}
                  className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Threat Explanation Style */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Threat Explanation Complexity</span>
                {editingField === 'preferred_explanation_style' ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      <option value="Simple">Simple (Concise, Plain-English, Actionable)</option>
                      <option value="Detailed">Detailed (Step-by-step breakdown & evidence)</option>
                      <option value="Technical">Technical (Forensic IoCs, headers, SHAP deltas)</option>
                    </select>
                    <button onClick={() => saveField('preferred_explanation_style')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-900">
                    {profile?.preferred_explanation_style === 'Technical'
                      ? 'Technical (Forensic IoCs & Deltas)'
                      : (profile?.preferred_explanation_style === 'Detailed'
                        ? 'Detailed (Full Breakdown)'
                        : 'Simple (Plain English & Actionable)')}
                  </span>
                )}
              </div>
              {editingField !== 'preferred_explanation_style' && (
                <button
                  onClick={() => startEditing('preferred_explanation_style', profile?.preferred_explanation_style)}
                  className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Threat Exposure & Context (Spec §16 & §17) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Threat Exposure & Contextual Memory</span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">User Profile RAG</span>
          </div>

          <div className="space-y-3.5">
            {/* Calibrated Attack Exposure Themes */}
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-950 font-bold block">
                Targeted Attack Vectors Calibrated for {profile?.role || 'Your Role'}
              </span>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {getRoleThreatThemes(profile?.role).map((theme, i) => (
                  <span key={i} className="text-xs font-semibold bg-white text-amber-950 px-2.5 py-1 rounded-md border border-amber-200/80 shadow-2xs">
                    • {theme}
                  </span>
                ))}
              </div>
            </div>

            {/* Custom Notes / Extensible Context */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600 uppercase font-bold block">Custom Security Context Notes</span>
                <button
                  onClick={() => openAiEditModal('Add contextual security note: ')}
                  className="px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-50 rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Add with AI</span>
                </button>
              </div>

              {profile?.custom_information && Object.keys(profile.custom_information).length > 0 ? (
                <div className="space-y-2 pt-1">
                  {Object.entries(profile.custom_information).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-mono text-xs text-purple-900 uppercase block font-bold">
                          {k.replace('_', ' ')}
                        </span>
                        <span className="text-slate-900 font-medium">{String(v)}</span>
                      </div>
                      <button
                        onClick={async () => {
                          const updated = { ...profile.custom_information };
                          delete updated[k];
                          const res = await api.profile.patchField('custom_information', updated);
                          setProfile(res);
                          showToast(`Removed custom tag ${k}`);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-1">
                  Not configured. (e.g. "I frequently receive internship messages on LinkedIn.")
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PROFILE CHANGE HISTORY TIMELINE (Spec §18 & §26) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <History className="w-4 h-4 text-blue-600" />
            <span>Profile Change History</span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {historyEntries.length} recorded event(s)
          </span>
        </div>

        {historyEntries.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-600 font-mono space-y-1">
            <p>No profile changes recorded yet.</p>
            <p className="text-xs text-slate-500">
              Meaningful changes made through conversational AI or profile edits will be tracked here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyEntries.slice(0, 10).map((h) => {
              const dt = new Date(h.created_at);
              const formattedDate = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              const formattedTime = dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={h.history_id}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">
                        {h.description}
                      </div>
                      <div className="text-xs text-slate-600 font-mono mt-0.5 flex items-center gap-2">
                        <span>{formattedDate} at {formattedTime}</span>
                        <span>•</span>
                        <span className="capitalize text-blue-700 font-bold">{h.source.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0 font-bold">
                    {h.change_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. CONVERSATIONAL PROFILE ASSISTANT MODAL (Spec §13, §14) */}
      {/* ========================================================================= */}
      {showAiModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-profile-modal-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden max-h-[85vh] animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 bg-navy-900 text-white flex items-center justify-between border-b border-navy-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 id="ai-profile-modal-title" className="font-bold text-sm text-white">
                    Conversational Profile Assistant
                  </h3>
                  <p className="text-xs text-slate-400">Update security parameters using natural language</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-navy-800 transition"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Feed */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/50 min-h-[300px]">
              {aiChatMessages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-2xs'
                      }`}
                    >
                      <div className="whitespace-pre-line">{m.content}</div>
                    </div>
                  </div>
                );
              })}

              {aiLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span>Processing natural language update...</span>
                </div>
              )}
            </div>

            {/* Structured Proposed Changes Preview Card (Spec §13, §14) */}
            {pendingConfirmation && (
              <div className="p-4 bg-blue-50/80 border-t border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Proposed Changes Confirmation</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs text-slate-800 font-mono space-y-1">
                  <div className="whitespace-pre-line">{pendingConfirmation.prompt}</div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleConfirmAiChanges(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmAiChanges(true)}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Suggestion Pills */}
            <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200 flex flex-wrap gap-1.5">
              {[
                'Change role to Software Developer',
                'Add AWS and GitHub to services',
                'Remove Instagram from services',
                "I don't use online banking",
                'Set explanation style to Technical'
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setAiInput(sug)}
                  className="text-[11px] bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded-md border border-slate-200 transition"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3.5 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="e.g. I changed my role to Software Developer, add AWS..."
                  className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || aiLoading}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MULTI-PROVIDER LLM & AI ENGINE STUDIO */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#0B1220] text-slate-100 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Multi-Provider Generative AI Gateway
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              LLM Engine & Database Credentials
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Power dynamic conversational profiling and context-grounded triage explanations using your preferred model.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#14233D] border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Active Primary:{' '}
              <strong className="text-white">
                {activeCredObj ? `${activeCredObj.provider.toUpperCase()} (${activeCredObj.model_name})` : 'Offline Ensemble'}
              </strong>
            </span>
          </div>
        </div>

        {/* Provider Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
            Select AI Provider
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {providers.map((p) => {
              const isSelected = selectedProviderId === p.id;
              const hasKeyInDb = dbCreds.some((c) => c.provider === p.id);
              const isActive = dbCreds.some((c) => c.provider === p.id && c.is_active);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProvider(p.id)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                      : 'bg-[#121B2F] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" title="Active Model" />
                  )}
                  <Cpu className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold font-mono tracking-tight leading-snug">
                    {p.name.split(' ')[0]}
                  </span>
                  <span className="text-xs text-slate-400 font-mono mt-0.5">
                    {p.id === 'ollama' ? 'Local' : (hasKeyInDb ? 'Configured' : 'Available')}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-1">{currentProvider.description}</p>
        </div>

        {/* Model Selection & Custom Model Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
              Preset Recommended Models
            </label>
            <div className="flex flex-wrap gap-2">
              {currentProvider.models?.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSelectedModel(m);
                    setCustomModel('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${
                    selectedModel === m && !customModel
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                      : 'bg-[#14233D] text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
              Or Custom Model Identifier
            </label>
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder={`e.g. ${currentProvider.default_model} or custom tag`}
              className="w-full px-3.5 py-2.5 text-sm bg-[#14233D] border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Credentials & Endpoint Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>{currentProvider.name} API Key</span>
              </label>
              {!currentProvider.requires_key && (
                <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-800/40">
                  Optional (Local Engine)
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  currentProvider.requires_key
                    ? `Paste ${currentProvider.name} API key here...`
                    : 'Not required for local Ollama'
                }
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#14233D] border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Base Endpoint URL (Optional)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={currentProvider.base_url || 'https://api.openai.com/v1'}
              className="w-full px-3.5 py-2.5 text-sm bg-[#14233D] border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Action Buttons: Test AI Connection & Save to Database */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestAI}
            disabled={testing}
            className="px-4 py-2.5 rounded-lg bg-navy-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
          >
            {testing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Testing Provider...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-blue-400" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveCredential}
            disabled={savingCred}
            className="px-5 py-2.5 rounded-lg bg-[#182744] hover:bg-[#20345b] text-cyan-300 border border-cyan-500/40 text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-cyan-400" />
            <span>{savingCred ? 'Saving to DB...' : 'Save Credential in DB'}</span>
          </button>

          {credSuccessMsg && (
            <span className="text-sm font-medium text-emerald-400 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              {credSuccessMsg}
            </span>
          )}
        </div>

        {/* Live Test AI Diagnostic Feedback Panel */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-sm transition-all ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className="font-bold text-sm">
                  {testResult.success
                    ? `Connection Verified: ${testResult.provider.toUpperCase()} (${testResult.model})`
                    : 'Connection Failed'}
                </span>
              </div>
              {testResult.latency_ms !== null && testResult.latency_ms !== undefined && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Latency: <strong>{testResult.latency_ms}ms</strong></span>
                </div>
              )}
            </div>

            {testResult.response && (
              <div className="mt-2 p-3 bg-black/30 rounded-lg border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-mono">
                <span className="text-slate-400 font-semibold block mb-1">Model Response Probe:</span>
                "{testResult.response}"
              </div>
            )}

            {testResult.error && (
              <div className="mt-2 p-3 bg-rose-950/50 rounded-lg border border-rose-800/50 text-xs text-rose-200 leading-relaxed font-mono">
                <span className="text-rose-400 font-bold block mb-1">Error Diagnostics:</span>
                {testResult.error}
              </div>
            )}
          </div>
        )}

        {/* Database Stored Credentials Inventory */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Saved Database Credentials ({dbCreds.length})</span>
            </h4>
            <span className="text-xs text-slate-400">
              Auto-persisted to SQLite <code className="text-cyan-400 font-mono">phishguard.db</code>
            </span>
          </div>

          {dbCreds.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#121B2F] border border-slate-800 text-center text-sm text-slate-400">
              No API keys stored in database yet. Currently running on built-in offline ML pipeline & context generator.
            </div>
          ) : (
            <div className="space-y-2">
              {dbCreds.map((c) => (
                <div
                  key={c.credential_id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition ${
                    c.is_active
                      ? 'bg-cyan-950/30 border-cyan-500/50 text-white'
                      : 'bg-[#121B2F] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${c.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                        <span>{c.provider.toUpperCase()}</span>
                        <span className="text-xs text-cyan-400 font-medium">({c.model_name})</span>
                        {c.is_active && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            ACTIVE PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1">
                        Key: {c.masked_key} {c.base_url ? `• Endpoint: ${c.base_url}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!c.is_active && (
                      <button
                        type="button"
                        onClick={() => handleActivateCred(c.credential_id)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-xs font-semibold transition"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteCred(c.credential_id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                      title="Delete credential"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
