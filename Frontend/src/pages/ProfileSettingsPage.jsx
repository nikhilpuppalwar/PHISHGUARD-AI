import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  RefreshCw
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
  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState('');

  // Manual inline edit state
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Conversational Profile Editing modal state
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
      const [prof, comp, pList, cList] = await Promise.all([
        api.profile.get().catch(() => null),
        api.profile.getCompletion().catch(() => null),
        api.llm.getProviders().catch(() => FALLBACK_PROVIDERS),
        api.llm.getCredentials().catch(() => [])
      ]);

      if (prof) setProfile(prof);
      if (comp) setCompletionData(comp);
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
      if (field === 'common_services' || field === 'online_activities') {
        val = editValue
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (field === 'banking_usage' || field === 'online_shopping' || field === 'work_email_usage') {
        val = editValue === true || editValue === 'true';
      }

      const updated = await api.profile.patchField(field, val);
      setProfile(updated);
      const comp = await api.profile.getCompletion();
      setCompletionData(comp);
      await refreshProfile();
      setEditingField(null);
      showToast(`Updated ${field.replace('_', ' ')} successfully!`);
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // --- Conversational Profile Editing ("Edit Profile with AI") ---
  const openAiEditModal = () => {
    setShowAiModal(true);
    if (aiChatMessages.length === 0) {
      setAiChatMessages([
        {
          role: 'assistant',
          content: `👋 Hi ${profile?.preferred_name || 'there'}! I'm your Conversational Profile Assistant.\n\nYou can tell me things like:\n• "I changed my role to Software Developer"\n• "Add AWS and GitHub to my services"\n• "Remove Instagram from my platforms"\n• "I don't use online banking"\n\nWhat would you like to update?`
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
      const res = await api.profile.conversationalEdit(userText);
      const botMsg = {
        role: 'assistant',
        content: res.assistant_message
      };
      setAiChatMessages((prev) => [...prev, botMsg]);

      if (res.requires_confirmation) {
        setPendingConfirmation({
          changes: res.changes,
          prompt: res.confirmation_prompt
        });
      } else {
        // Updated immediately!
        if (res.updated_profile) {
          setProfile(res.updated_profile);
        }
        const comp = await api.profile.getCompletion();
        setCompletionData(comp);
        await refreshProfile();
        showToast('Profile updated conversationally!');
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
      const res = await api.profile.confirmChanges(
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
        const comp = await api.profile.getCompletion();
        setCompletionData(comp);
        await refreshProfile();
        showToast('Confirmed changes applied!');
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Personalized Defense Profile
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            User Profile & AI Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your digital footprint, security awareness tier, and connect LLM providers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Conversational Profile Editing Trigger */}
          <button
            type="button"
            onClick={openAiEditModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>Edit Profile with AI</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('onboarding')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Retake Wizard</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 font-medium shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROFILE COMPLETION BANNER (Section 15) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold font-mono text-sm border border-blue-100">
              {completionData.completion_percentage}%
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Security Profile Completeness
              </h3>
              <p className="text-xs text-slate-500">
                {completionData.message || `Your security profile is ${completionData.completion_percentage}% complete.`}
              </p>
            </div>
          </div>

          {completionData.missing_fields?.length > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Recommended to complete: <strong>{completionData.missing_fields.slice(0, 2).join(', ')}</strong></span>
            </div>
          )}
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 h-full transition-all duration-500"
            style={{ width: `${completionData.completion_percentage}%` }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 STRUCTURED PROFILE SECTIONS (Section 8 & 9) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Personal / Professional */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>Personal & Professional Identity</span>
          </div>

          <div className="space-y-3">
            {/* Preferred Name */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Preferred Name</span>
                {editingField === 'preferred_name' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <button onClick={() => saveField('preferred_name')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-900">{profile?.preferred_name || 'User'}</span>
                )}
              </div>
              {editingField !== 'preferred_name' && (
                <button
                  onClick={() => startEditing('preferred_name', profile?.preferred_name)}
                  className="px-2.5 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Role */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Primary Role</span>
                {editingField === 'role' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      {['Student', 'Employee', 'Business Owner', 'IT Professional', 'Developer', 'Teacher', 'General User'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button onClick={() => saveField('role')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {profile?.role || 'Unspecified'}
                  </span>
                )}
              </div>
              {editingField !== 'role' && (
                <button
                  onClick={() => startEditing('role', profile?.role)}
                  className="px-2.5 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Industry */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Industry Domain</span>
                {editingField === 'industry' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="e.g. Higher Education, Tech, Finance"
                      className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <button onClick={() => saveField('industry')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-700">
                    {profile?.industry || 'Not specified'}
                  </span>
                )}
              </div>
              {editingField !== 'industry' && (
                <button
                  onClick={() => startEditing('industry', profile?.industry)}
                  className="px-2.5 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Organization Type */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Organization Type</span>
                {editingField === 'organization_type' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="e.g. University, Enterprise, Start-up"
                      className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <button onClick={() => saveField('organization_type')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-700">
                    {profile?.organization_type || 'University / Academic Campus'}
                  </span>
                )}
              </div>
              {editingField !== 'organization_type' && (
                <button
                  onClick={() => startEditing('organization_type', profile?.organization_type)}
                  className="px-2.5 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Digital Behavior */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Globe className="w-4 h-4 text-cyan-600" />
            <span>Digital Behavior & Account Ecosystems</span>
          </div>

          <div className="space-y-3">
            {/* Common Services */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Common Services & Accounts</span>
                {editingField !== 'common_services' && (
                  <button
                    onClick={() => startEditing('common_services', profile?.common_services)}
                    className="px-2.5 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1 transition"
                  >
                    <Edit3 className="w-3 h-3" />
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
                    placeholder="Separate with commas, e.g. Google, GitHub, Microsoft, AWS"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveField('common_services')} className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md">
                      Save
                    </button>
                    <button onClick={() => setEditingField(null)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-md">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.common_services?.length > 0 ? profile.common_services : ['Google', 'University Email']).map((s, i) => (
                    <span key={i} className="text-[11px] font-medium bg-cyan-50 text-cyan-800 px-2.5 py-0.5 rounded-full border border-cyan-200">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Online Activities */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Primary Digital Activities</span>
                {editingField !== 'online_activities' && (
                  <button
                    onClick={() => startEditing('online_activities', profile?.online_activities)}
                    className="px-2.5 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1 transition"
                  >
                    <Edit3 className="w-3 h-3" />
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
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveField('online_activities')} className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md">
                      Save
                    </button>
                    <button onClick={() => setEditingField(null)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-md">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.online_activities?.length > 0 ? profile.online_activities : ['Education', 'Online Banking']).map((a, i) => (
                    <span key={i} className="text-[11px] font-medium bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Toggles: Banking, Shopping, Work Email */}
            <div className="grid grid-cols-3 gap-2 pt-1">
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
                    showToast(`Toggled ${item.label} to ${newVal ? 'Yes' : 'No'}`);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    item.value
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase">{item.label}</div>
                  <div className="text-xs font-bold mt-0.5">{item.value ? '✓ Active' : '✕ Inactive'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Security Profile */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Security Calibrations & Explanations</span>
          </div>

          <div className="space-y-3">
            {/* Security Awareness */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Security Awareness Tier</span>
                {editingField === 'security_awareness' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    >
                      {['Beginner', 'Intermediate', 'Advanced', 'Security Professional'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button onClick={() => saveField('security_awareness')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {profile?.security_awareness || 'Beginner'}
                  </span>
                )}
              </div>
              {editingField !== 'security_awareness' && (
                <button
                  onClick={() => startEditing('security_awareness', profile?.security_awareness)}
                  className="px-2.5 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Technical Experience */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Technical Experience</span>
                {editingField === 'technical_experience' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    >
                      {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button onClick={() => saveField('technical_experience')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-800">
                    {profile?.technical_experience || 'Intermediate'}
                  </span>
                )}
              </div>
              {editingField !== 'technical_experience' && (
                <button
                  onClick={() => startEditing('technical_experience', profile?.technical_experience)}
                  className="px-2.5 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Explanation Style */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Threat Explanation Complexity</span>
                {editingField === 'preferred_explanation_style' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="Simple">Simple & Action-Oriented</option>
                      <option value="Detailed">Detailed & Technical (SHAP Deltas)</option>
                    </select>
                    <button onClick={() => saveField('preferred_explanation_style')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-800">
                    {profile?.preferred_explanation_style === 'Detailed' ? 'Detailed & Technical' : 'Simple & Action-Oriented'}
                  </span>
                )}
              </div>
              {editingField !== 'preferred_explanation_style' && (
                <button
                  onClick={() => startEditing('preferred_explanation_style', profile?.preferred_explanation_style)}
                  className="px-2.5 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Custom Information */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Custom Information & Context</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Extensible Schema</span>
          </div>

          <div className="space-y-2 text-xs">
            {profile?.custom_information && Object.keys(profile.custom_information).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(profile.custom_information).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-purple-700 uppercase block">{k.replace('_', ' ')}</span>
                      <span className="font-semibold text-slate-900">{String(v)}</span>
                    </div>
                    <button
                      onClick={async () => {
                        const updated = { ...profile.custom_information };
                        delete updated[k];
                        const res = await api.profile.patchField('custom_information', updated);
                        setProfile(res);
                        showToast(`Removed ${k}`);
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-center font-mono text-xs">
                No custom tags yet. The AI automatically populates this when you select "Other" or provide custom context.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONVERSATIONAL PROFILE EDITING MODAL ("Edit Profile with AI") */}
      {/* ========================================================================= */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-scale-in max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Conversational Profile Assistant</h3>
                  <p className="text-xs text-blue-100">Talk naturally to update your security attributes</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Feed */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/50 min-h-[280px]">
              {aiChatMessages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] ${
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

            {/* Confirmation Box if Required (Section 12) */}
            {pendingConfirmation && (
              <div className="p-3.5 bg-amber-50 border-t border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{pendingConfirmation.prompt || 'Confirm applying these profile modifications?'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmAiChanges(true)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleConfirmAiChanges(false)}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Modal Input */}
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
                  className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
      {/* 5. MULTI-PROVIDER LLM & AI ENGINE STUDIO (From Previous Step) */}
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
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#14233D] border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
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
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
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
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">
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
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
              Or Custom Model Identifier
            </label>
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder={`e.g. ${currentProvider.default_model} or custom tag`}
              className="w-full px-3.5 py-2 text-xs bg-[#14233D] border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Credentials & Endpoint Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentProvider.name} API Key</span>
              </label>
              {!currentProvider.requires_key && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
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
                className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-[#14233D] border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Base Endpoint URL (Optional)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={currentProvider.base_url || 'https://api.openai.com/v1'}
              className="w-full px-3.5 py-2.5 text-xs bg-[#14233D] border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Action Buttons: Test AI Connection & Save to Database */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestAI}
            disabled={testing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition disabled:opacity-50"
          >
            {testing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Pinging Provider...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-cyan-300" />
                <span>Test AI Connection</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveCredential}
            disabled={savingCred}
            className="px-5 py-2.5 rounded-xl bg-[#182744] hover:bg-[#20345b] text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-cyan-400" />
            <span>{savingCred ? 'Saving to DB...' : 'Save Credential in DB'}</span>
          </button>

          {credSuccessMsg && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              {credSuccessMsg}
            </span>
          )}
        </div>

        {/* Live Test AI Diagnostic Feedback Panel */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono transition-all ${
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
                <span className="font-bold">
                  {testResult.success
                    ? `Connection Verified: ${testResult.provider.toUpperCase()} (${testResult.model})`
                    : 'Connection Failed'}
                </span>
              </div>
              {testResult.latency_ms !== null && testResult.latency_ms !== undefined && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 border border-emerald-500/30 text-[11px] text-emerald-300">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>Latency: <strong>{testResult.latency_ms}ms</strong></span>
                </div>
              )}
            </div>

            {testResult.response && (
              <div className="mt-2 p-3 bg-black/30 rounded-lg border border-slate-800/80 text-[11px] text-slate-300">
                <span className="text-slate-500 block mb-1">Model Response Probe:</span>
                "{testResult.response}"
              </div>
            )}

            {testResult.error && (
              <div className="mt-2 p-3 bg-rose-950/50 rounded-lg border border-rose-800/50 text-[11px] text-rose-300">
                <span className="text-rose-400 font-bold block mb-1">Error Diagnostics:</span>
                {testResult.error}
              </div>
            )}
          </div>
        )}

        {/* Database Stored Credentials Inventory */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Saved Database Credentials ({dbCreds.length})</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              Auto-persisted to SQLite <code className="text-cyan-400">phishguard.db</code>
            </span>
          </div>

          {dbCreds.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#121B2F] border border-slate-800 text-center text-xs text-slate-500 font-mono">
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
                    <span className={`w-2 h-2 rounded-full ${c.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <div>
                      <div className="text-xs font-bold font-mono text-white flex items-center gap-2">
                        <span>{c.provider.toUpperCase()}</span>
                        <span className="text-[11px] text-cyan-400 font-normal">({c.model_name})</span>
                        {c.is_active && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            ACTIVE PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Key: {c.masked_key} {c.base_url ? `• Endpoint: ${c.base_url}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!c.is_active && (
                      <button
                        type="button"
                        onClick={() => handleActivateCred(c.credential_id)}
                        className="px-3 py-1 rounded-lg bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-[11px] font-mono transition"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteCred(c.credential_id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
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
