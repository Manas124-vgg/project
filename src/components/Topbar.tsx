import React, { useEffect, useState } from 'react';
import { NavSection } from '../types';
import { getCurrentUser, logout, onAuthStateChanged, UserProfile } from '../services/authService';
import { GoogleAuthModal } from './GoogleAuthModal';

interface TopbarProps {
  currentSection: NavSection;
  onOpenMobileMenu: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const sectionLabels: Record<NavSection, { parent: string; title: string }> = {
  overview: { parent: 'Workspace', title: 'Mission Overview' },
  ice: { parent: 'Workspace', title: 'Ice Conditions' },
  icebergs: { parent: 'Workspace', title: 'Iceberg Tracking' },
  routes: { parent: 'Workspace', title: 'Route Analysis' },
  environment: { parent: 'Workspace', title: 'Environmental Data' },
  vessel: { parent: 'Operations', title: 'Vessel Status' },
  settings: { parent: 'Operations', title: 'System Settings' },
};

export const Topbar: React.FC<TopbarProps> = ({
  currentSection,
  onOpenMobileMenu,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [utcTime, setUtcTime] = useState<string>('--:--:--');
  const [utcDate, setUtcDate] = useState<string>('');
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  useEffect(() => {
    const unsub = onAuthStateChanged((newUser) => {
      setUser(newUser);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19));
      setUtcDate(
        now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = sectionLabels[currentSection] || {
    parent: 'Workspace',
    title: 'Mission Overview',
  };

  return (
    <header className="flex items-center justify-between mb-6 pb-2" id="polarnav-topbar">
      {/* Mobile drawer button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden w-9 h-9 grid place-items-center rounded-xl border border-[rgba(165,177,224,0.13)] bg-[rgba(255,255,255,0.025)] text-[#b7bad0] hover:text-white"
          aria-label="Open Navigation"
        >
          ☰
        </button>

        <div className="flex items-center gap-2.5 text-[#9297b1] text-xs max-sm:hidden">
          <span className="font-medium text-[#666b86] uppercase tracking-wider text-[11px]">
            {meta.parent}
          </span>
          <span className="text-[rgba(165,177,224,0.3)]">/</span>
          <strong className="text-[#f1f2fa] font-space font-semibold tracking-wide">
            {meta.title}
          </strong>
        </div>
      </div>

      {/* Top right actions */}
      <div className="flex items-center gap-2.5">
        {/* Date pill */}
        <div className="hidden lg:flex items-center gap-1.5 border border-[rgba(165,177,224,0.13)] rounded-[11px] px-3 py-2 bg-[rgba(255,255,255,0.025)] text-[#9297b1] text-[11px] font-mono">
          <span>{utcDate}</span>
        </div>

        {/* UTC Clock */}
        <div
          id="clock-container"
          className="border border-[rgba(165,177,224,0.13)] rounded-[11px] px-3 py-2 bg-[rgba(255,255,255,0.025)] text-[#b7bad0] text-[11px] font-mono flex items-center gap-1.5 shadow-xs"
        >
          <span className="text-[#666b86] font-sans text-[10px] uppercase tracking-wider font-semibold">
            UTC
          </span>
          <strong id="clock" className="text-[#45e0d0] tracking-wider font-bold">
            {utcTime}
          </strong>
        </div>

        {/* Live Stream Pulse Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 border border-[rgba(69,224,208,0.3)] rounded-[11px] px-2.5 py-2 bg-[rgba(69,224,208,0.06)] text-[#45e0d0] text-[11px] font-mono shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#45e0d0] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#45e0d0]"></span>
          </span>
          <span className="font-semibold text-[10px] tracking-wider uppercase">Live Stream</span>
        </div>

        {/* Quick Polar Grid coordinates indicator */}
        <div className="hidden md:flex items-center gap-1 border border-[rgba(165,177,224,0.13)] rounded-[11px] px-2.5 py-2 bg-[rgba(255,255,255,0.025)] text-[#9297b1] text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#45e0d0] opacity-80" />
          <span className="font-mono text-[10px] text-[#b7bad0]">64°18'S · 56°42'W</span>
        </div>

        {/* User / Google Sign-In */}
        <div className="relative">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 border border-[rgba(69,224,208,0.3)] rounded-[11px] px-2.5 py-1.5 bg-[rgba(69,224,208,0.06)] hover:bg-[rgba(69,224,208,0.12)] text-[#f1f2fa] transition-all cursor-pointer"
                title="Mission Officer Profile"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover border border-[#45e0d0]"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-[#45e0d0] text-black text-[10px] font-bold flex items-center justify-center">
                    {user.name.charAt(0)}
                  </span>
                )}
                <span className="text-[11px] font-space font-medium hidden xl:inline max-w-[100px] truncate">
                  {user.name}
                </span>
                <span className="text-[9px] text-[#45e0d0]">▼</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[rgba(165,177,224,0.2)] bg-[#0d1020] p-3 shadow-xl z-50 text-xs">
                  <div className="border-b border-[rgba(165,177,224,0.12)] pb-2 mb-2">
                    <p className="font-semibold text-white font-space truncate">{user.name}</p>
                    <p className="text-[11px] text-[#9297b1] truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-[rgba(69,224,208,0.12)] text-[#45e0d0] text-[10px] font-mono">
                      {user.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#666b86] mb-2 font-mono">
                    Provider: Google OAuth 2.0
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full py-1.5 px-2 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-medium transition-colors text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Sign Out</span>
                    <span>⏻</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 border border-[rgba(69,224,208,0.35)] rounded-[11px] px-3 py-1.5 bg-[rgba(69,224,208,0.08)] hover:bg-[rgba(69,224,208,0.18)] text-[#45e0d0] text-[11px] font-space font-semibold transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Fullscreen button */}
        <button
          id="fullscreen-button"
          onClick={onToggleFullscreen}
          className="w-9 h-9 grid place-items-center border border-[rgba(165,177,224,0.13)] rounded-[11px] bg-[rgba(255,255,255,0.025)] text-[#b7bad0] hover:text-[#45e0d0] hover:border-[rgba(69,224,208,0.25)] transition-all cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? '⤢' : '⛶'}
        </button>
      </div>

      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </header>
  );
};
