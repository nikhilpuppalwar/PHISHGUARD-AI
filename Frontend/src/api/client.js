const API_BASE = 'http://127.0.0.1:8000/api';

export function getAuthToken() {
  return localStorage.getItem('phishguard_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('phishguard_token', token);
  } else {
    localStorage.removeItem('phishguard_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.message || 'An error occurred during network request.';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email, password, role = 'Student') =>
      request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, role }) }),
    me: () => request('/auth/me'),
    requestPasswordReset: (email) =>
      request('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
    confirmPasswordReset: (email, reset_code, new_password) =>
      request('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ email, reset_code, new_password }) }),
  },
  profile: {
    get: () => request('/profile'),
    update: (profileData) =>
      request('/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
    patchField: (field, value) =>
      request(`/profile/${field}`, { method: 'PATCH', body: JSON.stringify({ field, value }) }),
    getCompletion: () => request('/profile/completion'),
    startOnboarding: () => request('/profile/onboarding/start', { method: 'POST' }),
    answerOnboarding: (data) => request('/profile/onboarding/answer', { method: 'POST', body: JSON.stringify(data) }),
    conversationalEdit: (message, conversation_id = null) =>
      request('/profile/conversation', { method: 'POST', body: JSON.stringify({ message, conversation_id }) }),
    confirmChanges: (conversation_id, confirmed = true, changes = null) =>
      request('/profile/conversation/confirm', { method: 'POST', body: JSON.stringify({ conversation_id, confirmed, changes }) }),
    conversationalTurn: (message, history) =>
      request('/profile/conversational-turn', { method: 'POST', body: JSON.stringify({ message, history }) }),
  },

  analyze: {
    previewExtract: (raw_input) =>
      request('/analyze/preview-extract', { method: 'POST', body: JSON.stringify({ raw_input }) }),
    runAnalysis: (raw_input, overrides = {}) =>
      request('/analyze', { method: 'POST', body: JSON.stringify({ raw_input, ...overrides }) }),
    getById: (id) => request(`/analysis/${id}`),
  },
  incidents: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/incidents${query ? `?${query}` : ''}`);
    },
  },
  feedback: {
    submit: (submission_id, verdict, additional_context = '') =>
      request('/feedback', { method: 'POST', body: JSON.stringify({ submission_id, verdict, additional_context }) }),
  },
  analytics: {
    get: () => request('/analytics'),
    getAiSummary: () => request('/analytics/ai-summary'),
  },
  meta: {
    getAttackTypes: () => request('/attack-types'),
    getDatasets: () => request('/datasets'),
    getModels: () => request('/models'),
    getLLMStatus: () => request('/settings/llm'),
    setLLMConfig: (provider, api_key) => request('/settings/llm', { method: 'POST', body: JSON.stringify({ provider, api_key }) }),
  },
  llm: {
    getProviders: () => request('/llm/providers'),
    getCredentials: () => request('/llm/credentials'),
    saveCredential: (data) => request('/llm/credentials', { method: 'POST', body: JSON.stringify(data) }),
    activateCredential: (id) => request(`/llm/credentials/${id}/activate`, { method: 'PUT' }),
    deleteCredential: (id) => request(`/llm/credentials/${id}`, { method: 'DELETE' }),
    testConnection: (data) => request('/llm/test', { method: 'POST', body: JSON.stringify(data) }),
  },
};

