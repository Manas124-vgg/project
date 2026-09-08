import React, { useState } from 'react';
import { Iceberg } from '../../types';

interface IcebergTrackingViewProps {
  icebergs: Iceberg[];
  selectedIcebergId: string | null;
  onSelectIceberg: (id: string | null) => void;
}

export const IcebergTrackingView: React.FC<IcebergTrackingViewProps> = ({
  icebergs,
  selectedIcebergId,
  onSelectIceberg,
}) => {
  const [filterHazard, setFilterHazard] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredBergs = icebergs.filter((b) => {
    const matchFilter = filterHazard === 'all' || b.hazardLevel === filterHazard;
    const matchSearch =
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.status.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-4" id="view-iceberg-tracking">
      {/* Header Banner */}
      <div className="panel glass p-6 rounded-[22px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] text-[#ffca72] uppercase tracking-[1.5px] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-[#ffca72] shadow-[0_0_8px_#ffca72]" />
            National Ice Center (NIC) & Satellite Radar Feeds
          </div>
          <h2 className="font-space text-2xl font-bold text-[#f1f2fa]">
            Tracked Iceberg Trajectories & Collision Avoidance
          </h2>
          <p className="text-xs text-[#9297b1] mt-1 max-w-2xl leading-relaxed">
            Continuously updated position, drift vectors, and keel draft estimates for identified tabular and non-tabular icebergs within the operational corridor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[rgba(255,202,114,0.1)] border border-[rgba(255,202,114,0.25)] text-[#ffca72] text-xs font-mono font-bold">
            07 Active Objects
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-[rgba(255,113,137,0.1)] border border-[rgba(255,113,137,0.25)] text-[#ff7189] text-xs font-mono font-bold">
            1 High Vigilance
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'high', 'moderate', 'low'].map((haz) => (
            <button
              key={haz}
              onClick={() => setFilterHazard(haz)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer border ${
                filterHazard === haz
                  ? 'bg-[rgba(139,124,255,0.15)] text-[#f1f2fa] border-[rgba(139,124,255,0.3)]'
                  : 'bg-[rgba(255,255,255,0.02)] text-[#9297b1] border-[rgba(165,177,224,0.1)] hover:text-[#f1f2fa]'
              }`}
            >
              {haz === 'all' ? 'All Hazard Levels' : `${haz} hazard`}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search iceberg ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(165,177,224,0.15)] text-[#f1f2fa] placeholder-[#666b86] focus:outline-hidden focus:border-[#45e0d0]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1.5 text-[#9297b1] hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Iceberg Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBergs.map((berg) => {
          const isSelected = berg.id === selectedIcebergId;

          return (
            <div
              key={berg.id}
              onClick={() => onSelectIceberg(isSelected ? null : berg.id)}
              className={`panel glass p-5 rounded-[20px] transition-all cursor-pointer border ${
                isSelected
                  ? 'border-[rgba(255,202,114,0.4)] bg-[rgba(255,202,114,0.04)] shadow-[0_8px_25px_rgba(255,202,114,0.1)]'
                  : 'hover:border-[rgba(165,177,224,0.25)]'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(255,202,114,0.1)] grid place-items-center text-[#ffca72] font-mono font-bold text-xs">
                    {berg.code}
                  </div>
                  <div>
                    <h3 className="font-space text-sm font-bold text-[#f1f2fa]">
                      {berg.name}
                    </h3>
                    <span className="text-[10px] text-[#9297b1]">{berg.sizeCategory}</span>
                  </div>
                </div>

                <span
                  className={`text-[9px] uppercase px-2 py-0.5 rounded font-mono font-semibold border ${
                    berg.hazardLevel === 'high'
                      ? 'bg-[rgba(255,113,137,0.1)] text-[#ff7189] border-[rgba(255,113,137,0.3)]'
                      : berg.hazardLevel === 'moderate'
                      ? 'bg-[rgba(255,202,114,0.1)] text-[#ffca72] border-[rgba(255,202,114,0.3)]'
                      : 'bg-[rgba(102,226,163,0.1)] text-[#66e2a3] border-[rgba(102,226,163,0.3)]'
                  }`}
                >
                  {berg.hazardLevel}
                </span>
              </div>

              <div className="space-y-1.5 text-xs py-2 border-y border-[rgba(255,255,255,0.05)] font-mono">
                <div className="flex justify-between">
                  <span className="text-[#9297b1]">Dimensions:</span>
                  <span className="text-[#f1f2fa]">{berg.dimensions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9297b1]">Draft Depth:</span>
                  <span className="text-[#6ddcff]">{berg.draftM} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9297b1]">Position:</span>
                  <span className="text-[#b7bad0]">{berg.latDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9297b1]">Drift Velocity:</span>
                  <span className="text-[#45e0d0]">
                    {berg.driftSpeedKnots} kn @ {berg.driftHeadingDeg}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9297b1]">Distance to Route:</span>
                  <strong className="text-[#ffca72] font-bold">{berg.distanceNm} nm</strong>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-[#9297b1] leading-normal line-clamp-2">
                {berg.notes}
              </div>

              <div className="mt-3 pt-2 flex justify-between items-center text-[10px] text-[#666b86]">
                <span>Radar: {berg.radarCrossSection}</span>
                <span className="text-[#8b7cff] font-medium">
                  {isSelected ? 'Selected (Tracking on Map)' : 'Click to Target'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
