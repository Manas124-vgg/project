import React, { useState } from 'react';
import { EnvironmentalCondition } from '../types';

interface EnvironmentalPanelProps {
  environment: EnvironmentalCondition;
}

export const EnvironmentalPanel: React.FC<EnvironmentalPanelProps> = ({
  environment,
}) => {
  const [showLiveMetrics, setShowLiveMetrics] = useState<boolean>(true);

  return (
    <div className="bento-card" id="environmental-context-panel">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-[rgba(165,177,224,0.15)] mb-3">
        <div>
          <div className="card-title mb-0">Environmental Sensor Context</div>
          <div className="text-[#9297b1] text-[10px]">
            Calibrated telemetry array
          </div>
        </div>

        <button
          onClick={() => setShowLiveMetrics(!showLiveMetrics)}
          className="border border-[rgba(69,224,208,0.25)] text-[#45e0d0] bg-[rgba(69,224,208,0.06)] hover:bg-[rgba(69,224,208,0.14)] rounded-lg px-2 py-1 text-[9px] uppercase tracking-[1px] font-semibold transition-colors cursor-pointer font-mono"
          title="Click to toggle between baseline / simulated sensor readings"
        >
          {showLiveMetrics ? 'Live Sensors' : 'Monitoring'}
        </button>
      </div>

      {/* Bento Conditions Data Rows */}
      <div className="space-y-1">
        {/* Sea Ice */}
        <div className="data-row">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-[rgba(139,124,255,0.1)] grid place-items-center text-xs">
              🧊
            </span>
            <div>
              <span className="text-[#f1f2fa] font-medium block leading-tight">Sea Ice</span>
              <span className="text-[#9297b1] text-[10px]">
                {showLiveMetrics ? `${environment.seaIceThicknessM}m avg / pack floes` : 'Observation status'}
              </span>
            </div>
          </div>
          <div className="mono font-bold text-sm">
            {showLiveMetrics ? `${environment.seaIceCoveragePct}%` : '—'}
          </div>
        </div>

        {/* Ocean Current */}
        <div className="data-row">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-[rgba(69,224,208,0.1)] grid place-items-center text-xs">
              🌊
            </span>
            <div>
              <span className="text-[#f1f2fa] font-medium block leading-tight">Ocean Current</span>
              <span className="text-[#9297b1] text-[10px]">
                {showLiveMetrics ? environment.oceanCurrentDir : 'Direction / velocity'}
              </span>
            </div>
          </div>
          <div className="mono font-bold text-sm text-[#45e0d0]">
            {showLiveMetrics ? `${environment.oceanCurrentSpeedKn} kn` : '—'}
          </div>
        </div>

        {/* Wind */}
        <div className="data-row">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-[rgba(255,202,114,0.1)] grid place-items-center text-xs">
              ◌
            </span>
            <div>
              <span className="text-[#f1f2fa] font-medium block leading-tight">Surface Wind</span>
              <span className="text-[#9297b1] text-[10px]">
                {showLiveMetrics ? `${environment.windDir} · Gust ${environment.windGustKn} kn` : 'Environmental forcing'}
              </span>
            </div>
          </div>
          <div className="mono font-bold text-sm text-[#ffca72]">
            {showLiveMetrics ? `${environment.windSpeedKn} kn` : '—'}
          </div>
        </div>

        {/* Visibility */}
        <div className="data-row">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-[rgba(102,226,163,0.1)] grid place-items-center text-xs">
              ☁
            </span>
            <div>
              <span className="text-[#f1f2fa] font-medium block leading-tight">Visibility</span>
              <span className="text-[#9297b1] text-[10px]">
                {showLiveMetrics ? environment.visibilityStatus : 'Operational condition'}
              </span>
            </div>
          </div>
          <div className="mono font-bold text-sm text-[#66e2a3]">
            {showLiveMetrics ? `${environment.visibilityKm} km` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
};
