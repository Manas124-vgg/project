import React, { useState } from 'react';
import { RouteCorridor } from '../types';

interface RoutePanelProps {
  corridors: RouteCorridor[];
  selectedCorridorId: string;
  onSelectCorridor: (id: string) => void;
  vesselSpeed?: number;
  fuelReserve?: number;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
  corridors,
  selectedCorridorId,
  onSelectCorridor,
  vesselSpeed = 12.8,
  fuelReserve = 86,
}) => {
  const [showLiveCalculation, setShowLiveCalculation] = useState<boolean>(true);
  const currentCorridor = corridors.find((c) => c.id === selectedCorridorId) || corridors[0];

  return (
    <div className="bento-card flex flex-col justify-between gap-3.5" id="navigation-context-panel">
      {/* Header with corridor tabs */}
      <div>
        <div className="flex justify-between items-center pb-2.5 border-b border-[rgba(165,177,224,0.15)] mb-3">
          <div>
            <div className="card-title mb-0">Navigation & Alerts</div>
            <div className="text-[#9297b1] text-[10px]">
              Corridor tactical assessment
            </div>
          </div>

          <div className="flex items-center gap-1 font-mono">
            {corridors.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCorridor(c.id)}
                className={`px-2 py-0.5 rounded text-[9px] transition-all cursor-pointer ${
                  c.id === selectedCorridorId
                    ? 'bg-[rgba(69,224,208,0.2)] text-[#45e0d0] border border-[rgba(69,224,208,0.35)] font-bold'
                    : 'text-[#9297b1] hover:text-[#f1f2fa] bg-[rgba(255,255,255,0.02)] border border-transparent'
                }`}
              >
                {c.name.split(' ')[1] || c.id.slice(-1).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Proximity Alert Items (Bento Style) */}
        <div className="space-y-2 mb-3">
          <div className="alert-item">
            <div className="alert-dot" />
            <div className="text-[11px] leading-tight">
              <strong className="text-[#f1f2fa] block font-space">Berg A-76A Contact In Corridor</strong>
              <span className="text-[#9297b1] font-mono text-[10px]">
                Distance: 18.4 nm · Vector: 312° · CPA 4.2 nm
              </span>
            </div>
          </div>

          <div className="alert-item" style={{ background: 'rgba(255,202,114,0.06)', borderColor: 'rgba(255,202,114,0.2)' }}>
            <div className="alert-dot" style={{ background: '#ffca72', boxShadow: '0 0 8px #ffca72' }} />
            <div className="text-[11px] leading-tight">
              <strong className="text-[#f1f2fa] block font-space">Pack Ice Ridge Ahead</strong>
              <span className="text-[#9297b1] font-mono text-[10px]">
                Thickness: 1.8m · Transit lead bearing 295°
              </span>
            </div>
          </div>
        </div>

        {/* Active Corridor Card */}
        <div className="p-3 rounded-xl bg-[rgba(69,224,208,0.035)] border border-[rgba(69,224,208,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#66e2a3] text-[9px] uppercase tracking-[1px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#66e2a3] shadow-[0_0_8px_rgba(102,226,163,0.6)] animate-pulse" />
              {currentCorridor.status}
            </div>

            <button
              onClick={() => setShowLiveCalculation(!showLiveCalculation)}
              className="text-[9px] text-[#45e0d0] hover:underline cursor-pointer"
            >
              {showLiveCalculation ? 'reset' : 'compute'}
            </button>
          </div>

          <div className="font-space text-xs font-bold text-[#f1f2fa] mt-1">
            {currentCorridor.name}
          </div>

          {/* Metrics 2x2 */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-lg p-2">
              <span className="text-[#9297b1] text-[9px] block">Distance</span>
              <strong className="font-mono text-xs text-[#f1f2fa]">
                {showLiveCalculation ? `${currentCorridor.distanceNm} nm` : '—'}
              </strong>
            </div>

            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-lg p-2">
              <span className="text-[#9297b1] text-[9px] block">ETA</span>
              <strong className="font-mono text-xs text-[#45e0d0]">
                {showLiveCalculation ? currentCorridor.etaFormatted : '—'}
              </strong>
            </div>

            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-lg p-2">
              <span className="text-[#9297b1] text-[9px] block">Fuel Burn</span>
              <strong className="font-mono text-xs text-[#b7bad0]">
                {showLiveCalculation ? `${currentCorridor.fuelConsumptionPct}%` : '—'}
              </strong>
            </div>

            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-lg p-2">
              <span className="text-[#9297b1] text-[9px] block">Risk Profile</span>
              <strong
                className={`font-space text-xs ${
                  showLiveCalculation
                    ? currentCorridor.riskScore === 'Low'
                      ? 'text-[#66e2a3]'
                      : currentCorridor.riskScore === 'Moderate'
                      ? 'text-[#ffca72]'
                      : 'text-[#ff7189]'
                    : 'text-[#b7bad0]'
                }`}
              >
                {showLiveCalculation ? currentCorridor.riskScore : 'Validate'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry data rows matching Bento Grid specs */}
      <div className="pt-2 border-t border-[rgba(165,177,224,0.15)]">
        <div className="data-row">
          <span className="text-[#9297b1]">Vessel Speed</span>
          <span className="mono font-bold text-xs">{vesselSpeed} knt</span>
        </div>
        <div className="data-row">
          <span className="text-[#9297b1]">Fuel Reserve</span>
          <span className="mono font-bold text-xs">{fuelReserve}%</span>
        </div>
      </div>
    </div>
  );
};
