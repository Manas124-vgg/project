import React, { useState } from 'react';
import { Iceberg } from '../types';

interface IcebergListProps {
  icebergs: Iceberg[];
  selectedIcebergId: string | null;
  onSelectIceberg: (id: string | null) => void;
  onNavigateToCatalog?: () => void;
}

export const IcebergList: React.FC<IcebergListProps> = ({
  icebergs,
  selectedIcebergId,
  onSelectIceberg,
  onNavigateToCatalog,
}) => {
  const [showCalculatedDistance, setShowCalculatedDistance] = useState<boolean>(true);

  // We display the primary 4 objects on the overview panel as in the prototype
  const displayBergs = icebergs.slice(0, 4);

  return (
    <div className="bento-card p-5 overflow-hidden flex flex-col justify-between" id="tracked-icebergs-panel">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center pb-3 border-b border-[rgba(165,177,224,0.15)] mb-2">
          <div>
            <div className="card-title mb-0">Tracked Iceberg Objects</div>
            <div className="text-[#9297b1] text-[10px]">
              Radar & SAR acoustic classification
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={() => setShowCalculatedDistance(!showCalculatedDistance)}
              className="text-[9px] text-[#45e0d0] hover:underline cursor-pointer"
              title="Toggle distance values"
            >
              {showCalculatedDistance ? 'raw' : 'ranges'}
            </button>

            <span
              className="badge border border-[rgba(69,224,208,0.25)] text-[#45e0d0] bg-[rgba(69,224,208,0.08)] rounded-md px-2 py-1 text-[9px] uppercase tracking-[1px] cursor-pointer"
              onClick={onNavigateToCatalog}
              title={`View all ${icebergs.length} tracked objects in catalog`}
            >
              {String(icebergs.length).padStart(2, '0')} Contacts
            </span>
          </div>
        </div>

        {/* Iceberg Rows */}
        <div className="space-y-1">
          {displayBergs.map((berg) => {
            const isSelected = berg.id === selectedIcebergId;

            return (
              <div
                key={berg.id}
                onClick={() => onSelectIceberg(isSelected ? null : berg.id)}
                className={`grid grid-cols-[32px_1fr_auto] items-center gap-3 py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[rgba(255,202,114,0.12)] border border-[rgba(255,202,114,0.3)] shadow-[0_0_12px_rgba(255,202,114,0.1)]'
                    : 'hover:bg-[rgba(255,255,255,0.03)] border border-transparent'
                }`}
              >
                {/* Symbol */}
                <div
                  className={`w-7 h-7 grid place-items-center rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-[rgba(255,202,114,0.25)] text-[#ffffff] shadow-[0_0_8px_#ffca72]'
                      : 'bg-[rgba(255,202,114,0.08)] text-[#ffca72]'
                  }`}
                >
                  ◇
                </div>

                {/* Names & Detail */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#f1f2fa] font-space">
                      {berg.code}
                    </span>
                    <span className="text-[10px] text-[#666b86] font-mono truncate max-w-[130px]">
                      {berg.name}
                    </span>
                  </div>
                  <div className="text-[#9297b1] text-[10px] truncate mt-0.5">
                    {berg.status}
                  </div>
                </div>

                {/* Distance Readout */}
                <div className="text-right pl-2">
                  <strong className="block mono text-xs font-bold">
                    {showCalculatedDistance ? `${berg.distanceNm} nm` : '—'}
                  </strong>
                  <span className="text-[#9297b1] text-[8px] uppercase tracking-wider block">
                    {berg.hazardLevel} haz
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catalog CTA */}
      <div className="pt-2 border-t border-[rgba(165,177,224,0.1)] flex justify-between items-center text-[10px]">
        <span className="text-[10px] text-[#666b86]">Total Corridor Trackers: {String(icebergs.length).padStart(2, '0')}</span>
        <button
          onClick={onNavigateToCatalog}
          className="text-[#45e0d0] hover:underline cursor-pointer font-medium"
        >
          Inspect Full Catalog →
        </button>
      </div>
    </div>
  );
};
