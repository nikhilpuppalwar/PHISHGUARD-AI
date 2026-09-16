import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import PasswordResetPage from './pages/PasswordResetPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import SubmitAnalysisPage from './pages/SubmitAnalysisPage';
import AnalysisResultPage from './pages/AnalysisResultPage';
import IncidentHistoryPage from './pages/IncidentHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import GlossaryPage from './pages/GlossaryPage';
import { api } from './api/client';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [activeResult, setActiveResult] = useState(null);
  const [submitInitialText, setSubmitInitialText] = useState('');

  const navigate = (screen, params = {}) => {
    if (params.initialText) {
      setSubmitInitialText(params.initialText);
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSubmission = async (submissionId) => {
    try {
      const data = await api.analyze.getById(submissionId);
      setActiveResult(data);
      navigate('result');
    } catch (err) {
      alert(`Failed to load submission: ${err.message}`);
    }
  };

  const handleAnalysisComplete = (result) => {
    setActiveResult(result);
    navigate('result');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 animate-pulse">
          <span className="material-symbols-outlined text-[28px]">security</span>
        </div>
        <div className="text-sm font-mono text-cyan-400">Loading PhishGuard AI...</div>
      </div>
    );
  }

  // Standalone Full-screen layouts (Auth & Recovery)
  if (currentScreen === 'login') {
    return <LoginPage onNavigate={navigate} />;
  }
  if (currentScreen === 'signup') {
    return <SignUpPage onNavigate={navigate} />;
  }
  if (currentScreen === 'forgot-password') {
    return <PasswordResetPage onNavigate={navigate} />;
  }
  if (currentScreen === 'onboarding') {
    return (
      <>
        <Navbar onNavigate={navigate} currentScreen={currentScreen} />
        <OnboardingPage onNavigate={navigate} />
      </>
    );
  }

  // Public Landing Page (with Navbar)
  if (currentScreen === 'landing') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onNavigate={navigate} currentScreen={currentScreen} />
        <main className="flex-1 pt-20">
          <LandingPage onNavigate={navigate} />
        </main>
      </div>
    );
  }

  // Workspace Authentication Guard: Protected routes require active login
  const PROTECTED_SCREENS = ['dashboard', 'submit', 'result', 'incidents', 'analytics', 'profile', 'glossary'];
  if (!user && PROTECTED_SCREENS.includes(currentScreen)) {
    const customMessage = currentScreen === 'glossary'
      ? "Authentication required: Please sign in to explore the Threat Intelligence & Attack Type Glossary reference."
      : "Authentication required: Please sign in to access PhishGuard workspaces and multi-agent detection tools.";
    return (
      <LoginPage 
        onNavigate={navigate} 
        targetScreen={currentScreen}
        redirectMessage={customMessage} 
      />
    );
  }

  // Authenticated Workspace Layout (Navbar + Sidebar + Content)
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar onNavigate={navigate} currentScreen={currentScreen} />
      <div className="flex-1 pt-20 flex">
        {/* Workspace Sidebar */}
        <Sidebar currentScreen={currentScreen} onNavigate={navigate} />

        {/* Dynamic Screen View */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentScreen === 'dashboard' && (
            <DashboardPage
              onNavigate={navigate}
              onSelectSubmission={handleSelectSubmission}
            />
          )}
          {currentScreen === 'submit' && (
            <SubmitAnalysisPage
              onNavigate={navigate}
              onAnalysisComplete={handleAnalysisComplete}
              initialText={submitInitialText}
            />
          )}
          {currentScreen === 'result' && (
            <AnalysisResultPage
              result={activeResult}
              onNavigate={navigate}
            />
          )}
          {currentScreen === 'incidents' && (
            <IncidentHistoryPage
              onNavigate={navigate}
              onSelectSubmission={handleSelectSubmission}
            />
          )}
          {currentScreen === 'analytics' && (
            <AnalyticsPage onNavigate={navigate} />
          )}
          {currentScreen === 'profile' && (
            <ProfileSettingsPage onNavigate={navigate} />
          )}
          {currentScreen === 'glossary' && (
            <GlossaryPage onNavigate={navigate} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
