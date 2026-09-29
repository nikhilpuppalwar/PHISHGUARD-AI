import React, { useState, useEffect } from 'react';
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
import { ROUTE_TO_SCREEN, SCREEN_TO_ROUTE } from './navigation';

function AppContent() {
  const { user, loading } = useAuth();
  
  // Resolve initial screen from URL pathname or fallback
  const getInitialScreen = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      if (ROUTE_TO_SCREEN[path]) {
        return ROUTE_TO_SCREEN[path];
      }
    }
    return 'landing';
  };

  const [currentScreen, setCurrentScreen] = useState(getInitialScreen);
  const [activeResult, setActiveResult] = useState(null);
  const [submitInitialText, setSubmitInitialText] = useState('');
  
  // Navigation layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync navigation with browser URL and history
  const navigate = (screen, params = {}) => {
    if (params.initialText) {
      setSubmitInitialText(params.initialText);
    }
    setCurrentScreen(screen);
    setMobileSidebarOpen(false);

    // Update browser URL
    const targetRoute = SCREEN_TO_ROUTE[screen] || '/';
    if (window.location.pathname !== targetRoute) {
      window.history.pushState(params, '', targetRoute);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle browser back and forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      const screen = ROUTE_TO_SCREEN[path] || (user ? 'dashboard' : 'landing');
      setCurrentScreen(screen);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // If user state finishes loading and on root path, route appropriately
  useEffect(() => {
    if (!loading) {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      if (path === '/' || path === '/landing') {
        if (user && currentScreen === 'landing') {
          // Keep on landing unless they intentionally navigate or prefer dashboard
        }
      }
    }
  }, [loading, user]);

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
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center text-slate-200 space-y-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
          <span className="material-symbols-outlined text-[24px]">security</span>
        </div>
        <div className="text-sm font-medium text-slate-300 font-mono">Loading PhishGuard AI...</div>
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
        <Navbar
          onNavigate={navigate}
          currentScreen={currentScreen}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <OnboardingPage onNavigate={navigate} />
      </>
    );
  }

  // Public Landing Page (with Navbar)
  if (currentScreen === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar
          onNavigate={navigate}
          currentScreen={currentScreen}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 pt-16">
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
      : "Your session has expired. Please sign in to access your PhishGuard security workspace.";
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
      <Navbar
        onNavigate={navigate}
        currentScreen={currentScreen}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 pt-16 flex">
        {/* Primary Left Application Sidebar (Persistent on desktop, collapsible, drawer on mobile) */}
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={navigate}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

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
