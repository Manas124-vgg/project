import React, { useState } from 'react';

export const SystemSettingsView: React.FC = () => {
  const [distanceUnit, setDistanceUnit] = useState<'nm' | 'km'>('nm');
  const [speedUnit, setSpeedUnit] = useState<'knots' | 'ms'>('knots');
  const [cpaThreshold, setCpaThreshold] = useState<number>(25);
  const [sarRefreshInterval, setSarRefreshInterval] = useState<string>('30');
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [bridgeDimming, setBridgeDimming] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const handleSave = () => {
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
                  onClick={() => setDistanceUnit('nm')}
                  className={`px-3 py-1 cursor-pointer transition-colors ${
                    distanceUnit === 'nm' ? 'bg-[#45e0d0] text-[#080914] font-bold' : 'text-[#9297b1]'
                  }`}
                >
                  NM
                </button>
                <button
                  onClick={() => setDistanceUnit('km')}
                  className={`px-3 py-1 cursor-pointer transition-colors ${
                    distanceUnit === 'km' ? 'bg-[#45e0d0] text-[#080914] font-bold' : 'text-[#9297b1]'
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
                  onClick={() => setSpeedUnit('knots')}
                  className={`px-3 py-1 cursor-pointer transition-colors ${
                    speedUnit === 'knots' ? 'bg-[#45e0d0] text-[#080914] font-bold' : 'text-[#9297b1]'
                  }`}
                >
                  Knots
                </button>
                <button
                  onClick={() => setSpeedUnit('ms')}
                  className={`px-3 py-1 cursor-pointer transition-colors ${
                    speedUnit === 'ms' ? 'bg-[#45e0d0] text-[#080914] font-bold' : 'text-[#9297b1]'
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
                  {cpaThreshold} nm
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={cpaThreshold}
                onChange={(e) => setCpaThreshold(Number(e.target.value))}
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
                value={sarRefreshInterval}
                onChange={(e) => setSarRefreshInterval(e.target.value)}
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
                checked={bridgeDimming}
                onChange={(e) => setBridgeDimming(e.target.checked)}
                className="w-4 h-4 accent-[#45e0d0] cursor-pointer"
              />
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
    </div>
  );
};
