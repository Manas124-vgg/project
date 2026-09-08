import React, { useState } from 'react';

interface KpiStripProps {
  seaIceCoverage: number;
  icebergCount: number;
  routeConfidence: number;
  vesselStatus: string;
  ambientTempC?: number;
  windKnots?: number;
}

export const KpiStrip: React.FC<KpiStripProps> = ({
  seaIceCoverage,
  icebergCount,
  routeConfidence,
  vesselStatus,
  ambientTempC = -34.5,
  windKnots = 42,
}) => {
  // Allow toggling between prototype baseline and validated live dataset
  const [showValidated, setShowValidated] = useState<boolean>(true);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4" id="polarnav-bento-kpis">
      {/* Bento Card 1: Sea Ice Concentration */}
      <div className="bento-card p-5">
        <div className="flex justify-between items-center">
          <span className="card-title">Sea Ice Concentration</span>
          <span className="text-[#45e0d0] text-xs">◈</span>
        </div>

        <div className="big-stat my-1">
          {showValidated ? `${seaIceCoverage}%` : '—'}
        </div>

        <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden mt-3 mb-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${seaIceCoverage}%`,
              background: 'var(--accent)',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#9297b1] mt-1">
          <span>{showValidated ? 'Pack Ice / 7-8 Tenths' : 'Awaiting dataset'}</span>
          <button
            onClick={() => setShowValidated(!showValidated)}
            className="text-[10px] text-[#45e0d0] hover:underline cursor-pointer"
          >
            {showValidated ? 'raw' : 'validate'}
          </button>
        </div>
      </div>

      {/* Bento Card 2: Ambient Temperature */}
      <div className="bento-card p-5">
        <div className="flex justify-between items-center">
          <span className="card-title">Ambient Temperature</span>
          <span className="text-[#ff7189] text-xs">◌</span>
        </div>

        <div className="big-stat my-1 text-[#ff7189]">
          {showValidated ? `${ambientTempC}°C` : '—'}
        </div>

        <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden mt-3 mb-2">
          <div
            className="h-full rounded-full transition-all duration-700 bg-[#ff7189]"
            style={{ width: '68%' }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#9297b1] mt-1">
          <span>Trend: -2.1°/hr</span>
          <span className="text-[#ff7189] font-mono text-[10px]">Freezing</span>
        </div>
      </div>

      {/* Bento Card 3: Surface Wind Velocity */}
      <div className="bento-card p-5">
        <div className="flex justify-between items-center">
          <span className="card-title">Surface Wind</span>
          <span className="text-[#ffca72] text-xs">⌁</span>
        </div>

        <div className="big-stat my-1 text-[#f1f2fa]">
          {showValidated ? `${windKnots} KT` : '—'}
        </div>

        <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden mt-3 mb-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (windKnots / 60) * 100)}%`,
              background: 'linear-gradient(90deg, #ffca72, #ff7189)',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#9297b1] mt-1">
          <span>Direction: 142° SE</span>
          <span className="text-[#ffca72] font-mono text-[10px]">Katabatic</span>
        </div>
      </div>

      {/* Bento Card 4: Fleet & Vessel Status */}
      <div className="bento-card p-5">
        <div className="flex justify-between items-center">
          <span className="card-title">Vessel & Escort Status</span>
          <span className="text-[#66e2a3] text-xs">⚓</span>
        </div>

        <div className="big-stat my-1 text-[#66e2a3] flex items-center gap-2">
          <span>{vesselStatus}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#66e2a3] shadow-[0_0_10px_#66e2a3] animate-pulse" />
        </div>

        <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden mt-3 mb-2">
          <div
            className="h-full rounded-full transition-all duration-700 bg-[#66e2a3]"
            style={{ width: '92%' }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#9297b1] mt-1">
          <span>Contacts: <strong className="text-[#ffca72] font-mono">{String(icebergCount).padStart(2, '0')}</strong></span>
          <span className="text-[#66e2a3] font-mono text-[10px]">Route {routeConfidence}% Conf</span>
        </div>
      </div>
    </section>
  );
};
