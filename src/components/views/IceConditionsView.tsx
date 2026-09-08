import React from 'react';
import { EnvironmentalCondition } from '../../types';

interface IceConditionsViewProps {
  environment: EnvironmentalCondition;
}

export const IceConditionsView: React.FC<IceConditionsViewProps> = ({ environment }) => {
  const iceClassifications = [
    { type: 'Fast Ice (Landfast)', concentration: '10/10', thickness: '1.8m – 2.4m', risk: 'Impassable without icebreaker' },
    { type: 'First-Year Pack Ice (Thick)', concentration: '7-8/10', thickness: '1.2m – 1.6m', risk: 'Caution; structural ridges' },
    { type: 'First-Year Pack Ice (Medium)', concentration: '5-6/10', thickness: '0.7m – 1.2m', risk: 'Navigable along leads' },
    { type: 'Open Water / Leads', concentration: '<1/10', thickness: '<0.1m (Pancake)', risk: 'Clear transit corridor' },
  ];

  return (
    <div className="space-y-4" id="view-ice-conditions">
      {/* Top Banner */}
      <div className="panel glass p-6 rounded-[22px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] text-[#45e0d0] uppercase tracking-[1.5px] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-[#45e0d0] animate-pulse" />
            Synthetic Aperture Radar · Sentinel-1 SAR Telemetry
          </div>
          <h2 className="font-space text-2xl font-bold text-[#f1f2fa]">
            Cryospheric Ice Assessment
          </h2>
          <p className="text-xs text-[#9297b1] mt-1 max-w-2xl leading-relaxed">
            Multi-frequency SAR backscatter, radiometer imagery and shipboard forward-looking sonar data for the Weddell Gyre and northern Antarctic Peninsula corridor.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(165,177,224,0.13)] text-right">
            <span className="text-[10px] text-[#9297b1] block">Average Pack Thickness</span>
            <strong className="font-space text-lg text-[#6ddcff]">{environment.seaIceThicknessM} m</strong>
          </div>
          <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(165,177,224,0.13)] text-right">
            <span className="text-[10px] text-[#9297b1] block">Freeze-up Index</span>
            <strong className="font-space text-lg text-[#66e2a3]">{environment.freezeUpRisk}</strong>
          </div>
        </div>
      </div>

      {/* Grid: Ice Classification & Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Classification table */}
        <div className="lg:col-span-2 panel glass p-5 rounded-[22px]">
          <div className="flex justify-between items-center pb-3 border-b border-[rgba(165,177,224,0.13)] mb-4">
            <div>
              <h3 className="font-space text-sm font-semibold text-[#f1f2fa]">
                Regional Sea-Ice Classification
              </h3>
              <p className="text-[10px] text-[#9297b1]">WMO Sea-Ice Nomenclature & Egg Code Standards</p>
            </div>
            <span className="badge border border-[rgba(69,224,208,0.2)] text-[#45e0d0] text-[9px] px-2 py-1 rounded-md">
              SAR Updated 38m ago
            </span>
          </div>

          <div className="space-y-3">
            {iceClassifications.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(165,177,224,0.08)] flex flex-col sm:flex-row justify-between sm:items-center gap-2"
              >
                <div>
                  <div className="text-xs font-semibold text-[#f1f2fa] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-xs bg-[#45e0d0]" />
                    {item.type}
                  </div>
                  <div className="text-[10px] text-[#9297b1] mt-0.5">
                    Operational Impact: <span className="text-[#c9c2ff]">{item.risk}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-[#b7bad0]">Conc: <strong className="text-[#f1f2fa]">{item.concentration}</strong></span>
                  <span className="text-[#b7bad0]">Thick: <strong className="text-[#6ddcff]">{item.thickness}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Tactical Radar Radar Sonar Info */}
        <div className="panel glass p-5 rounded-[22px] flex flex-col justify-between">
          <div>
            <h3 className="font-space text-sm font-semibold text-[#f1f2fa] pb-2 border-b border-[rgba(165,177,224,0.13)]">
              Forward Sonar / Radar Scan
            </h3>

            <div className="mt-4 p-4 rounded-xl bg-[rgba(8,12,24,0.8)] border border-[rgba(69,224,208,0.15)] flex flex-col items-center text-center relative overflow-hidden">
              {/* Radar sweep animation */}
              <div className="w-28 h-28 rounded-full border border-[rgba(69,224,208,0.3)] relative my-2 grid place-items-center">
                <div className="w-20 h-20 rounded-full border border-[rgba(69,224,208,0.2)]" />
                <div className="w-12 h-12 rounded-full border border-[rgba(69,224,208,0.15)]" />
                <div className="absolute inset-0 radar-sweep bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(69,224,208,0.3)_360deg)] rounded-full" />
                <span className="w-2 h-2 rounded-full bg-[#45e0d0] shadow-[0_0_8px_#45e0d0] z-10" />
              </div>
              <span className="text-[11px] font-mono text-[#45e0d0] font-semibold mt-1">
                Acoustic Clear Ahead: 4.8 nm
              </span>
              <span className="text-[10px] text-[#9297b1] mt-0.5">
                Subsurface pressure keel detection: Nominal
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-[#9297b1]">Brash Ice Density:</span>
                <span className="text-[#f1f2fa] font-mono">14% in navigable lead</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-[#9297b1]">Pressure Ridging Risk:</span>
                <span className="text-[#ffca72] font-mono">Low-Moderate</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#9297b1]">Sea Surface Salinity:</span>
                <span className="text-[#f1f2fa] font-mono">34.1 PSU</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] text-[10px] text-[#9297b1]">
            Standard ice watch protocols enforced. Continuous radar gain compensation active.
          </div>
        </div>
      </div>
    </div>
  );
};
