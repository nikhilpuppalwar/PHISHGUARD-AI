import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ALL_NAV_ITEMS } from '../navigation';

export default function Navbar({
  onNavigate,
  currentScreen,
  onToggleMobileSidebar,
  sidebarCollapsed,
  onToggleCollapse
}) {
  const { user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns on outside click or ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
        setNotificationsOpen(false);
        setSearchOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavClick = (screenId, params = {}) => {
    onNavigate(screenId, params);
    setUserDropdownOpen(false);
    setSearchOpen(false);
  };

  const username = user?.profile?.preferred_name || (user?.email ? user.email.split('@')[0] : 'Analyst');
  const role = user?.profile?.role || 'Student';
  const awareness = user?.profile?.security_awareness || 'Beginner';
  const avatarLetter = (username ? username[0] : 'U').toUpperCase();

  // Search matches for quick jump
  const filteredNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* LEFT CLUSTER: Toggle Button + Branding + Subtle MDP Capstone Badge */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Hamburger (Visible on mobile only) */}
          {user && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="md:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle Mobile Navigation Drawer"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
          )}

          {/* Desktop/Tablet Sidebar Collapse Toggle */}
          {user && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden md:flex p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle Sidebar"
            >
              <span className="material-symbols-outlined text-[20px]">
                {sidebarCollapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
          )}

          {/* PhishGuard AI Branding */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => handleNavClick(user ? 'dashboard' : 'landing')}
          >
            <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center text-white shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                PhishGuard <span className="text-blue-600">AI</span>
              </span>
              {/* Subtle MDP Capstone Context Badge */}
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200">
                MDP Capstone
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT CLUSTER: Global Application Controls & Authenticated User Status */}
        <div className="flex items-center gap-2">
          {!user ? (
            /* Public Top Navigation */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavClick('landing')}
                className={`hidden sm:inline-block px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  currentScreen === 'landing'
                    ? 'bg-slate-100 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('glossary')}
                className={`hidden sm:inline-block px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  currentScreen === 'glossary'
                    ? 'bg-slate-100 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Attack Glossary
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('login')}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('signup')}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition"
              >
                Create Account
              </button>
            </div>
          ) : (
            /* Authenticated Global Controls */
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Global Quick Search Dialog Trigger */}
              <div className="relative" ref={searchRef}>
                <button
                  type="button"
                  onClick={() => setSearchOpen(!searchOpen)}
                  title="Search workspaces and navigation (Ctrl+K)"
                  aria-label="Quick search navigation"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-500">search</span>
                  <span className="hidden sm:inline text-slate-600 font-medium">Quick jump...</span>
                  <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium text-slate-600 bg-white border border-slate-200">
                    ⌘K
                  </kbd>
                </button>

                {searchOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg border border-slate-200 shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 mb-2">
                      <span className="material-symbols-outlined text-[20px] text-slate-500">search</span>
                      <input
                        type="text"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search workspace or tools..."
                        className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredNavItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavClick(item.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md text-left hover:bg-slate-100 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[18px] text-slate-600">
                              {item.icon}
                            </span>
                            <span className="font-semibold text-slate-900">{item.label}</span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-slate-500 uppercase">
                            {item.section}
                          </span>
                        </button>
                      ))}
                      {filteredNavItems.length === 0 && (
                        <div className="py-4 text-center text-sm text-slate-500 font-mono">
                          No matching navigation views
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* System Telemetry & Notifications Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  title="System Telemetry & Notifications"
                  aria-label="View notifications"
                  className="relative p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  <span className="material-symbols-outlined text-[22px]">notifications</span>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-84 bg-white rounded-lg border border-slate-200 shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
                      <span className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wide">
                        System Telemetry
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        All Engines Active
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">
                          check_circle
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">4 Detection Agents Synchronized</div>
                          <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            TF-IDF, XGBoost URL, Sender RF, and Vector RAG operational.
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-blue-600 text-[18px] shrink-0 mt-0.5">
                          psychology
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">Defense Profile Calibrated</div>
                          <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            Awareness tier: <span className="font-semibold text-slate-800">{awareness}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Context Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-md hover:bg-slate-100 border border-slate-200 bg-white transition group"
                  aria-expanded={userDropdownOpen}
                  aria-label="User Account Menu"
                >
                  <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {avatarLetter}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-sm font-semibold text-slate-900 leading-tight max-w-[120px] truncate">
                      {username}
                    </span>
                    <span className="text-xs text-slate-600 font-mono leading-none mt-0.5">
                      {role}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover:text-slate-700 hidden sm:inline">
                    expand_more
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* User Summary Header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {username}
                      </div>
                      <div className="text-xs text-slate-600 truncate mt-0.5">
                        {user.email}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500 font-semibold">AWARENESS:</span>
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                          {awareness}
                        </span>
                      </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => handleNavClick('profile')}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 text-left transition font-medium"
                      >
                        <span className="material-symbols-outlined text-[20px] text-slate-500">
                          manage_accounts
                        </span>
                        <span>Profile & Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavClick('onboarding')}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 text-left transition font-medium"
                      >
                        <span className="material-symbols-outlined text-[20px] text-slate-500">
                          quiz
                        </span>
                        <span>Retake Security Wizard</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left transition font-semibold"
                      >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
