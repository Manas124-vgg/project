import React from 'react';
import { NavSection } from '../types';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  icebergCount?: number;
  mobileOpen?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile: () => void;
  systemMode: string;
  onChangeSystemMode?: (mode: 'live' | 'simulation' | 'standby') => void;
  onToggleSystemMode?: () => void;
}

interface NavItemConfig {
  id: NavSection;
  label: string;
  icon: string;
  category: 'Workspace' | 'Operations';
  badge?: string | number;
}

const navItems: NavItemConfig[] = [
  { id: 'overview', label: 'Mission Overview', icon: '⌂', category: 'Workspace' },
  { id: 'ice', label: 'Ice Tracking', icon: '◉', category: 'Workspace' },
  { id: 'icebergs', label: 'Iceberg Catalog', icon: '◇', category: 'Workspace', badge: '07' },
  { id: 'routes', label: 'Route Analysis', icon: '⌁', category: 'Workspace' },
  { id: 'environment', label: 'Weather & Sensors', icon: '◌', category: 'Workspace' },
  { id: 'vessel', label: 'Fleet Status', icon: '▣', category: 'Operations' },
  { id: 'settings', label: 'Mission Logs', icon: '⚙', category: 'Operations' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  mobileOpen,
  isMobileOpen,
  onCloseMobile,
  systemMode,
  onChangeSystemMode,
  onToggleSystemMode,
}) => {
  const isOpen = isMobileOpen ?? mobileOpen ?? false;
  const toggleMode = () => {
    if (onToggleSystemMode) {
      onToggleSystemMode();
    } else if (onChangeSystemMode) {
      const nextMode = systemMode === 'live' ? 'simulation' : systemMode === 'simulation' ? 'standby' : 'live';
      onChangeSystemMode(nextMode);
    }
  };
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-90 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="polarnav-sidebar"
        className={`fixed left-0 top-0 w-[220px] lg:w-[240px] h-screen p-6 border-r border-[var(--border)] bg-[#080914] z-100 flex flex-col justify-between transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'max-md:-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Brand header */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onSelectSection('overview')}
          >
            <div
              className="w-8 h-8 rounded-lg grid place-items-center font-bold text-black text-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b7cff, var(--accent))' }}
            >
              P
            </div>
            <div>
              <strong className="block font-space font-bold tracking-wider text-sm text-[#f1f2fa]">
                POLARNAV
              </strong>
              <span className="text-[#9297b1] text-[9px] uppercase tracking-[1.5px] block">
                Mission Control
              </span>
            </div>
          </div>

          {/* Navigation group */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[#666b86] text-[10px] uppercase tracking-[1.5px] px-3 font-semibold mb-1">
              Navigation
            </div>
            {navItems.map((item) => {
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    onSelectSection(item.id);
                    onCloseMobile();
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-[13px] transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[rgba(69,224,208,0.1)] text-[#45e0d0] font-semibold'
                      : 'text-[#9297b1] hover:text-[#f1f2fa] hover:bg-[rgba(255,255,255,0.03)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-sm ${isActive ? 'text-[#45e0d0]' : 'text-[#9297b1]'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[rgba(69,224,208,0.15)] text-[#45e0d0] font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Bottom Bento System Card */}
        <div className="mt-auto pt-4">
          <div className="bento-card p-3 rounded-xl border border-[var(--border)] bg-[#111428]">
            <div className="data-row py-1 border-0">
              <span className="text-[10px] uppercase tracking-wider text-[#9297b1]">System Status</span>
              <span className="text-[#66e2a3] text-[10px] font-mono flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#66e2a3] inline-block animate-pulse shadow-[0_0_6px_#66e2a3]" />
                ONLINE
              </span>
            </div>

            <div className="data-row py-1 border-0 border-t border-[rgba(165,177,224,0.1)] mt-1 pt-1.5">
              <span className="text-[10px] text-[#9297b1]">Mode</span>
              <button
                onClick={toggleMode}
                className="text-[10px] font-mono text-[#8b7cff] hover:text-[#c9c2ff] transition-colors cursor-pointer uppercase"
              >
                {systemMode}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
