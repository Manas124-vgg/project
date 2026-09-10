import React, { useEffect, useState } from 'react';
import { NavSection } from '../types';

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
    </header>
  );
};
