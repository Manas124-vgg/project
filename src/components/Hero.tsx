import React from 'react';

interface HeroProps {
  onRefreshData?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onRefreshData }) => {
  return (
    <section
      id="polarnav-hero"
      className="bento-card mb-4 p-5 lg:p-6 relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#45e0d0] shadow-[0_0_10px_#45e0d0] animate-ping" />
            <span className="card-title mb-0 text-[#45e0d0]">Antarctic Operations Area</span>
          </div>

          <h1 className="font-space text-xl sm:text-2xl font-bold text-[#f1f2fa] tracking-tight">
            Sector 7G-Delta · Weddell Sea Basin
          </h1>

          <p className="mt-1 text-[#9297b1] text-xs max-w-[650px] leading-relaxed">
            Real-time polar telemetry, SAR sea-ice thickness mapping, and predictive iceberg drift modeling for deep-field navigation.
          </p>
        </div>

        {/* Action badges */}
        <div className="flex flex-wrap md:flex-col lg:flex-row items-start md:items-end gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(165,177,224,0.12)] text-[11px] font-mono text-[#b7bad0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#66e2a3]" />
            SAR RADARSAT-2 Synced
          </div>

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(69,224,208,0.1)] hover:bg-[rgba(69,224,208,0.2)] border border-[rgba(69,224,208,0.3)] text-[11px] font-mono text-[#45e0d0] transition-colors cursor-pointer"
            >
              <span>↻</span> Ingest Telemetry
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
