import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NAV_SECTIONS } from '../navigation';

export default function Sidebar({
  currentScreen,
  onNavigate,
  collapsed = false,
  setCollapsed,
  mobileOpen = false,
  onCloseMobile
}) {
  const { user, logout } = useAuth();

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const handleItemClick = (screenId) => {
    onNavigate(screenId);
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
    logout();
  };

  const username = user?.profile?.preferred_name || (user?.email ? user.email.split('@')[0] : 'Analyst');
  const role = user?.profile?.role || 'Student';
  const awareness = user?.profile?.security_awareness || 'Beginner';
  const avatarLetter = (username ? username[0] : 'U').toUpperCase();

  const workspaceSection = NAV_SECTIONS.find((s) => s.id === 'WORKSPACE');
  const securitySection = NAV_SECTIONS.find((s) => s.id === 'SECURITY');
  const accountSection = NAV_SECTIONS.find((s) => s.id === 'ACCOUNT');

  const renderNavButton = (item) => {
    const isActive = currentScreen === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleItemClick(item.id)}
        title={collapsed ? item.label : undefined}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`w-full flex items-center rounded-md text-sm font-medium transition-colors duration-150 group ${
          collapsed
            ? 'justify-center p-2.5 my-1'
            : 'gap-3 px-3 py-2.5'
        } ${
          isActive
            ? 'bg-blue-600 text-white font-semibold shadow-xs'
            : 'text-slate-200 hover:text-white hover:bg-navy-800'
        }`}
      >
        <span
          className={`material-symbols-outlined shrink-0 text-[20px] transition-transform duration-150 ${
            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          {item.icon}
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none">
      <div className="space-y-4">
        {/* Top Header Row in Sidebar */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} pb-2 border-b border-slate-800/80`}>
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Navigation
              </span>
            </div>
          ) : null}

          {/* Sidebar Collapse Toggle Button (Desktop/Tablet) */}
          {setCollapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {collapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          )}

          {/* Close button for Mobile Drawer */}
          {mobileOpen && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              title="Close navigation drawer"
              aria-label="Close navigation drawer"
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-navy-800 transition-colors md:hidden"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* User Context Card */}
        <div
          onClick={() => handleItemClick('profile')}
          title="Click to view Profile & Settings"
          className={`rounded-lg bg-navy-800 border border-slate-700/60 cursor-pointer hover:border-slate-500 transition group ${
            collapsed ? 'p-2 flex flex-col items-center' : 'p-3.5'
          }`}
        >
          {collapsed ? (
            <div
              className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-sm"
              title={`${username} • Role: ${role} • Awareness: ${awareness}`}
            >
              {avatarLetter}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs">
                  {avatarLetter}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                    {username}
                  </div>
                  <div className="text-xs text-slate-300 truncate mt-0.5">
                    Role: {role}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">SECURITY AWARENESS</span>
                <span className="text-blue-300 font-bold bg-blue-950/80 px-2 py-0.5 rounded border border-blue-700">
                  {awareness}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Section 1: WORKSPACE */}
        <nav aria-label="Workspace Navigation" className="space-y-1">
          {!collapsed && (
            <div className="px-3 text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
              Workspace
            </div>
          )}
          {workspaceSection?.items.map(renderNavButton)}
        </nav>

        {/* Section 2: SECURITY */}
        <nav aria-label="Security Navigation" className="space-y-1 pt-1">
          {!collapsed && (
            <div className="px-3 text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
              Security
            </div>
          )}
          {securitySection?.items.map(renderNavButton)}
        </nav>

        {/* Section 3: Visual Divider & ACCOUNT */}
        <div className="pt-2 border-t border-slate-800">
          {!collapsed && (
            <div className="px-3 text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
              Account
            </div>
          )}
          <nav aria-label="Account Navigation" className="space-y-1">
            {accountSection?.items.map(renderNavButton)}

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              title={collapsed ? 'Sign Out' : undefined}
              aria-label="Sign Out"
              className={`w-full flex items-center rounded-md font-medium text-sm text-slate-300 hover:text-red-300 hover:bg-red-950/30 transition-colors duration-150 group ${
                collapsed ? 'justify-center p-2.5 my-1' : 'gap-3 px-3 py-2.5'
              }`}
            >
              <span className="material-symbols-outlined shrink-0 text-[20px] text-slate-400 group-hover:text-red-400">
                logout
              </span>
              {!collapsed && <span>Sign Out</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* Detection Engines Status Panel */}
      <div className="pt-4 border-t border-slate-800">
        {!collapsed ? (
          <div className="p-3.5 rounded-lg bg-navy-850 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold">DETECTION ENGINES</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active
              </span>
            </div>
            <div className="space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Text Agent:</span>
                <span className="text-slate-200 font-medium">TF-IDF + LR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">URL Agent:</span>
                <span className="text-slate-200 font-medium">XGBoost (54f)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sender Agent:</span>
                <span className="text-slate-200 font-medium">Random Forest</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Incident Memory:</span>
                <span className="text-slate-200 font-medium">RAG Vectors</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center p-2.5 rounded-lg bg-navy-850 border border-slate-800 text-emerald-400 cursor-help"
            title="Multi-Agent Detection Engines: 4/4 Active (Text, URL, Sender, RAG Memory)"
          >
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Persistent Sidebar */}
      <aside
        className={`hidden md:flex bg-navy-900 text-slate-200 min-h-[calc(100vh-4rem)] border-r border-navy-border flex-col p-4 shrink-0 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer & Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Pane */}
          <div className="relative w-72 max-w-[85vw] bg-navy-900 text-slate-200 h-full p-4 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
