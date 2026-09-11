import React, { useState, useEffect } from 'react';
import { GOOGLE_CONFIG, getCurrentUser, logout, onAuthStateChanged, UserProfile } from '../../services/authService';
import { GoogleAuthModal } from '../GoogleAuthModal';
import { MissionSettings, getSettings, updateSettings } from '../../services/settingsService';
import { isGeminiConfigured } from '../../services/chatService';

export const SystemSettingsView: React.FC = () => {
  // Settings persist to localStorage and broadcast to consumers via settingsService
  const [settings, setSettingsState] = useState<MissionSettings>(() => getSettings());
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const geminiReady = isGeminiConfigured();

  useEffect(() => {
    const unsub = onAuthStateChanged((newUser) => setUser(newUser));
    return unsub;
  }, []);

  const patch = (p: Partial<MissionSettings>) => setSettingsState(updateSettings(p));

  const handleSave = () => {
    // Settings are applied on change; Save confirms the cached state explicitly
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-4" id="view-system-settings">
      {/* Header Banner */}
      <div className="panel glass p-6 rounded-[22px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] text-[#c9c2ff] uppercase tracking-[1.5px] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-[#c9c2ff]" />
            Mission Control Configuration
          </div>
          <h2 className="font-space text-2xl font-bold text-[#f1f2fa]">
            PolarNav Navigation Systems Setup
          </h2>
          <p className="text-xs text-[#9297b1] mt-1 max-w-2xl leading-relaxed">
            Configure polar navigation units, synthetic aperture radar (SAR) telemetry polling cadence, proximity collision alert buffers, and bridge display modes.
          </p>
        </div>

        {savedNotice && (
          <div className="px-3 py-1.5 rounded-xl bg-[rgba(102,226,163,0.15)] border border-[rgba(102,226,163,0.3)] text-[#66e2a3] text-xs font-mono">
            ✓ Parameters Applied to Local Cache
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Navigation Units */}
        <div className="panel glass p-5 rounded-[22px]">
          <h3 className="font-space text-sm font-semibold text-[#f1f2fa] pb-3 border-b border-[rgba(165,177,224,0.13)] mb-4">
            Navigation Units & Geodesy
          </h3>
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <strong className="text-[#f1f2fa] block">Distance Measurement</strong>
                <span className="text-[#9297b1] text-[11px]">Nautical Miles or Metric Kilometers</span>
              </div>
              <div className="flex border border-[rgba(165,177,224,0.15)] rounded-lg overflow-hidden font-mono text-[11px]">
                <button
                  onClick={() => patch({ distanceUnit: 'nm' })}
                  className={`px-3 py-1 cursor-pointer transition-colors ${
                    settings.distanceUnit === 'nm' ? 'bg-[#45e0d0] text-[#080914] font-bold' : 'text-[#9297b1]'
                  }`}
                >
                  NM
                </button>
                <button
                  onClick={() => patch({ distanceUnit: 'km' })}
                  className={`px-3 py-1 cursor-pointer transition-colors ${
                    settings.distanceUnit === 'km' ? 'bg-[#45e0d0] text-[#080914] font-bold' : 'text-[#9297b1]'
                  }`}
                >
                  KM
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <strong className="text-[#f1f2fa] block">Vessel & Drift Velocity</strong>
                <span className="text-[#9297b1] text-[11px]">Knots (kts) or Meters / Second (m/s)</span>
              </div>
              <div className="flex border border-[rgba(165,177,224,0.15)] rounded-lg overflow-hidden font-mono text-[11px]">
                <button
                  onClick={() => patch({ speedUnit: 'knots' })}
                  className={`px-3 py-1 cursor-pointer transition-colors ${
                    settings.speedUnit === 'knots' ? 'bg-[#45e0d0] text-[#080914] font-bold' : 'text-[#9297b1]'
                  }`}
                >
                  Knots
                </button>
                <button
                  onClick={() => patch({ speedUnit: 'ms' })}
                  className={`px-3 py-1 cursor-pointer transition-colors ${
                    settings.speedUnit === 'ms' ? 'bg-[#45e0d0] text-[#080914] font-bold' : 'text-[#9297b1]'
                  }`}
                >
                  m/s
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <strong className="text-[#f1f2fa] block">Chart Projection Method</strong>
                <span className="text-[#9297b1] text-[11px]">WGS-84 Polar Stereographic (Antarctic)</span>
              </div>
              <span className="text-[11px] font-mono text-[#45e0d0] px-2 py-1 rounded bg-[rgba(69,224,208,0.08)]">
                EPSG:3031
              </span>
            </div>
          </div>
        </div>

        {/* Tactical Safety & Collision Thresholds */}
        <div className="panel glass p-5 rounded-[22px]">
          <h3 className="font-space text-sm font-semibold text-[#f1f2fa] pb-3 border-b border-[rgba(165,177,224,0.13)] mb-4">
            Collision Avoidance & Radar Alarms
          </h3>
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <div>
                  <strong className="text-[#f1f2fa] block">Closest Point of Approach (CPA) Buffer</strong>
                  <span className="text-[#9297b1] text-[11px]">Trigger alarm when iceberg contacts enter zone</span>
                </div>
                <span className="font-space font-bold text-[#ffca72] text-sm font-mono">
                  {settings.cpaThresholdNm} nm
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={settings.cpaThresholdNm}
                onChange={(e) => patch({ cpaThresholdNm: Number(e.target.value) })}
                className="w-full accent-[#ffca72] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#666b86] font-mono mt-1">
                <span>10 nm (Tight)</span>
                <span>25 nm (Standard)</span>
                <span>50 nm (Wide Security)</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[rgba(255,255,255,0.05)]">
              <div>
                <strong className="text-[#f1f2fa] block">SAR Imagery Telemetry Cadence</strong>
                <span className="text-[#9297b1] text-[11px]">Synthetic Aperture Radar satellite pass ingest</span>
              </div>
              <select
                value={String(settings.sarRefreshMinutes)}
                onChange={(e) => patch({ sarRefreshMinutes: Number(e.target.value) })}
                className="bg-[rgba(255,255,255,0.05)] border border-[rgba(165,177,224,0.15)] rounded-lg px-2.5 py-1 text-xs text-[#f1f2fa] font-mono focus:outline-hidden"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[rgba(255,255,255,0.05)]">
              <div>
                <strong className="text-[#f1f2fa] block">Bridge Night Dimming Mode</strong>
                <span className="text-[#9297b1] text-[11px]">Ultra-dark UI for polar night bridge watchkeeping</span>
              </div>
              <input
                type="checkbox"
                checked={settings.bridgeDimming}
                onChange={(e) => patch({ bridgeDimming: e.target.checked })}
                className="w-4 h-4 accent-[#45e0d0] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Google Cloud Platform & Gemini AI Integrations */}
        <div className="panel glass p-5 rounded-[22px] md:col-span-2">
          <div className="flex justify-between items-center pb-3 border-b border-[rgba(165,177,224,0.13)] mb-4">
            <div>
              <h3 className="font-space text-sm font-semibold text-[#f1f2fa]">
                Cloud AI & Google Identity Gateway
              </h3>
              <p className="text-[11px] text-[#9297b1]">
                Active configuration for Gemini Decision Support and Google Cloud OAuth 2.0
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-semibold ${
                geminiReady
                  ? 'bg-[rgba(69,224,208,0.12)] border-[rgba(69,224,208,0.25)] text-[#45e0d0]'
                  : 'bg-[rgba(255,202,114,0.12)] border-[rgba(255,202,114,0.3)] text-[#ffca72]'
              }`}
            >
              {geminiReady ? 'Live Connected' : 'Degraded — see below'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Gemini Status */}
            <div className="rounded-xl border border-[rgba(165,177,224,0.1)] bg-[rgba(255,255,255,0.02)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#45e0d0] font-semibold font-space">
                <span>✦</span>
                <span>Gemini 3.6 Flash Engine</span>
              </div>
              <p className="text-[11px] text-[#9297b1]">
                Real-time polar mission reasoning, iceberg hazard telemetry evaluation, and route guidance.
              </p>
              <div className="pt-2 border-t border-[rgba(165,177,224,0.08)]">
                <span className="text-[10px] text-[#666b86] block uppercase tracking-wider font-mono">API Key Status</span>
                <span
                  className={`font-mono text-[11px] font-medium flex items-center gap-1.5 mt-0.5 ${
                    geminiReady ? 'text-[#66e2a3]' : 'text-[#ffca72]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${geminiReady ? 'bg-[#66e2a3]' : 'bg-[#ffca72]'}`}
                  ></span>
                  {geminiReady ? 'Active (Configured from .env)' : 'Missing — assistant replies disabled'}
                </span>
              </div>
            </div>

            {/* Google Cloud OAuth 2.0 */}
            <div className="rounded-xl border border-[rgba(165,177,224,0.1)] bg-[rgba(255,255,255,0.02)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#c9c2ff] font-semibold font-space">
                <span>☁</span>
                <span>Google Cloud Project</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#9297b1]">Project ID:</span>
                  <span className="font-mono text-[#f1f2fa]">{GOOGLE_CONFIG.projectId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9297b1]">Domain:</span>
                  <span className="font-mono text-[#45e0d0]">{GOOGLE_CONFIG.appUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9297b1]">Client ID:</span>
                  <span className="font-mono text-[#9297b1] text-[10px] truncate max-w-[120px]" title={GOOGLE_CONFIG.clientId}>
                    {GOOGLE_CONFIG.clientId.slice(0, 16)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Operator Auth Status */}
            <div className="rounded-xl border border-[rgba(165,177,224,0.1)] bg-[rgba(255,255,255,0.02)] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[#8b7cff] font-semibold font-space flex items-center gap-2">
                  <span>⚓</span>
                  <span>Officer Identity</span>
                </span>
                {user ? (
                  <div className="mt-2 space-y-1">
                    <p className="font-bold text-white text-xs">{user.name}</p>
                    <p className="text-[11px] text-[#9297b1] truncate">{user.email}</p>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-[rgba(102,226,163,0.15)] text-[#66e2a3] text-[10px] font-mono">
                      ✓ Authenticated ({user.provider})
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#9297b1] mt-2">
                    Not currently authenticated. Sign in with Google Cloud Identity to unlock mission logs.
                  </p>
                )}
              </div>

              <div className="mt-3">
                {user ? (
                  <button
                    onClick={() => logout()}
                    className="w-full py-1.5 px-3 rounded-lg border border-red-800/40 bg-red-950/25 hover:bg-red-900/30 text-red-300 text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    Disconnect Session
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-1.5 px-3 rounded-lg border border-[rgba(69,224,208,0.3)] bg-[rgba(69,224,208,0.1)] hover:bg-[rgba(69,224,208,0.2)] text-[#45e0d0] text-[11px] font-space font-semibold transition-all cursor-pointer"
                  >
                    Authenticate with Google
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-[rgba(69,224,208,0.15)] hover:bg-[rgba(69,224,208,0.25)] border border-[rgba(69,224,208,0.35)] text-[#45e0d0] font-space font-bold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(69,224,208,0.15)]"
        >
          Save Configuration Preferences
        </button>
      </div>

      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </div>
  );
};
